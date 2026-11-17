import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  PlanetHero,
  ORBIT_LABELS,
  CONFIG,
  projectOrbit,
  type PlanetHeroHandle,
  type OrbitItem,
  type OrbitFramePos,
} from '../PlanetHero';

/**
 * PlanetSection — Wrapper de PlanetHero (planeta como sección propia).
 * PlanetHero solo expone `onOrbitFrame` (callback por frame con las 8 posiciones).
 *
 * 1. Transición hero→papel en UNA sola curva (overlay blanco que se desvanece sobre el papel).
 * 2. Papel cuadriculado con bordes laterales/inferior difuminados.
 * 3. Halo suave detrás del globo.
 * 4. Marcas decorativas tenues.
 * 5. Trayectorias dinámicas: trazo continuo de cada órbita, anillo que sigue al satélite
 *    y estela que se desvanece en los 4 círculos. Un solo rAF (el de PlanetHero).
 */

const INK_MARK = '#191510';

const TRAJ_SAMPLES = 160;
const TRAJ_STROKE = 'rgba(25, 21, 16, 0.2)';
const TRAJ_STROKE_FAINT = 'rgba(25, 21, 16, 0.08)';
const RING_STROKE = '#2F6F6B';
const WAKE_STROKE = '25, 21, 16';
const WAKE_FRAMES = 48; // ~0.8 s a 60 fps
const WAKE_SEGMENTS = 8;
const N_LABELS = ORBIT_LABELS.length;
const N_ORBITS = N_LABELS + CONFIG.circleOrbits.length;
const N_CIRCLES = N_ORBITS - N_LABELS;
const CIRCLE_RADIUS_DESKTOP = 45; // w-[90px] en PlanetHero (md+)
const LABEL_RING_RADIUS = 5;

/* Blanco del hero → papel en una sola curva (easeOutCubic muestreada; sin escalones). */
const HERO_FADE = `linear-gradient(to bottom, ${[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]
  .map((t) => `rgba(255,255,255,${(1 - (1 - (1 - t) ** 3)).toFixed(3)}) ${(t * 100).toFixed(0)}%`)
  .join(', ')})`;

type TrajGeom = { w: number; h: number; cx: number; cy: number; paths: { id: string; d: string }[] };

const buildTrajectories = (w: number, h: number, cx: number, cy: number, radius: number): TrajGeom => {
  const orbits: OrbitItem[] = [...ORBIT_LABELS, ...CONFIG.circleOrbits];
  const paths: TrajGeom['paths'] = [];
  for (const orbit of orbits) {
    let d = '';
    // projectOrbit toma t en SEGUNDOS: se barre un período completo para cerrar la elipse.
    for (let k = 0; k < TRAJ_SAMPLES; k++) {
      const p = projectOrbit(orbit, (k / TRAJ_SAMPLES) * orbit.period, radius);
      d += `${k === 0 ? 'M' : 'L'}${(cx + p.x).toFixed(1)} ${(cy - p.y).toFixed(1)}`;
    }
    paths.push({ id: orbit.id ?? 'orbit', d: `${d}Z` });
  }
  return { w, h, cx, cy, paths };
};

const MarkPlus: React.FC<{ size?: number; className?: string; style?: React.CSSProperties }> = ({
  size = 12,
  className = '',
  style,
}) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none" aria-hidden="true" className={className} style={style}>
    <path d="M6 1v10M1 6h10" stroke={INK_MARK} strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const MarkX: React.FC<{ size?: number; className?: string; style?: React.CSSProperties }> = ({
  size = 11,
  className = '',
  style,
}) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none" aria-hidden="true" className={className} style={style}>
    <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" stroke={INK_MARK} strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const MarkStar: React.FC<{ size?: number; className?: string; style?: React.CSSProperties }> = ({
  size = 14,
  className = '',
  style,
}) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" className={className} style={style}>
    <path d="M8 2v12M2 8h12M3.8 3.8l8.4 8.4M3.8 12.2l8.4-8.4" stroke={INK_MARK} strokeWidth="1.1" strokeLinecap="round" />
  </svg>
);

