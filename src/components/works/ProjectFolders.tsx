import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger, EASE, prefersReducedMotion } from '../../lib/gsap';
import { CategoryData } from '../../data/projects';

/**
 * =========================================================================
 * PROJECT FOLDERS — "SELECTED PROJECTS" cascading folder deck
 * =========================================================================
 * Faithful to the approved reference (docs/referencias/aprobados):
 *  - One flat-color folder per category: tab (mono label) + colored body.
 *  - Generous cascade (56px step, 36px on mobile) so every folder shows a
 *    preview strip of its projects, with a continuous #4A4036 outline that
 *    runs from each tab into its body and a full-width "pocket" baseline
 *    under the whole deck.
 *  - The front folder (004) carries the featured work card.
 * Interaction: hovering a folder pulls it out of the pile far enough to
 * reveal its preview strip (game-like overshoot); clicking opens that
 * category's catalog. GSAP deals the deck out on scroll.
 * =========================================================================
 */
export const FOLDERS_CONFIG = {
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

/** cascade step is responsive: tight on phones, generous on desktop */
const cascadeStep = () =>
  typeof window !== 'undefined' && window.innerWidth < 640 ? 36 : 56;

export const ProjectFolders: React.FC<ProjectFoldersProps> = ({
  categories,
  onOpenCategory,
}) => {
  const sectionRef = useRef<HTMLElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const openedRef = useRef(false);
  const dealtRef = useRef(false);

  /* responsive cascade step; transforms below follow it through stepRef */
  const [step, setStep] = useState(cascadeStep);
  const stepRef = useRef(step);
  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  const n = categories.length;

  /* ── scroll settle: the closed pile deals out into the cascade ─────────── */
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    const rows = gsap.utils.toArray<HTMLElement>('[data-folder-row]', deckRef.current);
    if (!rows.length) return;
    const total = rows.length;
    const step0 = stepRef.current;

    /* rows fly in from deep behind the pile — a long, overshooting deal */
    gsap.set(rows, {
      y: (i) => (total - 1 - i) * step0 * 2.1 + 46,
      x: (i) => (i % 2 === 0 ? -34 : 34),
      rotation: (i) => (i % 2 === 0 ? -2.4 : 2.4),
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
        x: 0,
        rotation: 0,
        duration: 1.35,
        ease: EASE.outBack,
        stagger: { each: 0.14, from: 'end' },
        scrollTrigger: { trigger: deckRef.current, start: 'top 80%', once: true },
        onComplete: () => {
          dealtRef.current = true;
        },
      });
    }, sectionRef);

    /* keep the cascade honest when the featured card resizes */
    const settled = () =>
      rows.every((r) => Math.abs(gsap.getProperty(r, 'y') as number) < 1);
    const onResize = () => {
      setStep(cascadeStep());
      const st = stepRef.current;
      const target = dealtRef.current || settled();
      gsap.set(rows, {
        y: target ? 0 : (i) => (total - 1 - i) * st * 2.1 + 46,
        x: target ? 0 : (i) => (i % 2 === 0 ? -34 : 34),
        rotation: target ? 0 : (i) => (i % 2 === 0 ? -2.4 : 2.4),
      });
      requestAnimationFrame(() => ScrollTrigger.refresh());
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      ctx.revert();
    };
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

  /* ── hover pull-out + click: game-like, one beat slower than a tooltip ─── */
  const bindRow = useCallback(
    (el: HTMLButtonElement | null, idx: number) => {
      if (!el || prefersReducedMotion()) return;
      /* ref callbacks can re-run in Strict Mode — bind a given node once */
      if ((el as HTMLButtonElement & { __folderBound?: boolean }).__folderBound) return;
      (el as HTMLButtonElement & { __folderBound?: boolean }).__folderBound = true;

      const pull = gsap.quickTo(el, 'y', { duration: 0.8, ease: EASE.outBack });
      const pullX = gsap.quickTo(el, 'x', { duration: 0.9, ease: EASE.outBack });
      const tilt = gsap.quickTo(el, 'rotation', { duration: 0.9, ease: EASE.outBack });

      const raise = () => {
        /* pull the folder well clear of the pile so its preview strip is
           fully visible — game-like, one beat slower than a UI tooltip */
        pull(-(stepRef.current + 26));
        pullX(idx % 2 === 0 ? 6 : 9);
        tilt(idx % 2 === 0 ? -0.5 : 0.5);
      };
      const lower = () => {
        pull(0);
        pullX(0);
        tilt(0);
      };

      /* pointer events land on the row's own visible band so stacked
         rows don't swallow each other's hovers */
      const zone = el.querySelector<HTMLElement>('[data-folder-hit]');
      zone?.addEventListener('pointerenter', raise);
      zone?.addEventListener('pointerleave', lower);
      el.addEventListener('focus', raise);
      el.addEventListener('blur', lower);
      el.addEventListener('click', () => {
        if (openedRef.current) return;
        openedRef.current = true;
        gsap
          .timeline({ onComplete: () => (openedRef.current = false) })
          .to(el, { y: -(stepRef.current + 40), rotation: idx % 2 === 0 ? -1.6 : 1.6, duration: 0.24, ease: 'power2.out' })
          .to(el, { y: 0, rotation: 0, duration: 0.6, ease: EASE.settle }, '+=0.08');
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
      className="w-full my-20 sm:my-32 relative select-none"
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
        style={{ paddingTop: (n - 1) * step }}
      >
        {categories.map((cat, idx) => {
          const isFront = idx === categories.length - 1;
          const cfg =
            FOLDERS_CONFIG.categories[cat.id] ?? { tabBg: cat.badgeColor, tabWidth: 160 };
          const W = cfg.tabWidth;
          const filletEnd = W + 18;
          const previews = cat.projects.slice(0, 3);

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
                isFront ? 'relative' : 'absolute inset-x-0 pointer-events-none'
              }`}
              style={
                isFront
                  ? { zIndex: 10 + idx * 10 }
                  : { top: `${idx * step}px`, bottom: 0, zIndex: 10 + idx * 10 }
              }
            >
              {/* hit zone: this folder's tab + its visible strip */}
              {!isFront && (
                <span
                  data-folder-hit
                  aria-hidden="true"
                  className="pointer-events-auto absolute left-0 top-0 w-full cursor-pointer"
                  style={{ height: `${step + TAB_HEIGHT - 1}px` }}
                />
              )}

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
                    d={`M 0 ${TAB_HEIGHT} L 0 20 Q 0 0 20 0 L ${W - 10} 0 Q ${W} 0 ${W} 10 L ${W} 20 C ${W} 28 ${W + 8} ${TAB_HEIGHT} ${filletEnd} ${TAB_HEIGHT} L 0 ${TAB_HEIGHT} Z`}
                    fill={cfg.tabBg}
                  />
                  <path
                    d={`M 0 ${TAB_HEIGHT} L 0 20 Q 0 0 20 0 L ${W - 10} 0 Q ${W} 0 ${W} 10 L ${W} 20 C ${W} 28 ${W + 8} ${TAB_HEIGHT} ${filletEnd} ${TAB_HEIGHT}`}
                    stroke={FOLDERS_CONFIG.outlineColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  <text
                    x="26"
                    y="24"
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

              {/* ── folder body: top rule starts at the tab's end so the
                     outline flows continuously into the silhouette ─────── */}
              {isFront ? (
                <span
                  className="folder-body-rule relative block w-full -mt-[2px] border-x-2 border-b-2 border-[#4A4036] rounded-tr-[24px] sm:rounded-tr-[28px] rounded-b-[24px] sm:rounded-b-[28px] overflow-hidden shadow-[0_8px_20px_rgba(0,0,0,0.06)] bg-[#0c0d10]"
                  style={{ '--folder-tab-end': `${filletEnd}px` } as React.CSSProperties}
                >
                  <img
                    src={cat.image}
                    alt={`${cat.title} — ${cat.subtitle}`}
                    className="w-full h-auto block rounded-b-[22px] sm:rounded-b-[26px] select-none pointer-events-none"
                    draggable={false}
                  />
                </span>
              ) : (
                <span
                  className="folder-body folder-body-rule block absolute inset-x-0 top-[35px] bottom-0 border-x-2 border-b-2 border-[#4A4036] rounded-tr-[24px] sm:rounded-tr-[28px] rounded-b-[24px] sm:rounded-b-[28px] overflow-visible"
                  style={{ '--folder-tab-end': `${filletEnd}px` } as React.CSSProperties}
                >
                  {/* colored interior with the reference's graph-paper grid */}
                  <span
                    className="absolute inset-x-0 top-0 bottom-0 rounded-tr-[24px] sm:rounded-tr-[28px] rounded-b-[24px] sm:rounded-b-[28px] overflow-hidden"
                    style={{ backgroundColor: cfg.tabBg }}
                    aria-hidden="true"
                  >
                    <span className="folder-body-grid absolute inset-0" aria-hidden="true" />
                  </span>

                  {/* preview strip: tilted project crops peeking out from
                      under the next folder in the pile */}
                  <span
                    className="folder-previews relative flex items-start gap-[10px] sm:gap-3.5 pt-[5px] pl-[10px]"
                    aria-hidden="true"
                  >
                    {previews.map((p, pi) => (
                      <img
                        key={p.id}
                        src={p.image}
                        alt=""
                        loading="lazy"
                        className={`folder-preview shrink-0 object-cover w-[96px] sm:w-[128px] h-[52px] sm:h-[70px] rounded-[4px] bg-[#e8e2d6] border-2 border-[#4A4036] shadow-[0_2px_6px_rgba(0,0,0,0.12)] select-none pointer-events-none ${
                          pi % 2 === 0 ? 'rotate-[2.5deg]' : 'rotate-[-2deg]'
                        }`}
                        style={{
                          objectPosition: ['18% 40%', '50% 55%', '85% 40%'][pi % 3],
                        }}
                        draggable={false}
                      />
                    ))}
                    <span className="font-mono font-bold text-[9px] sm:text-[10px] uppercase tracking-[0.18em] text-zinc-950/80 self-center mt-2">
                      × {cat.projects.length} proyectos
                    </span>
                  </span>
                </span>
              )}
            </button>
          );
        })}

        {/* ── the pocket: full-width baseline under the whole deck ─────── */}
        <span
          className="absolute left-[-14px] right-[-14px] bottom-[-2px] h-[2px] bg-[#4A4036]"
          aria-hidden="true"
        />
        <span
          className="absolute left-[-26px] bottom-[-8px] font-mono font-bold text-[13px] text-[#4A4036]"
          aria-hidden="true"
        >
          +
        </span>
        <span
          className="absolute right-[-26px] bottom-[-8px] font-mono font-bold text-[13px] text-[#4A4036]"
          aria-hidden="true"
        >
          +
        </span>
      </div>
    </section>
  );
};
