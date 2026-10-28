import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { gsap, EASE, prefersReducedMotion } from '../../lib/gsap';
import { CategoryData } from '../../data/projects';
import { ProjectSquareCard } from './ProjectSquareCard';

/**
 * Full-screen category catalog. Stays mounted (invisible) so the works page
 * beneath it keeps its scroll state; GSAP drives open/close and content swaps.
 */
export const CategoryOverlay: React.FC<{
  category: CategoryData | null;
  onClose: () => void;
  onOpenProject: (project: CategoryData['projects'][number]) => void;
}> = ({ category, onClose, onOpenProject }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const lastCategoryId = useRef<string | null>(null);

  /* open / close */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (category) {
      if (prefersReducedMotion()) {
        gsap.set(root, { autoAlpha: 1 });
      } else {
        gsap
          .timeline()
          .fromTo(root, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: EASE.snap })
          .from(root.querySelectorAll('[data-overlay-reveal]'), {
            y: 26,
            autoAlpha: 0,
            duration: 0.6,
            ease: EASE.settle,
            stagger: 0.08,
          }, '-=0.15');
      }
      backRef.current?.focus({ preventScroll: true });
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
    gsap.to(root, { autoAlpha: 0, duration: prefersReducedMotion() ? 0 : 0.3, ease: 'power1.in' });
  }, [category]);

  /* content swap while already open */
  useLayoutEffect(() => {
    if (!category || !lastCategoryId.current || category.id === lastCategoryId.current) {
      lastCategoryId.current = category?.id ?? null;
      return;
    }
    lastCategoryId.current = category.id;
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from(contentRef.current, { autoAlpha: 0, y: 16, duration: 0.4, ease: EASE.settle });
    }, contentRef);
    return () => ctx.revert();
  }, [category?.id]);

  /* Escape closes the catalog */
  useEffect(() => {
    if (!category) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [category, onClose]);

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label={category ? `Catálogo de ${category.title}` : undefined}
      className="fixed inset-0 z-[110] overflow-y-auto bg-[#f5f2eb] paper-grid text-zinc-950 opacity-0 invisible"
    >
      {category && (
        <div ref={contentRef}>
          {/* Category hero */}
          <header className="relative w-full h-[65vh] md:h-[75vh] overflow-hidden flex items-end p-6 sm:p-10 md:p-16">
            <div className="fixed top-20 left-4 sm:left-6 md:top-24 md:left-8 z-50" data-overlay-reveal>
              <button
                ref={backRef}
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-full bg-black/80 backdrop-blur-md flex items-center gap-2.5 text-xs font-mono font-bold tracking-widest uppercase text-white hover:bg-white hover:text-black transition-colors duration-300 shadow-2xl cursor-pointer focus-visible:outline-2 focus-visible:outline-white"
              >
                <ArrowLeft size={16} />
                <span>Categorías</span>
              </button>
            </div>

            <img
              src={category.image}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              data-overlay-reveal
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30" />

            <div className="relative z-10 max-w-4xl" data-overlay-reveal>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/70 font-semibold block mb-2">
                Categoría Seleccionada // {category.number}
              </p>
              <h1 className="text-5xl sm:text-6xl md:text-8xl font-display font-black text-white tracking-tight uppercase">
                {category.title}
              </h1>
              <p className="text-white/80 font-sans text-sm sm:text-base md:text-lg max-w-2xl mt-3">
                {category.subtitle}
              </p>
            </div>
          </header>

          {/* Projects grid */}
          <section className="w-full py-14 md:py-20" aria-label={`Proyectos de ${category.title}`}>
            <div className="max-w-[1720px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
              <div className="mb-10 md:mb-14 flex flex-col md:flex-row md:items-end justify-between border-b border-black/10 pb-6 gap-4" data-overlay-reveal>
                <div>
                  <p className="text-xs font-mono uppercase tracking-widest text-zinc-600 font-bold">
                    Catálogo Seleccionado // {category.title}
                  </p>
                  <h2 className="text-2xl md:text-3xl font-display font-bold tracking-tight text-zinc-950 mt-1">
                    {category.subtitle}
                  </h2>
                  <p className="text-zinc-600 font-sans text-sm mt-1 max-w-xl">
                    {category.description}
                  </p>
                </div>
                <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest font-semibold">
                  {category.projects.length} Proyectos
                </p>
              </div>

              <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {category.projects.map((project) => (
                  <li key={project.id}>
                    <ProjectSquareCard project={project} onClick={() => onOpenProject(project)} />
                  </li>
                ))}
              </ul>

              <footer className="mt-20 pt-10 border-t border-black/10 flex flex-col sm:flex-row justify-between items-center gap-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 rounded-full bg-zinc-900 text-white hover:bg-black font-mono text-xs uppercase tracking-widest font-bold transition-colors shadow-md cursor-pointer flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
                >
                  <ArrowLeft size={16} />
                  <span>Volver al menú de categorías</span>
                </button>
                <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-600 font-bold">
                  Wopell // {category.title}
                </p>
              </footer>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
