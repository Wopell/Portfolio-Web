import React, { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { gsap, ScrollTrigger, EASE, prefersReducedMotion } from '../../lib/gsap';
import { CategoryData } from '../../data/projects';

/**
 * =========================================================================
 * PROJECT FOLDERS — "SELECTED PROJECTS" cascading folder deck
 * =========================================================================
 * Faithful to the approved reference (docs/referencias/aprobados):
 *  - One flat-color folder per category: tab (mono label) + colored body.
 *  - Tight cascade (34px step) with a continuous #4A4036 outline.
 *  - The front folder (004) carries the featured work card.
 * Interaction: hovering a folder lifts it slightly; clicking pulls it out
 * and opens that category's catalog. GSAP settles the deck on scroll.
 * =========================================================================
 */
export const FOLDERS_CONFIG = {
  stepPx: 34,
  outlineColor: '#4A4036',
  categories: {
    'category-animation': { tabBg: '#3B5BDB', tabWidth: 168 },
    'category-3d-art': { tabBg: '#F5C518', tabWidth: 148 },
    'category-ia': { tabBg: '#8C8CF0', tabWidth: 118 },
    'category-post-production': { tabBg: '#F26B6B', tabWidth: 218 },
  } as Record<string, { tabBg: string; tabWidth: number }>,
};

interface ProjectFoldersProps {
  categories: CategoryData[];
  onOpenCategory: (categoryId: string) => void;
}

const TAB_HEIGHT = 36;

export const ProjectFolders: React.FC<ProjectFoldersProps> = ({
  categories,
  onOpenCategory,
}) => {
  const sectionRef = useRef<HTMLElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const openedRef = useRef(false);

  /* ── scroll settle: the closed pile deals out into the cascade ─────────── */
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    const rows = gsap.utils.toArray<HTMLElement>('[data-folder-row]', deckRef.current);
    if (!rows.length) return;

    const n = rows.length;
    gsap.set(rows, {
      y: (i) => (n - 1 - i) * FOLDERS_CONFIG.stepPx,
      rotation: (i) => (i % 2 === 0 ? -1.1 : 1.1),
      transformOrigin: '50% 0%',
    });

    const ctx = gsap.context(() => {
      gsap.from(headingRef.current, {
        y: 26,
        autoAlpha: 0,
        duration: 0.8,
        ease: EASE.settle,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 82%', once: true },
      });
      gsap.to(rows, {
        y: 0,
        rotation: 0,
        duration: 1.0,
        ease: EASE.outBack,
        stagger: { each: 0.09, from: 'end' },
        scrollTrigger: { trigger: deckRef.current, start: 'top 80%', once: true },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [categories.length]);

  /* ── keep ScrollTrigger honest when the featured card resizes ─────────── */
  useEffect(() => {
    const deck = deckRef.current;
    if (!deck || typeof ResizeObserver === 'undefined') return;
    let firstH = deck.offsetHeight;
    const ro = new ResizeObserver(() => {
      if (deck.offsetHeight !== firstH) {
        firstH = deck.offsetHeight;
        requestAnimationFrame(() => ScrollTrigger.refresh());
      }
    });
    ro.observe(deck);
    return () => ro.disconnect();
  }, []);

  /* ── hover lift + pull-out on click ────────────────────────────────────── */
  const bindRow = useCallback(
    (el: HTMLButtonElement | null, idx: number) => {
      if (!el || prefersReducedMotion()) return;
      const lift = gsap.quickTo(el, 'y', { duration: 0.35, ease: EASE.outSoft });
      el.addEventListener('pointerenter', () => lift(-6));
      el.addEventListener('pointerleave', () => lift(0));
      el.addEventListener('focus', () => lift(-6));
      el.addEventListener('blur', () => lift(0));
      el.addEventListener('click', () => {
        if (openedRef.current) return;
        openedRef.current = true;
        gsap
          .timeline({ onComplete: () => (openedRef.current = false) })
          .to(el, { y: -12, rotation: idx % 2 === 0 ? -1.4 : 1.4, duration: 0.22, ease: 'power2.out' })
          .to(el, { y: 0, rotation: 0, duration: 0.5, ease: EASE.settle }, '+=0.08');
      });
    },
    []
  );

  return (
    <section
      ref={sectionRef}
      id="selected-projects"
      data-section="selected-projects"
      aria-labelledby="selected-projects-title"
      className="w-full my-12 sm:my-16 relative select-none"
    >
      <header className="text-center mb-8 sm:mb-10">
        <h2
          ref={headingRef}
          id="selected-projects-title"
          className="text-2xl sm:text-3xl md:text-4xl font-display font-black tracking-tight text-zinc-950 uppercase"
        >
          SELECTED PROJECTS
        </h2>
      </header>

      <div
        ref={deckRef}
        className="w-full relative mx-auto"
        style={{ paddingTop: (categories.length - 1) * FOLDERS_CONFIG.stepPx }}
      >
        {categories.map((cat, idx) => {
          const isFront = idx === categories.length - 1;
          const cfg =
            FOLDERS_CONFIG.categories[cat.id] ?? { tabBg: cat.badgeColor, tabWidth: 160 };
          const W = cfg.tabWidth;
          const filletEnd = W + 18;
          const step = FOLDERS_CONFIG.stepPx;

          return (
            <button
              key={cat.id}
              ref={(el) => bindRow(el, idx)}
              data-folder-row
              data-folder-tab={cat.id}
              type="button"
              aria-label={`Abrir carpeta ${cat.number} // ${cat.title}`}
              aria-haspopup="dialog"
              onClick={() => onOpenCategory(cat.id)}
              className={`folder-row group flex w-full flex-col items-stretch justify-start text-left cursor-pointer outline-none ${
                isFront ? 'relative' : 'absolute inset-x-0'
              }`}
              style={
                isFront
                  ? { zIndex: 10 + idx * 10 }
                  : { top: `${idx * step}px`, bottom: 0, zIndex: 10 + idx * 10 }
              }
            >
              {/* ── folder tab ─────────────────────────────────────────── */}
              <span className="relative flex items-end h-[36px] z-10">
                <svg
                  width={filletEnd + 4}
                  height={TAB_HEIGHT + 2}
                  viewBox={`-1 -1 ${filletEnd + 6} ${TAB_HEIGHT + 4}`}
                  className="block select-none overflow-visible"
                  aria-hidden="true"
                >
                  <path
                    d={`M 0 ${TAB_HEIGHT} L 0 12 Q 0 0 12 0 L ${W - 10} 0 Q ${W} 0 ${W} 10 L ${W} 20 C ${W} 28 ${W + 8} ${TAB_HEIGHT} ${filletEnd} ${TAB_HEIGHT} L 0 ${TAB_HEIGHT} Z`}
                    fill={cfg.tabBg}
                  />
                  <path
                    d={`M 0 ${TAB_HEIGHT} L 0 12 Q 0 0 12 0 L ${W - 10} 0 Q ${W} 0 ${W} 10 L ${W} 20 C ${W} 28 ${W + 8} ${TAB_HEIGHT} ${filletEnd} ${TAB_HEIGHT}`}
                    stroke={FOLDERS_CONFIG.outlineColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  <text
                    x="16"
                    y="23"
                    fontFamily="'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace"
                    fontSize="12"
                    fontWeight="900"
                    fill="#18181b"
                    letterSpacing="1"
                  >
                    {cat.number} {('//')} {cat.title}
                  </text>
                </svg>
              </span>

              {/* ── folder body ────────────────────────────────────────── */}
              {isFront ? (
                <span className="relative block w-full -mt-[2px] border-2 border-[#4A4036] rounded-tr-[24px] sm:rounded-tr-[28px] rounded-b-[24px] sm:rounded-b-[28px] overflow-hidden shadow-[0_8px_20px_rgba(0,0,0,0.06)] bg-[#0c0d10]">
                  <img
                    src={cat.image}
                    alt={`${cat.title} — ${cat.subtitle}`}
                    className="w-full h-auto block rounded-b-[22px] sm:rounded-b-[26px] select-none pointer-events-none"
                    draggable={false}
                  />
                </span>
              ) : (
                <span className="folder-body block absolute inset-x-0 top-[34px] bottom-0 border-2 border-[#4A4036] rounded-tr-[24px] sm:rounded-tr-[28px] rounded-b-[24px] sm:rounded-b-[28px] overflow-hidden shadow-[0_8px_20px_rgba(0,0,0,0.06)]">
                  <span
                    className="absolute inset-0"
                    style={{ backgroundColor: cfg.tabBg }}
                    aria-hidden="true"
                  />
                  <span className="folder-body-grid absolute inset-0" aria-hidden="true" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
};
