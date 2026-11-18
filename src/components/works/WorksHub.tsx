import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { gsap, prefersReducedMotion } from '../../lib/gsap';
import { FILTERS, FILTER_EVENT, FilterId, WORKS, Work } from '../../data/display-works';
import { SplatCanvas } from './SplatCanvas';
import './display.css';
import './hub.css';

/**
 * Trabajos — una sola superficie.
 *  - Arriba: el monitor (splats) con la pieza elegida, su título y una acción.
 *  - Abajo: filtros y la grilla de las piezas. Hover (o foco) muestra la pieza
 *    en el monitor; clic abre su ficha.
 *  - Los círculos del planeta filtran la grilla (evento FILTER_EVENT).
 */

/* orden editorial: reel y piezas de cliente primero */
const ORDER = [
  'reel',
  'betterfly',
  'salta-promo',
  'mela-b3',
  'buen-dolar',
  'arcane',
  'salta-negra',
  'master-metrics',
  'banco-macro',
  'postpro',
  'south-ia',
];
/* entrada de la grilla al filtrar: escalonado que se acorta (60 → 30 ms entre
   tarjetas); a partir de la octava entran juntas */
const STAGGER = [0, 60, 110, 150, 185, 215, 245, 275];

const SORTED: Work[] = [...WORKS].sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id));

interface WorksHubProps {
  onOpenWork: (work: Work) => void;
}

