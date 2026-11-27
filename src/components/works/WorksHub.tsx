import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { prefersReducedMotion } from '../../lib/gsap';
import { FILTERS, FILTER_EVENT, FilterId, WORKS, Work } from '../../data/display-works';
import './hub.css';

/**
 * Trabajos — una galería masonry: las piezas a sangre, cada una en su formato
 * real (horizontal o vertical), casi sin interfaz. Cada tarjeta muestra su
 * póster y, cuando entra en pantalla, un loop corto del video. Clic abre la
 * ficha. Los filtros (y los círculos del planeta) recortan la galería.
 */

/* orden editorial: reel y piezas de cliente primero, verticales repartidas */
const ORDER = [
  'reel',
  'betterfly',
  'negra-organico',
  'salta-promo',
  'mela-b3',
  'buen-dolar',
  'ipa-ilustrado',
  'arcane',
  'salta-negra',
  'master-metrics',
  'relaunch-credenciales',
  'banco-macro',
  'postpro',
  'south-ia',
];
const rank = (id: string) => {
  const i = ORDER.indexOf(id);
  return i < 0 ? ORDER.length : i;
};
const SORTED: Work[] = [...WORKS].sort((a, b) => rank(a.id) - rank(b.id));

/* entrada al filtrar: escalonado que se acorta (60 → 30 ms); después, juntas */
const STAGGER = [0, 60, 110, 150, 185, 215, 245, 275];

/* datos incompletos: nunca un título vacío ni separadores huérfanos */
const titleOf = (w: Work) => w.title.trim() || 'Sin título';
const nameOf = (w: Work) => [w.client.trim(), titleOf(w)].filter(Boolean).join(' — ');

/* póster en miniatura (public/works/thumbs) con el original como alternativa */
const thumbOf = (src: string) => src.replace('/works/', '/works/thumbs/');
const hideBroken = (e: React.SyntheticEvent<HTMLElement>) => {
  e.currentTarget.style.visibility = 'hidden';
};

/* columnas según el ancho (igual que el CSS de .hub__grid) */
const colsFor = (w: number) => (w >= 1100 ? 3 : w >= 640 ? 2 : 1);
function useColumns() {
  const [cols, setCols] = useState(() => (typeof window === 'undefined' ? 3 : colsFor(window.innerWidth)));
  useEffect(() => {
    const on = () => setCols(colsFor(window.innerWidth));
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return cols;
}

/* masonry: cada pieza va a la columna más corta, en orden editorial (las
   primeras quedan arriba). El orden de Tab recorre una columna y después la otra */
function distribute(items: Work[], cols: number) {
  const columns: { work: Work; n: number }[][] = Array.from({ length: cols }, () => []);
  const heights = new Array(cols).fill(0);
  items.forEach((work, n) => {
    const c = heights.indexOf(Math.min(...heights));
    columns[c].push({ work, n });
    heights[c] += (work.ratio === '9/16' ? 16 / 9 : work.ratio === '1/1' ? 1 : 9 / 16) + 0.22; // + pie de la tarjeta
  });
  return columns;
}

/* el loop se carga recién al acercarse a la pantalla y solo corre mientras se
   ve; con reduced-motion queda el póster quieto */
function useLoop(src: string) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v || !src || prefersReducedMotion()) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          if (!v.src) v.src = src;
          v.play().catch(() => {});
        } else v.pause();
      },
      { threshold: 0.35 }
    );
    io.observe(v);
    return () => io.disconnect();
  }, [src]);
  return ref;
}

const Card: React.FC<{ work: Work; n: number; onOpen: (w: Work) => void }> = ({ work, n, onOpen }) => {
  const video = useLoop(work.loop);
  return (
    <li style={{ '--d': `${STAGGER[Math.min(n, STAGGER.length - 1)]}ms` } as React.CSSProperties}>
      <button type="button" className="hub-card" aria-label={`${nameOf(work)}. Ver proyecto`} onClick={() => onOpen(work)}>
        <span className="hub-card__media" style={{ aspectRatio: work.ratio }}>
          <img
            src={thumbOf(work.image)}
            srcSet={`${thumbOf(work.image)} 960w, ${work.image} 1600w`}
            sizes="(min-width: 1100px) 31vw, (min-width: 640px) 46vw, 92vw"
            alt=""
            loading="lazy"
            draggable={false}
            onError={hideBroken}
          />
          {work.loop && (
            <video ref={video} muted loop playsInline preload="none" aria-hidden="true" tabIndex={-1} onError={hideBroken} />
          )}
        </span>
        {work.client.trim() && <span className="hub-card__client">{work.client}</span>}
        <span className="hub-card__title">{titleOf(work)}</span>
      </button>
    </li>
  );
};

interface WorksHubProps {
  onOpenWork: (work: Work) => void;
}

export const WorksHub: React.FC<WorksHubProps> = ({ onOpenWork }) => {
  const chipRefs = useRef(new Map<FilterId, HTMLButtonElement>());
  const [filter, setFilter] = useState<FilterId>('all');
  const filterRef = useRef<FilterId>('all');
  /* cuántas veces cambió el filtro: re-monta la grilla para que entre animada
     (0 = recién cargada, sin animación) */
  const [swaps, setSwaps] = useState(0);
  const cols = useColumns();

  const visible = useMemo(
    () => (filter === 'all' ? SORTED : SORTED.filter((w) => w.categoryId === filter)),
    [filter]
  );
  const columns = useMemo(() => distribute(visible, cols), [visible, cols]);

  const applyFilter = useCallback((id: FilterId) => {
    if (id !== filterRef.current) setSwaps((s) => s + 1);
    filterRef.current = id;
    setFilter(id);
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

  const filterLabel = FILTERS.find((f) => f.id === filter)?.label ?? '';

  return (
    <section id="selected-projects" data-section="works" aria-labelledby="works-title" className="hub">
      <div className="hub__inner">
        <h2 id="works-title" className="sr-only">
          Trabajos
        </h2>

        {SORTED.length === 0 ? (
          // sin piezas publicadas: un aviso (antes la página se caía)
          <div className="hub__empty">
            <p className="hub__title">Pronto, trabajos nuevos.</p>
            <p className="hub__specs">Mientras tanto, escribime: el contacto está al final.</p>
          </div>
        ) : (
          <>
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

            {visible.length === 0 ? (
              <div className="hub__none">
                <p>Todavía no hay piezas de {filterLabel}.</p>
                <button type="button" className="arch-btn" onClick={() => applyFilter('all')}>
                  Ver todo
                </button>
              </div>
            ) : (
              <div key={swaps} className={`hub__grid${swaps ? ' is-swapped' : ''}`} style={{ '--cols': cols } as React.CSSProperties}>
                {columns.map((col, c) => (
                  <ul key={c} className="hub__col">
                    {col.map(({ work, n }) => (
                      <Card key={work.id} work={work} n={n} onOpen={onOpenWork} />
                    ))}
                  </ul>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};