export const PlanetSection: React.FC = () => {
  const heroRef = useRef<PlanetHeroHandle>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const [traj, setTraj] = useState<TrajGeom | null>(null);

  // Refs DOM de la capa dinámica (se escriben directo, sin re-render por frame)
  const ringRefs = useRef<(SVGCircleElement | null)[]>([]);
  const wakeRefs = useRef<(SVGPathElement | null)[]>([]); // [circleIdx * WAKE_SEGMENTS + seg]
  const histRef = useRef<Float32Array>(new Float32Array(N_CIRCLES * WAKE_FRAMES * 2));
  const histLenRef = useRef(0);
  const histHeadRef = useRef(0);
  // Centro de anclaje de los satélites (centro del contenedor de PlanetHero) en coords del wrap
  const centerRef = useRef({ x: 0, y: 0 });

  const computeTrajectories = useCallback(() => {
    const wrap = canvasWrapRef.current;
    const anchor = wrap?.querySelector<HTMLElement>('[data-planet-canvas-wrap]');
    const metrics = heroRef.current?.getPlanetMetrics?.();
    if (!wrap || !anchor || !metrics) return;
    const ar = anchor.getBoundingClientRect();
    const wr = wrap.getBoundingClientRect();
    const cx = ar.left - wr.left + ar.width / 2;
    const cy = ar.top - wr.top + ar.height / 2;
    centerRef.current = { x: cx, y: cy };
    // Al cambiar el tamaño, la estela vieja quedaría en coordenadas viejas: se reinicia.
    histLenRef.current = 0;
    setTraj(buildTrajectories(Math.round(wr.width), Math.round(wr.height), cx, cy, metrics.radius));
  }, []);

  // Callback por frame de PlanetHero: mueve anillos y estela. Cero React state.
  const onOrbitFrame = useCallback((pos: OrbitFramePos[]) => {
    const { x: cx, y: cy } = centerRef.current;
    const rings = ringRefs.current;
    for (let i = 0; i < N_ORBITS; i++) {
      const r = rings[i];
      const p = pos[i];
      if (!r || !p) continue;
      const front = (p.zNorm + 1) / 2;
      r.setAttribute('cx', (cx + p.x).toFixed(1));
      r.setAttribute('cy', (cy + p.y).toFixed(1));
      if (i >= N_LABELS) r.setAttribute('r', (CIRCLE_RADIUS_DESKTOP * p.scale + 7).toFixed(1));
      r.setAttribute('opacity', (0.15 + 0.85 * front).toFixed(2));
    }
    // Historial circular de los 4 círculos
    const hist = histRef.current;
    const head = histHeadRef.current;
    const nC = N_CIRCLES;
    for (let c = 0; c < nC; c++) {
      const p = pos[N_LABELS + c];
      const o = (c * WAKE_FRAMES + head) * 2;
      hist[o] = cx + p.x;
      hist[o + 1] = cy + p.y;
    }
    histHeadRef.current = (head + 1) % WAKE_FRAMES;
    if (histLenRef.current < WAKE_FRAMES) histLenRef.current++;
    const len = histLenRef.current;
    const per = Math.max(2, Math.floor(len / WAKE_SEGMENTS));
    for (let c = 0; c < nC; c++) {
      for (let sgm = 0; sgm < WAKE_SEGMENTS; sgm++) {
        const el = wakeRefs.current[c * WAKE_SEGMENTS + sgm];
        if (!el) continue;
        // sgm 0 = tramo más viejo, WAKE_SEGMENTS-1 = más reciente
        const from = sgm * per;
        const to = Math.min(len - 1, from + per);
        if (from >= len - 1) { el.setAttribute('d', ''); continue; }
        let d = '';
        for (let k = from; k <= to; k++) {
          // k=0 es el más viejo: índice circular
          const idx = (head - len + 1 + k + WAKE_FRAMES * 2) % WAKE_FRAMES;
          const o = (c * WAKE_FRAMES + idx) * 2;
          d += `${k === from ? 'M' : 'L'}${hist[o].toFixed(1)} ${hist[o + 1].toFixed(1)}`;
        }
        el.setAttribute('d', d);
      }
    }
  }, []);

  useEffect(() => {
    computeTrajectories();
    const wrap = canvasWrapRef.current;
    if (!wrap || typeof ResizeObserver === 'undefined') return;
    let raf = 0;
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(computeTrajectories);
    };
    const ro = new ResizeObserver(schedule);
    ro.observe(wrap);
    window.addEventListener('resize', schedule);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', schedule);
      cancelAnimationFrame(raf);
    };
  }, [computeTrajectories]);

  return (
    <section
      data-section="planet"
      aria-label="Presentación interactiva del portafolio"
      className="relative w-full overflow-visible pt-[14px] sm:pt-[92px] lg:pt-[100px]"
      style={{
        isolation: 'isolate',
        zIndex: 'var(--z-planet, 10)',
      }}
    >
      {/* Neutraliza los márgenes verticales del wrapper interno de PlanetHero (mt-6/sm:mt-8/md:mt-4/lg:mt-10)
          para controlar el aire hero→globo desde aquí, vía data-attribute estable (agregado en PlanetHero.tsx) */}
      <style>{`[data-section="planet"] [data-planet-canvas-wrap] { margin-top: 0; }
@media (prefers-reduced-motion: reduce) { [data-section="planet"] .orbit-traj-svg { display: none; } }
@media (max-width: 639px) { [data-section="planet"] .orbit-traj-svg { display: none; } }`}</style>
      {/* 1. Papel cuadriculado con bordes difuminados en los 4 lados (sin cortes duros) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none select-none"
        style={{ zIndex: 0 }}
      >
        <div
          className="w-full h-full"
          style={{
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)',
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)',
          }}
        >
          <div
            className="w-full h-full paper-grid bg-[var(--color-paper,#efece1)]"
            style={{
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
              maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
            }}
          />
        </div>
      </div>

      {/* 1b. Transición hero→papel: el blanco del hero continúa y se disuelve sobre el papel
             en una sola curva (sin banda ni escalón en el borde del hero). */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 pointer-events-none select-none h-[22svh] sm:h-[34svh]"
        style={{ background: HERO_FADE, zIndex: 0 }}
      />

      {/* 2. Halo suave detrás del globo (~130% del diámetro: 910px desktop · 68.5vw tablet · 97vw mobile;
             el centro del globo queda pt/2 por debajo del centro de la sección) */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-[calc(50%+27px)] sm:top-[calc(50%+46px)] xl:top-[calc(50%+50px)] -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none rounded-full w-[97vw] h-[97vw] sm:w-[68.5vw] sm:h-[68.5vw] xl:w-[910px] xl:h-[910px]"
        style={{
          background:
            'radial-gradient(circle, rgba(255, 255, 255, 0.72) 0%, rgba(254, 251, 240, 0.42) 42%, rgba(239, 236, 225, 0) 72%)',
          zIndex: 1,
        }}
      />

      {/* 3. Marcas decorativas tenues perimetrales (fuera del área del globo y de las órbitas) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none select-none overflow-hidden"
        style={{ zIndex: 2 }}
      >
        {/* Flanco izquierdo (fuera del alcance orbital: 1.70×radio desde el centro) */}
        <MarkStar className="hidden md:block absolute left-[8%] top-[10%] opacity-35" />
        <MarkPlus className="hidden md:block absolute left-[18%] top-[18%] opacity-35" />
        <MarkX className="hidden md:block absolute left-[12%] top-[38%] opacity-30" />
        <MarkPlus className="hidden sm:block absolute left-[9%] bottom-[22%] opacity-35" />

        {/* Centro inferior (bajo el disco, fuera de órbitas) */}
        <MarkX className="hidden lg:block absolute left-[30%] bottom-[2%] opacity-35" />

        {/* Flanco derecho */}
        <MarkPlus className="hidden sm:block absolute right-[14%] top-[12%] opacity-35" />
        <MarkX className="hidden md:block absolute right-[16%] top-[22%] opacity-30" />
        <span
          className="hidden md:inline-flex absolute right-[4%] top-[38%] gap-1.5 opacity-35"
        >
          <span className="w-1 h-1 rounded-full bg-[#191510]" />
          <span className="w-1 h-1 rounded-full bg-[#191510]" />
        </span>
        <span
          className="hidden sm:inline-block absolute right-[7%] bottom-[16%] w-1 h-1 rounded-full bg-[#191510] opacity-35"
        />
      </div>

      {/* 4. Planeta con órbitas (PlanetHero intacto) */}
      <div
        ref={canvasWrapRef}
        className="relative w-full max-w-[1280px] mx-auto px-2 sm:px-4 overflow-visible"
        style={{ isolation: 'isolate', zIndex: 'var(--z-planet, 10)' }}
      >
        {/* 4a. Trayectorias orbitales estáticas (8 elipses + 3 nodos en anillo).
            Debajo del canvas: el disco crema del planeta tapa el tramo trasero.
            En prefers-reduced-motion los elementos usan posiciones fijas ajenas
            a las órbitas → la capa se oculta para no mostrar un trazado falso.
            En <640px la capa se oculta (decisión de Claude): PlanetHero comprime
            y clampa la X de los elementos, el trazado no coincidiría (deuda:
            órbitas mobile, junto al apiñamiento de labels). */}
        {traj && (
          <svg
            aria-hidden="true"
            className="absolute left-0 top-0 pointer-events-none select-none orbit-traj-svg"
            width={traj.w}
            height={traj.h}
            style={{ zIndex: 3, overflow: 'visible' }}
          >
            {traj.paths.map((p, i) => (
              <path
                key={p.id}
                data-orbit-path={p.id}
                d={p.d}
                fill="none"
                stroke={i < N_LABELS ? TRAJ_STROKE_FAINT : TRAJ_STROKE}
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {Array.from({ length: N_CIRCLES * WAKE_SEGMENTS }, (_, i) => {
              const seg = i % WAKE_SEGMENTS; // 0 = más viejo
              const a = ((seg + 1) / WAKE_SEGMENTS) ** 1.6;
              return (
                <path
                  key={`wake-${i}`}
                  ref={(el) => {
                    wakeRefs.current[i] = el;
                  }}
                  fill="none"
                  stroke={`rgba(${WAKE_STROKE}, ${(0.55 * a).toFixed(3)})`}
                  strokeWidth={(0.6 + 1.6 * a).toFixed(2)}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            })}
            {Array.from({ length: N_ORBITS }, (_, i) => (
              <circle
                key={`ring-${i}`}
                ref={(el) => {
                  ringRefs.current[i] = el;
                }}
                cx={-100}
                cy={-100}
                r={i < N_LABELS ? LABEL_RING_RADIUS : CIRCLE_RADIUS_DESKTOP + 7}
                fill="none"
                stroke={RING_STROKE}
                strokeWidth="1"
                opacity={0}
              />
            ))}
          </svg>
        )}
        <PlanetHero ref={heroRef} onOrbitFrame={onOrbitFrame} />
      </div>
    </section>
  );
};
