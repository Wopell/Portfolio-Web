import React, { useCallback, useEffect, useRef, useState } from 'react';
import { gsap, EASE, prefersReducedMotion } from '../../lib/gsap';
import { CategoryData } from '../../data/projects';
import { SectionHead } from './SectionHead';

/**
 * Folders V2 — «Archivo» (DIRECTION.md).
 * Cascada de carpetas solo contorno: pestaña con texto mono, sin barra de color;
 * el fondo de cada carpeta oscurece un tono hacia atrás para dar profundidad.
 *  - Hover: la carpeta sale del montón en 3D (pull + rotateX) y las de adelante
 *    se compactan hacia abajo; asoman sus miniaturas.
 *  - La carpeta del frente muestra su preview grande, que rota cada 10 s.
 *  - Click: vuelo FLIP de la imagen hasta el encabezado del catálogo.
 */

const ROTATE_MS = 10_000;
const OUTLINE = '#4A4036';
const FILLS = ['#e9e3d4', '#ede8db', '#f1ede3', '#fbfaf6'];
/* una pestaña de color por carpeta (misma familia que las fichas de contacto) */
const TAB_COLORS = ['#ff9f43', '#7cc8ff', '#c9b6ff', '#ff6b4a'];

interface ProjectFoldersProps {
  categories: CategoryData[];
  onOpenCategory: (categoryId: string) => void;
}

