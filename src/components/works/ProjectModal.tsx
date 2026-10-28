import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { gsap, EASE, prefersReducedMotion } from '../../lib/gsap';
import { ProjectItem } from '../../data/projects';

/**
 * Project lightbox. Mounts on demand, animates in/out with GSAP and only
 * unmounts after the exit tween finishes (no AnimatePresence needed).
 */
export const ProjectModal: React.FC<{
  project: ProjectItem | null;
  onClose: () => void;
}> = ({ project, onClose }) => {
  const [rendered, setRendered] = useState<ProjectItem | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef(false);

  /* mount + enter */
  useEffect(() => {
    if (!project || closingRef.current) return;
    setRendered(project);
  }, [project]);

  useEffect(() => {
    if (!rendered) return;
    if (prefersReducedMotion()) {
      gsap.set([rootRef.current, panelRef.current], { autoAlpha: 1, y: 0, scale: 1 });
    } else {
      gsap
        .timeline()
        .fromTo(rootRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: 'power1.out' })
        .fromTo(
          panelRef.current,
          { autoAlpha: 0, y: 26, scale: 0.96 },
          { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: EASE.snap },
          '-=0.1'
        );
    }
    const previousFocus = document.activeElement as HTMLElement | null;
    panelRef.current?.querySelector<HTMLButtonElement>('[data-modal-close]')?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prevOverflow;
      previousFocus?.focus?.();
    };
  }, [rendered?.id]);

  /* animated close, then real unmount */
  const close = useCallback(() => {
    if (closingRef.current || !rendered) return;
    closingRef.current = true;
    if (prefersReducedMotion()) {
      closingRef.current = false;
      setRendered(null);
      onClose();
      return;
    }
    gsap
      .timeline({
        onComplete: () => {
          closingRef.current = false;
          setRendered(null);
          onClose();
        },
      })
      .to(panelRef.current, { autoAlpha: 0, y: 18, scale: 0.97, duration: 0.28, ease: 'power2.in' })
      .to(rootRef.current, { autoAlpha: 0, duration: 0.22, ease: 'power1.in' }, '-=0.08');
  }, [rendered, onClose]);

  /* Escape closes the lightbox */
  useEffect(() => {
    if (!rendered) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [rendered, close]);

  if (!rendered) return null;

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Proyecto ${rendered.title}`}
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-8 bg-black/85 backdrop-blur-xl opacity-0"
      onClick={close}
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-4xl w-full bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
      >
        <button
          type="button"
          data-modal-close
          onClick={close}
          className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-black/60 text-white hover:bg-white hover:text-black transition-all shadow-md cursor-pointer focus-visible:outline-2 focus-visible:outline-white"
          aria-label="Cerrar modal"
        >
          <X size={18} />
        </button>

        <div className="w-full h-[45vh] md:h-[55vh] relative overflow-hidden bg-black">
          <img src={rendered.image} alt={rendered.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
        </div>

        <div className="p-6 md:p-8 text-white">
          <p className="flex flex-wrap items-center gap-2 mb-2 font-mono text-xs text-zinc-400 uppercase tracking-widest">
            <span>{rendered.client}</span>
            <span aria-hidden="true">•</span>
            <span>{rendered.tag}</span>
            <span aria-hidden="true">•</span>
            <span>{rendered.year}</span>
          </p>
          <h2 className="text-2xl md:text-3xl font-display font-black tracking-tight mb-3">
            {rendered.title}
          </h2>
          <p className="text-zinc-300 font-sans text-sm md:text-base leading-relaxed max-w-2xl">
            {rendered.description}
          </p>
        </div>
      </div>
    </div>
  );
};
