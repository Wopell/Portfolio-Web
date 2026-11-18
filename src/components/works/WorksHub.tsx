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

  const [filter, setFilter] = useState<FilterId>('all');
  const [index, setIndex] = useState(0);
  const [inView, setInView] = useState(false);

  const visible = useMemo(
    () => (filter === 'all' ? SORTED : SORTED.filter((w) => w.categoryId === filter)),
    [filter]
  );
  const work = SORTED[index];
  const reduced = prefersReducedMotion();

  const applyFilter = useCallback((id: FilterId) => {
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
    const tl = gsap
      .timeline()
      .fromTo(
        screenRef.current,
        { clipPath: 'inset(49.6% 0% 49.6% 0% round 16px)', filter: 'brightness(3)' },
        { clipPath: 'inset(0% 0% 0% 0% round 16px)', filter: 'brightness(1)', duration: 0.7, ease: 'expo.out', clearProps: 'clipPath,filter' }
      )
      .to(assembleRef, { current: 1, duration: 2.4, ease: 'power2.out' }, 0.15);
    return () => void tl.progress(1);
  }, [inView, reduced]);

  const preview = (i: number) => {
    window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setIndex(i), 80);
  };

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
            <p key={work.id} className="hub__title">
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
        <ul className="hub__grid">
          {visible.map((w) => {
            const i = SORTED.indexOf(w);
            const on = i === index;
            return (
              <li key={w.id}>
                <button
                  type="button"
                  className={`hub-card ${on ? 'is-on' : ''}`}
                  aria-label={`${w.client} — ${w.title}. Ver proyecto`}
                  onPointerEnter={(e) => e.pointerType === 'mouse' && preview(i)}
                  onFocus={() => setIndex(i)}
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