const useIsNarrow = () => {
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);
  useEffect(() => {
    const on = () => setNarrow(window.innerWidth < 640);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return narrow;
};

const FolderTab: React.FC<{ label: string; width: number; height: number; fill: string }> = ({
  label,
  width: W,
  height: H,
  fill,
}) => {
  const end = W + 16;
  const shape = `M 0 ${H} L 0 12 Q 0 0 12 0 L ${W - 10} 0 Q ${W} 0 ${W} 10 L ${W} ${H - 14} C ${W} ${H - 4} ${W + 6} ${H} ${end} ${H}`;
  return (
    <svg
      width={end + 2}
      height={H + 2}
      viewBox={`-1 -1 ${end + 2} ${H + 2}`}
      className="block overflow-visible"
      aria-hidden="true"
    >
      <path d={`${shape} L 0 ${H} Z`} fill={fill} />
      <path d={shape} fill="none" stroke={OUTLINE} strokeWidth="1.5" strokeLinejoin="round" />
      <text
        x="16"
        y={H / 2 + 4.5}
        fontFamily="'JetBrains Mono', ui-monospace, monospace"
        fontSize="12"
        fontWeight="600"
        letterSpacing="1.4"
        fill="#191510"
      >
        {label}
      </text>
    </svg>
  );
};

export const ProjectFolders: React.FC<ProjectFoldersProps> = ({ categories, onOpenCategory }) => {
  const narrow = useIsNarrow();
  const step = narrow ? 50 : 66;
  const tabH = narrow ? 32 : 36;
  const n = categories.length;
  const frontIdx = n - 1;
  const front = categories[frontIdx];

  const sectionRef = useRef<HTMLElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const flyingRef = useRef(false);

  /* rotación de la preview del frente: cada 10 s, en pausa con hover o fuera de vista */
  const frontSlides = front?.projects.length ? front.projects : [];
  useEffect(() => {
    if (paused || frontSlides.length < 2 || prefersReducedMotion()) return;
    const t = window.setInterval(() => setSlide((s) => (s + 1) % frontSlides.length), ROTATE_MS);
    return () => window.clearInterval(t);
  }, [paused, frontSlides.length]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setPaused(!e.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* entrada única: la cascada se reparte desde un montón cerrado */
  /* `live` habilita las transiciones CSS del hover recién cuando terminó la entrada
     (si no, la transición CSS pelea con el tween de GSAP cuadro a cuadro). */
  const [live, setLive] = useState(false);
  useEffect(() => {
    if (prefersReducedMotion()) {
      setLive(true);
      return;
    }
    const ctx = gsap.context(() => {
      gsap.from('[data-folder]', {
        y: (i) => (n - 1 - i) * -step * 0.9,
        duration: 0.9,
        ease: EASE.settle,
        stagger: { each: 0.06, from: 'end' },
        scrollTrigger: { trigger: '[data-folder-deck]', start: 'top 82%', once: true },
        clearProps: 'transform',
        onComplete: () => setLive(true),
      });
    }, sectionRef);
    return () => ctx.revert();
  }, [n, step]);

  /* FLIP: la imagen vuela de la carpeta al encabezado del catálogo */
  const open = useCallback(
    (cat: CategoryData, source: HTMLElement | null) => {
      if (flyingRef.current) return;
      if (!source || prefersReducedMotion()) {
        onOpenCategory(cat.id);
        return;
      }
      flyingRef.current = true;
      const r = source.getBoundingClientRect();
      const clone = document.createElement('img');
      clone.src = cat.image;
      clone.alt = '';
      Object.assign(clone.style, {
        position: 'fixed',
        left: `${r.left}px`,
        top: `${r.top}px`,
        width: `${r.width}px`,
        height: `${r.height}px`,
        objectFit: 'cover',
        borderRadius: '6px',
        zIndex: '120',
        pointerEvents: 'none',
        boxShadow: '0 30px 60px rgba(25,21,16,0.25)',
      } as CSSStyleDeclaration);
      document.body.appendChild(clone);
      const targetH = window.innerHeight * (window.innerWidth >= 768 ? 0.75 : 0.65);
      gsap
        .timeline({
          onComplete: () => {
            gsap.to(clone, {
              autoAlpha: 0,
              duration: 0.35,
              delay: 0.25,
              onComplete: () => {
                clone.remove();
                flyingRef.current = false;
              },
            });
          },
        })
        .to(clone, {
          left: 0,
          top: 0,
          width: window.innerWidth,
          height: targetH,
          borderRadius: 0,
          boxShadow: '0 0 0 rgba(0,0,0,0)',
          duration: 0.75,
          ease: 'power3.inOut',
        })
        .add(() => onOpenCategory(cat.id), 0.55);
    },
    [onOpenCategory]
  );

  const offsetFor = (idx: number) => {
    if (hover === null || narrow) return { y: 0, rx: 0 };
    if (idx === hover) return { y: idx === frontIdx ? -6 : -(step + 44), rx: idx === frontIdx ? 0 : 7 };
    if (idx > hover) return { y: 14, rx: 0 }; // las de adelante se compactan hacia abajo
    return { y: -4, rx: 0 };
  };

  return (
    <section
      ref={sectionRef}
      id="selected-projects"
      data-section="selected-projects"
      aria-labelledby="selected-projects-title"
      className="arch-wrap py-20 sm:py-28"
    >
      <SectionHead
        index="03"
        label="Archivo"
        meta={`${n} carpetas · ${categories.reduce((a, c) => a + c.projects.length, 0)} piezas`}
        id="selected-projects-title"
        title={
          <>
            Selected <em>projects</em>
          </>
        }
      />

      <p className="hand folders__hint" aria-hidden="true">
        {narrow ? 'tocá una carpeta' : 'abrí una carpeta'}
        <svg viewBox="0 0 40 46" width="26" height="30">
          <path d="M8 4 C 20 10, 26 22, 22 40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M15 34 L 22 41 L 29 34" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </p>

      <div
        data-folder-deck
        className={`folder-deck relative mt-4 sm:mt-6 ${live ? 'is-live' : ''}`}
        style={{ paddingTop: (n - 1) * step }}
        onPointerLeave={() => setHover(null)}
      >
        {categories.map((cat, idx) => {
          const isFront = idx === frontIdx;
          const label = `${cat.number} // ${cat.title}`;
          const tabW = Math.round(label.length * 8.6 + 34);
          const tabColor = TAB_COLORS[idx % TAB_COLORS.length];
          const paper = FILLS[Math.max(0, FILLS.length - (n - idx))] ?? FILLS[0];
          // cuerpo: papel teñido con el color de su pestaña (más suave en el frente)
          const fill = `color-mix(in srgb, ${tabColor} ${isFront ? 14 : 26}%, ${paper})`;
          const { y, rx } = offsetFor(idx);
          const thumbs = cat.projects.slice(0, narrow ? 2 : 4);

          return (
            <div
              key={cat.id}
              data-folder
              className={`folder ${isFront ? 'relative' : 'absolute inset-x-0'}`}
              style={{
                top: isFront ? undefined : idx * step,
                bottom: isFront ? undefined : 0,
                zIndex: 10 + idx,
                transform: `translateY(${y}px) rotateX(${rx}deg)`,
              }}
              onPointerEnter={() => setHover(idx)}
            >
              <button
                type="button"
                className="folder__hit"
                aria-label={`Abrir carpeta ${label}, ${cat.projects.length} proyectos`}
                aria-haspopup="dialog"
                onFocus={() => setHover(idx)}
                onBlur={() => setHover(null)}
                onClick={(e) => {
                  const src = (e.currentTarget.parentElement?.querySelector('[data-flip-src]') ?? null) as HTMLElement | null;
                  open(cat, src);
                }}
                style={{ height: isFront ? '100%' : step + tabH }}
              />

              <div className="relative z-[1] pointer-events-none" style={{ height: tabH }}>
                <FolderTab label={label} width={tabW} height={tabH} fill={tabColor} />
              </div>

              <div
                className={`folder__body pointer-events-none ${isFront ? '' : 'absolute inset-x-0 bottom-0'}`}
                style={{
                  top: isFront ? undefined : tabH - 1.5,
                  marginTop: isFront ? -1.5 : undefined,
                  background: fill,
                  ['--tab-end' as string]: `${tabW + 16}px`,
                }}
              >
                {isFront ? (
                  <div className="p-3 sm:p-4">
                    <div className="folder__meta">
                      <span>{cat.subtitle}</span>
                      <span>
                        {String(slide + 1).padStart(2, '0')} / {String(frontSlides.length).padStart(2, '0')}
                      </span>
                    </div>
                    <div className="folder__viewer" data-flip-src>
                      {frontSlides.map((p, i) => (
                        <img
                          key={p.id}
                          src={p.image}
                          alt={i === slide ? `${p.title} — ${p.client}` : ''}
                          aria-hidden={i === slide ? undefined : true}
                          className={`folder__slide ${i === slide ? 'is-on' : ''}`}
                          draggable={false}
                        />
                      ))}
                      <span
                        key={`${slide}-${paused}`}
                        aria-hidden="true"
                        className={`folder__progress ${paused ? 'is-paused' : ''}`}
                        style={{ animationDuration: `${ROTATE_MS}ms` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="folder__strip">
                    <div className="folder__thumbs">
                      {thumbs.map((p, i) => (
                        <img
                          key={p.id}
                          src={p.image}
                          alt=""
                          loading="lazy"
                          draggable={false}
                          {...(i === 0 ? { 'data-flip-src': true } : {})}
                        />
                      ))}
                    </div>
                    <span className="folder__count">{cat.projects.length} piezas</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <span aria-hidden="true" className="folder-deck__base" />
      </div>
    </section>
  );
};
