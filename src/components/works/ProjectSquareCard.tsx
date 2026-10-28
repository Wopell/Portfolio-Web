import React, { useState, useLayoutEffect, useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { gsap, EASE, prefersReducedMotion } from '../../lib/gsap';
import { ProjectItem } from '../../data/projects';

/** Dark square project tile used inside the category catalog grid. */
export const ProjectSquareCard: React.FC<{
  project: ProjectItem;
  onClick: () => void;
}> = ({ project, onClick }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from(ref.current, {
        y: 26,
        autoAlpha: 0,
        duration: 0.6,
        ease: EASE.settle,
        scrollTrigger: { trigger: ref.current, start: 'top 94%', once: true },
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <article ref={ref} className="min-w-0">
      <button
        type="button"
        onClick={onClick}
        aria-label={`Abrir proyecto ${project.title} — ${project.client}`}
        className="group relative block w-full aspect-square rounded-2xl md:rounded-3xl overflow-hidden bg-zinc-900 border border-black/10 shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_45px_rgba(0,0,0,0.2)] transition-shadow duration-500 cursor-pointer select-none text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
      >
        <span className="absolute inset-0 w-full h-full overflow-hidden">
          {!isLoaded && (
            <span className="absolute inset-0 bg-zinc-800 animate-pulse flex items-center justify-center">
              <span className="w-6 h-6 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
            </span>
          )}
          <img
            src={project.image}
            alt=""
            loading="lazy"
            onLoad={() => setIsLoaded(true)}
            className="w-full h-full object-cover scale-100 group-hover:scale-108 transition-transform duration-700 ease-out"
            referrerPolicy="no-referrer"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/35 group-hover:from-black/75 transition-colors duration-500" />
        </span>

        <span className="absolute top-3 left-3 right-3 md:top-4 md:left-4 md:right-4 z-20 flex items-center justify-between pointer-events-none">
          <span className="glass-pill-badge px-3 py-1 rounded-full text-[10px] md:text-xs font-mono font-semibold tracking-wider text-white drop-shadow-sm">
            {project.client}
          </span>
          <span className="glass-pill-badge w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110 shadow-lg">
            <ArrowUpRight size={14} />
          </span>
        </span>

        <span className="absolute inset-x-0 bottom-0 p-3.5 md:p-5 z-20 flex flex-col justify-end pointer-events-none">
          <span className="text-[10px] md:text-xs font-mono uppercase tracking-widest text-zinc-300 font-medium">
            {project.tag} • {project.year}
          </span>
          <span className="mt-1 text-xs sm:text-sm md:text-base font-sans font-bold tracking-tight text-white leading-snug drop-shadow-md">
            {project.title}
          </span>
        </span>
      </button>
    </article>
  );
};