export const WorksHub: React.FC<WorksHubProps> = ({ onOpenWork }) => {
  const sources = useMemo(() => SORTED.map((w) => ({ src: w.image, focusX: w.focusX })), []);
  const sectionRef = useRef<HTMLElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef(new Map<FilterId, HTMLButtonElement>());
  const assembleRef = useRef(prefersReducedMotion() ? 1 : 0);
  const hoverTimer = useRef(0);
  /* foco por teclado: el monitor corta a la pieza sin barrido (recorrer la
     grilla con Tab no puede disparar un barrido por tarjeta) */
  const cutRef = useRef(false);

  const [filter, setFilter] = useState<FilterId>('all');
  const filterRef = useRef<FilterId>('all');
  /* cuántas veces cambió el filtro: re-monta la grilla para que entre animada
     (0 = recién cargada, sin animación) */
  const [swaps, setSwaps] = useState(0);
  const [index, setIndex] = useState(0);
  const [inView, setInView] = useState(false);

  const visible = useMemo(
    () => (filter === 'all' ? SORTED : SORTED.filter((w) => w.categoryId === filter)),
    [filter]
  );
  const work = SORTED[index];
  const reduced = prefersReducedMotion();

  const applyFilter = useCallback((id: FilterId) => {
    if (id !== filterRef.current) setSwaps((s) => s + 1);
    filterRef.current = id;
    setFilter(id);
    const first = id === 'all' ? SORTED[0] : SORTED.find((w) => w.categoryId === id);
    if (first) setIndex(SORTED.indexOf(first));
  }, []);

  /* los círculos del planeta filtran la grilla */
  useEffect(() => {
    const onFilter = (e: Event) => {
      const n = (e as CustomEvent<string>).detail;
      const f = FILTERS.find((x) => 'planet' in x && x.planet === n);
      if (!f) return;
      applyFilter(f.id);
      window.setTimeout(() => chipRefs.current.get(f.id)?.focus({ preventScroll: true }), 50);
    };
    window.addEventListener(FILTER_EVENT, onFilter);
    return () => window.removeEventListener(FILTER_EVENT, onFilter);
  }, [applyFilter]);

  /* encendido del monitor (una vez, al entrar en vista) */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setInView(true), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const powered = useRef(false);
  useEffect(() => {
    if (!inView || powered.current) return;
    powered.current = true;
    if (reduced) {
      assembleRef.current = 1;
      return;
    }
    // encendido con WAAPI: el navegador lo corre sin JS por cuadro, justo cuando
    // la página está ocupada arrancando WebGL (antes GSAP lo pintaba cuadro a cuadro)
    const power = screenRef.current?.animate(
      [
        { clipPath: 'inset(49.6% 0% 49.6% 0% round 16px)', filter: 'brightness(3)' },
        { clipPath: 'inset(0% 0% 0% 0% round 16px)', filter: 'brightness(1)' },
      ],
      { duration: 700, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' } // ≈ expo.out
    );
    // el armado de los splats es un valor que lee el shader: sigue en GSAP
    const tween = gsap.to(assembleRef, { current: 1, duration: 2.4, ease: 'power2.out', delay: 0.15 });
    return () => {
      power?.finish();
      tween.progress(1);
    };
  }, [inView, reduced]);

  /* intención de hover: el monitor cambia solo si el mouse se queda 150 ms sobre
     la tarjeta; al barrer la grilla de pasada no dispara un cambio por tarjeta */
  const preview = (i: number) => {
    window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setIndex(i), 150);
  };
  const cancelPreview = () => window.clearTimeout(hoverTimer.current);
  useEffect(() => cancelPreview, []);

  return (
    <section ref={sectionRef} id="selected-projects" data-section="works" aria-labelledby="works-title" className="hub">
      <div className="hub__inner">
        <h2 id="works-title" className="sr-only">
          Trabajos
        </h2>

        {/* ── pieza en pantalla ── */}
        <div className="hub__top">
          <div ref={screenRef} className="disp__screen hub__screen">
            <SplatCanvas
              sources={sources}
              index={index}
              assembleRef={assembleRef}
              transition={0.9}
              cutRef={cutRef}
              className="disp__canvas"
              alt={`${work.client} — ${work.title}`}
            />
            <span aria-hidden="true" className="disp__scan" />
            <span aria-hidden="true" className="disp__vignette" />
            {/* clic en la pantalla = «Ver proyecto» (fuera del orden de Tab: el botón ya lo cubre) */}
            <button type="button" className="disp__open" tabIndex={-1} aria-hidden="true" onClick={() => onOpenWork(work)} />
          </div>

          <div className="hub__info">
            <p className="hub__client">{work.client}</p>
            <p className="hub__title">
              {work.title}
            </p>
            <p className="hub__specs">
              {work.kind} · {work.duration}
            </p>
            <button type="button" className="arch-btn arch-btn--solid hub__cta" onClick={() => onOpenWork(work)}>
              Ver proyecto
            </button>
          </div>
        </div>

        {/* ── filtros ── */}
        <div className="hub__filters" role="group" aria-label="Filtrar trabajos">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              ref={(el) => {
                if (el) chipRefs.current.set(f.id, el);
                else chipRefs.current.delete(f.id);
              }}
              type="button"
              className="hub__chip"
              aria-pressed={filter === f.id}
              onClick={() => applyFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* ── grilla ── */}
        <ul key={swaps} className={`hub__grid${swaps ? ' is-swapped' : ''}`}>
          {visible.map((w, n) => {
            const i = SORTED.indexOf(w);
            const on = i === index;
            return (
              <li key={w.id} style={{ '--d': `${STAGGER[Math.min(n, STAGGER.length - 1)]}ms` } as React.CSSProperties}>
                <button
                  type="button"
                  className={`hub-card ${on ? 'is-on' : ''}`}
                  aria-label={`${w.client} — ${w.title}. Ver proyecto`}
                  onPointerEnter={(e) => e.pointerType === 'mouse' && preview(i)}
                  onPointerLeave={cancelPreview}
                  onFocus={(e) => {
                    cutRef.current = e.currentTarget.matches(':focus-visible');
                    setIndex(i);
                  }}
                  onClick={() => {
                    setIndex(i);
                    onOpenWork(w);
                  }}
                >
                  <span className="hub-card__media">
                    <img src={w.image} alt="" loading="lazy" draggable={false} />
                  </span>
                  <span className="hub-card__client">{w.client}</span>
                  <span className="hub-card__title">{w.title}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};
