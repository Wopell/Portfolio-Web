import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PlanetHero, ORBIT_LABELS, CONFIG, type PlanetHeroHandle, type OrbitFramePos, type OrbitItem } from '../PlanetHero';

/**
 * PlanetSection — el planeta como sección propia, con aire arriba y abajo para que
 * ninguna órbita pase por debajo del hero.
 *
 * Las órbitas no están dibujadas enteras: detrás de cada objeto queda un rastro
 * punteado sobre su elipse real, que se va desvaneciendo. Los puntos están fijos en
 * la órbita (el objeto los va dejando) y arrancan a unos px del borde del objeto, así
 * no se ve de dónde nacen aunque el objeto esté detrás y semitransparente. Lo que está
 * delante del globo se dibuja encima del globo; lo que está detrás, debajo (el disco
 * lo tapa). Cada tanto un cometa cruza por detrás. Un solo rAF: el de PlanetHero.
 */

const INK = '25, 21, 16';
const N_DECOR = ORBIT_LABELS.length; // órbitas 0..3: objetos decorativos
const N_ITEMS = N_DECOR + CONFIG.circleOrbits.length; // 4..7: círculos de trabajos
const ORBITS: OrbitItem[] = [...ORBIT_LABELS, ...CONFIG.circleOrbits];

/* rastro punteado */
const isCircle = (i: number) => i >= N_DECOR;
const TRAIL_SPAN = (i: number) => (isCircle(i) ? 0.42 : 0.3) * Math.PI * 2; // 151° círculos, 108° objetos
const DOT_STEP_PX = (i: number) => (isCircle(i) ? 9 : 10); // separación entre puntos sobre la órbita
const DOT_SIZE = (i: number) => (isCircle(i) ? 2.6 : 2); // diámetro del punto
const TRAIL_ALPHA = (i: number) => (isCircle(i) ? 0.55 : 0.4);
const HEAD_GAP = 8; // px libres entre el borde del objeto y el primer punto
const BUCKETS = 8; // tramos de opacidad, del más viejo al más nuevo

/* punto de una órbita en el ángulo t (misma cuenta que projectOrbit), en px de pantalla */
const orbitPoint = (o: OrbitItem, t: number, R: number, hx: number) => {
  const r = o.radiusMultiplier * R;
  const x0 = r * Math.cos(t);
  const y0 = r * Math.sin(t);
  const y1 = y0 * Math.cos(o.tiltX);
  const z = -y0 * Math.sin(o.tiltX);
  const cz = Math.cos(o.tiltZ);
  const sz = Math.sin(o.tiltZ);
  return { x: (x0 * cz - y1 * sz) * hx, y: -(x0 * sz + y1 * cz), z };
};

/* cometa: recorridos en radios del planeta (x a la derecha, y hacia abajo) */
// (el contenedor del planeta recorta a ±1.85 radios en desktop: el cometa nace y
//  muere adentro, con un fundido, en vez de entrar cortado por el borde)
const COMET_PATHS = [
  { from: [-1.8, -1.2], to: [1.8, 0.1] },
  { from: [1.8, -0.95], to: [-1.8, 0.4] },
  { from: [-1.75, 1.15], to: [1.75, -0.3] },
];
const COMET_MS = 1300;
const COMET_GAP = () => 9000 + Math.random() * 7000;

const INK_MARK = '#191510';

const MarkPlus: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg width={12} height={12} viewBox="0 0 12 12" fill="none" aria-hidden="true" className={className}>
    <path d="M6 1v10M1 6h10" stroke={INK_MARK} strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const MarkX: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg width={11} height={11} viewBox="0 0 12 12" fill="none" aria-hidden="true" className={className}>
    <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" stroke={INK_MARK} strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const MarkStar: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg width={14} height={14} viewBox="0 0 16 16" fill="none" aria-hidden="true" className={className}>
    <path d="M8 2v12M2 8h12M3.8 3.8l8.4 8.4M3.8 12.2l8.4-8.4" stroke={INK_MARK} strokeWidth="1.1" strokeLinecap="round" />
  </svg>
);

/* Blanco del hero → papel en una sola curva (easeOutCubic muestreada; sin escalones). */
const HERO_FADE = `linear-gradient(to bottom, ${[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]
  .map((t) => `rgba(255,255,255,${(1 - (1 - (1 - t) ** 3)).toFixed(3)}) ${(t * 100).toFixed(0)}%`)
  .join(', ')})`;

const prefersReduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

type Layer = 0 | 1; // 0 = detrás del globo, 1 = delante

export const PlanetSection: React.FC = () => {
  const heroRef = useRef<PlanetHeroHandle>(null);
  const [reduced] = useState(prefersReduced);

  // tamaño del contenedor del planeta: las capas centran su origen ahí
  const [box, setBox] = useState({ w: 0, h: 0 });
  const boxRef = useRef(box);
  boxRef.current = box;

  // rastros: grupo por [item][layer] (lleva el parallax) y trazos por [item][bucket][layer]
  const groupRefs = useRef<(SVGGElement | null)[]>([]);
  const trailRefs = useRef<(SVGPathElement | null)[]>([]);
  // último punto más nuevo dibujado por objeto (solo se rearma cuando cambia)
  const lastDot = useRef<number[]>(Array(N_ITEMS).fill(NaN));
  const lastPara = useRef<string[]>(Array(N_ITEMS).fill(''));
  // diámetro en reposo de cada objeto (para dejar libre su borde)
  const sizes = useRef<number[]>(Array(N_ITEMS).fill(0));
  const dirty = useRef(true);

  // cometa
  const cometLine = useRef<SVGLineElement>(null);
  const cometHead = useRef<SVGCircleElement>(null);
  const cometGrad = useRef<SVGLinearGradientElement>(null);
  const comet = useRef({ start: 0, next: 0, path: 0 });

  const onOrbitFrame = useCallback((pos: OrbitFramePos[]) => {
    const now = performance.now();
    const R = heroRef.current?.getPlanetMetrics().radius ?? 0;
    if (!R) return;
    const force = dirty.current;
    dirty.current = false;

    // 1. rastros punteados
    const segs: string[] = Array(BUCKETS * 2);
    for (let i = 0; i < N_ITEMS; i++) {
      const p = pos[i];
      const o = ORBITS[i];

      // el parallax del cursor mueve el rastro junto con su objeto
      const para = `translate(${p.paraX.toFixed(1)} ${p.paraY.toFixed(1)})`;
      if (para !== lastPara.current[i]) {
        lastPara.current[i] = para;
        groupRefs.current[i * 2]?.setAttribute('transform', para);
        groupRefs.current[i * 2 + 1]?.setAttribute('transform', para);
      }

      // los puntos están en ángulos fijos de la órbita: se rearma solo al pasar al siguiente
      const step = DOT_STEP_PX(i) / (o.radiusMultiplier * R);
      const dir = o.direction >= 0 ? 1 : -1;
      const newest = dir > 0 ? Math.floor(p.angle / step) : Math.ceil(p.angle / step);
      if (!force && newest === lastDot.current[i]) continue;
      lastDot.current[i] = newest;

      for (let s = 0; s < segs.length; s++) segs[s] = '';
      const span = TRAIL_SPAN(i);
      const n = Math.floor(span / step);
      // centro del objeto sin parallax y radio libre alrededor
      const ox = p.x - p.paraX;
      const oy = p.y - p.paraY;
      const free = (sizes.current[i] * p.scale) / 2 + HEAD_GAP;
      const free2 = free * free;
      for (let s = 0; s <= n; s++) {
        const t = (newest - dir * s) * step;
        const age = Math.abs(p.angle - t) / span; // 0 = recién dejado, 1 = el más viejo
        if (age > 1) break;
        const q = orbitPoint(o, t, R, p.hx);
        const dx = q.x - ox;
        const dy = q.y - oy;
        if (dx * dx + dy * dy < free2) continue;
        const b = Math.min(BUCKETS - 1, Math.floor((1 - age) * BUCKETS));
        const layer: Layer = q.z >= 0 ? 1 : 0;
        segs[b * 2 + layer] += `M${q.x.toFixed(1)} ${q.y.toFixed(1)}h0`;
      }
      for (let b = 0; b < BUCKETS; b++) {
        const base = (i * BUCKETS + b) * 2;
        trailRefs.current[base]?.setAttribute('d', segs[b * 2]);
        trailRefs.current[base + 1]?.setAttribute('d', segs[b * 2 + 1]);
      }
    }

    // 2. cometa: cruza por detrás del globo cada 9–16 s
    const line = cometLine.current;
    const dot = cometHead.current;
    const grad = cometGrad.current;
    if (!line || !dot || !grad) return;
    const c = comet.current;
    if (!c.next) c.next = now + 3500;
    if (!c.start && now >= c.next) {
      c.start = now;
      c.path = (c.path + 1) % COMET_PATHS.length;
    }
    if (!c.start) return;
    const t = (now - c.start) / COMET_MS;
    if (t >= 1) {
      c.start = 0;
      c.next = now + COMET_GAP();
      line.setAttribute('opacity', '0');
      dot.setAttribute('opacity', '0');
      return;
    }
    const { from, to } = COMET_PATHS[c.path];
    const x = (from[0] + (to[0] - from[0]) * t) * R;
    const y = (from[1] + (to[1] - from[1]) * t) * R;
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    const m = Math.hypot(dx, dy);
    const tail = 0.7 * R;
    const tx = x - (dx / m) * tail;
    const ty = y - (dy / m) * tail;
    const op = Math.min(1, t / 0.12, (1 - t) / 0.25).toFixed(2);
    line.setAttribute('x1', tx.toFixed(1));
    line.setAttribute('y1', ty.toFixed(1));
    line.setAttribute('x2', x.toFixed(1));
    line.setAttribute('y2', y.toFixed(1));
    grad.setAttribute('x1', tx.toFixed(1));
    grad.setAttribute('y1', ty.toFixed(1));
    grad.setAttribute('x2', x.toFixed(1));
    grad.setAttribute('y2', y.toFixed(1));
    line.setAttribute('opacity', op);
    dot.setAttribute('cx', x.toFixed(1));
    dot.setAttribute('cy', y.toFixed(1));
    dot.setAttribute('opacity', op);
  }, []);

  // tamaño del contenedor del planeta (las capas viven adentro) y de cada objeto
  const measure = useCallback(() => {
    const el = document.querySelector<HTMLElement>('[data-section="planet"] [data-planet-canvas-wrap]');
    if (!el) return;
    const items = [...el.querySelectorAll<HTMLElement>(':scope > .absolute.will-change-transform')];
    items.forEach((it, i) => {
      if (i >= N_ITEMS) return;
      // círculo: el diámetro de la lente (sin la plaquita); objeto: su lado mayor
      // (offsetWidth no incluye la escala de profundidad: esa se aplica en cada cuadro)
      const lens = isCircle(i) ? it.querySelector<HTMLElement>('div') : it;
      sizes.current[i] = lens ? Math.max(lens.offsetWidth, lens.offsetHeight) : 0;
    });
    dirty.current = true;
    const w = el.clientWidth;
    const h = el.clientHeight;
    if (w !== boxRef.current.w || h !== boxRef.current.h) setBox({ w, h });
  }, []);

  useEffect(() => {
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const el = document.querySelector<HTMLElement>('[data-section="planet"] [data-planet-canvas-wrap]');
    let raf = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    });
    if (el) ro.observe(el);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [measure]);

  // al re-renderizar las capas, los trazos nuevos arrancan vacíos: rearmar todo
  useEffect(() => {
    dirty.current = true;
  }, [box]);

  const center = `translate(${(box.w / 2).toFixed(1)} ${(box.h / 2).toFixed(1)})`;

  const trails = (layer: Layer) =>
    Array.from({ length: N_ITEMS }, (_, i) => (
      <g
        key={`g-${i}`}
        ref={(el) => {
          groupRefs.current[i * 2 + layer] = el;
        }}
      >
        {Array.from({ length: BUCKETS }, (_, b) => {
          const a = ((b + 1) / BUCKETS) ** 1.3;
          return (
            <path
              key={`t-${b}`}
              ref={(el) => {
                trailRefs.current[(i * BUCKETS + b) * 2 + layer] = el;
              }}
              fill="none"
              stroke={`rgba(${INK}, ${(TRAIL_ALPHA(i) * a).toFixed(3)})`}
              strokeWidth={(DOT_SIZE(i) * (0.7 + 0.3 * a)).toFixed(2)}
              strokeLinecap="round"
            />
          );
        })}
      </g>
    ));

  const under =
    !reduced && box.w > 0 ? (
      <svg className="absolute inset-0" width={box.w} height={box.h} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient ref={cometGrad} id="planet-comet" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#191510" stopOpacity="0" />
            <stop offset="1" stopColor="#191510" stopOpacity="0.8" />
          </linearGradient>
        </defs>
        <g transform={center}>
          <line ref={cometLine} stroke="url(#planet-comet)" strokeWidth="1.8" strokeLinecap="round" opacity="0" />
          <circle ref={cometHead} r="2.8" fill="#191510" opacity="0" />
          {trails(0)}
        </g>
      </svg>
    ) : null;

  const over =
    !reduced && box.w > 0 ? (
      <svg className="absolute inset-0" width={box.w} height={box.h} style={{ overflow: 'visible' }}>
        <g transform={center}>{trails(1)}</g>
      </svg>
    ) : null;

  return (
    <section
      data-section="planet"
      aria-label="Presentación interactiva del portafolio"
      className="relative w-full overflow-visible pt-[128px] pb-[24px] sm:pt-[200px] sm:pb-[56px] lg:pt-[250px] lg:pb-[96px]"
      style={{
        isolation: 'isolate',
        zIndex: 'var(--z-planet, 10)',
      }}
    >
      {/* Neutraliza los márgenes verticales del wrapper interno de PlanetHero (mt-6/sm:mt-8/md:mt-4/lg:mt-10)
          para controlar el aire hero→globo desde aquí, vía data-attribute estable */}
      <style>{`[data-section="planet"] [data-planet-canvas-wrap] { margin-top: 0; }`}</style>

      {/* 1. Papel cuadriculado con bordes difuminados en los 4 lados (sin cortes duros) */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none select-none" style={{ zIndex: 0 }}>
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

      {/* 1b. Transición hero→papel: el blanco del hero continúa y se disuelve sobre el papel */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 pointer-events-none select-none h-[22svh] sm:h-[34svh]"
        style={{ background: HERO_FADE, zIndex: 0 }}
      />

      {/* 2. Marcas tenues perimetrales (fuera del alcance de las órbitas) */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none select-none overflow-hidden" style={{ zIndex: 2 }}>
        <MarkStar className="hidden md:block absolute left-[8%] top-[18%] opacity-35" />
        <MarkPlus className="hidden md:block absolute left-[18%] top-[24%] opacity-35" />
        <MarkX className="hidden md:block absolute left-[12%] top-[44%] opacity-30" />
        <MarkPlus className="hidden sm:block absolute left-[9%] bottom-[22%] opacity-35" />
        <MarkX className="hidden lg:block absolute left-[30%] bottom-[4%] opacity-35" />
        <MarkPlus className="hidden sm:block absolute right-[14%] top-[20%] opacity-35" />
        <MarkX className="hidden md:block absolute right-[16%] top-[30%] opacity-30" />
        <span className="hidden md:inline-flex absolute right-[4%] top-[44%] gap-1.5 opacity-35">
          <span className="w-1 h-1 rounded-full bg-[#191510]" />
          <span className="w-1 h-1 rounded-full bg-[#191510]" />
        </span>
        <span className="hidden sm:inline-block absolute right-[7%] bottom-[16%] w-1 h-1 rounded-full bg-[#191510] opacity-35" />
      </div>

      {/* 3. Planeta (el globo no se toca) */}
      <div
        className="relative w-full max-w-[1280px] mx-auto px-2 sm:px-4 overflow-visible"
        style={{ isolation: 'isolate', zIndex: 'var(--z-planet, 10)' }}
      >
        {/* halo suave detrás del globo, centrado en el contenedor del planeta (sin su margen inferior) */}
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-[calc(50%-40px)] md:top-[calc(50%-56px)] -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none rounded-full w-[97vw] h-[97vw] sm:w-[68.5vw] sm:h-[68.5vw] xl:w-[910px] xl:h-[910px]"
          style={{
            background:
              'radial-gradient(circle, rgba(255, 255, 255, 0.72) 0%, rgba(254, 251, 240, 0.42) 42%, rgba(239, 236, 225, 0) 72%)',
            zIndex: 0,
          }}
        />
        <PlanetHero ref={heroRef} onOrbitFrame={onOrbitFrame} under={under} over={over} />
      </div>
    </section>
  );
};
