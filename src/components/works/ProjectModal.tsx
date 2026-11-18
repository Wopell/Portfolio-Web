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
    const previousFocus = document.activeElement as HTMLElement | null;
    // el foco entra recién cuando el diálogo ya es visible (con autoAlpha 0 el
    // navegador ignora .focus())
    const focusClose = () =>
      panelRef.current?.querySelector<HTMLButtonElement>('[data-modal-close]')?.focus({ preventScroll: true });
    if (prefersReducedMotion()) {
      // sin movimiento: solo un fundido corto
      gsap.set(panelRef.current, { y: 0, scale: 1 });
      gsap
        .timeline()
        .fromTo([rootRef.current, panelRef.current], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15, ease: EASE.ui })
        .add(focusClose, 0.02);
    } else {
      // entrada ≤ 300 ms con ease-out fuerte; el panel crece desde 0.96 (nunca desde 0)
      gsap
        .timeline()
        .fromTo(rootRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, ease: EASE.ui })
        .fromTo(
          panelRef.current,
          { autoAlpha: 0, y: 12, scale: 0.96 },
          { autoAlpha: 1, y: 0, scale: 1, duration: 0.3, ease: EASE.ui },
          0
        )
        .add(focusClose, 0.05);
    }
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
    const done = () => {
      closingRef.current = false;
      setRendered(null);
      onClose();
    };
    // si se cierra mientras todavía entra, la entrada se corta acá y la salida
    // arranca desde donde quedó (si no, las dos pelean y la entrada puede
    // volver a mostrar el panel justo antes de desmontarlo)
    gsap.killTweensOf([panelRef.current, rootRef.current]);
    if (prefersReducedMotion()) {
      gsap.to([panelRef.current, rootRef.current], { autoAlpha: 0, duration: 0.12, ease: EASE.ui, onComplete: done });
      return;
    }
    // salida más rápida que la entrada y con ease-out (nunca ease-in: arranca lenta)
    gsap
      .timeline({ onComplete: done })
      .to(panelRef.current, { autoAlpha: 0, scale: 0.98, duration: 0.16, ease: EASE.ui }, 0)
      .to(rootRef.current, { autoAlpha: 0, duration: 0.18, ease: EASE.ui }, 0.02);
  }, [rendered, onClose]);

  /* Escape cierra solo la ficha (captura + stopPropagation: el catálogo de
     abajo no recibe la misma tecla); Tab queda atrapado adentro */
  useEffect(() => {
    if (!rendered) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close();
        return;
      }
      if (e.key === 'Tab' && panelRef.current) {
        const items = [...panelRef.current.querySelectorAll<HTMLElement>('button, a[href], [tabindex]:not([tabindex="-1"])')];
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        const inside = panelRef.current.contains(document.activeElement);
        if (e.shiftKey && (document.activeElement === first || !inside)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && (document.activeElement === last || !inside)) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [rendered, close]);

  if (!rendered) return null;

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Proyecto ${rendered.title}`}
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-8 bg-[#191510]/85 backdrop-blur-xl opacity-0"
      onClick={close}
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-4xl w-full bg-[#191510] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
      >
        <button
          type="button"
          data-modal-close
          onClick={close}
          className="absolute top-4 right-4 z-30 w-11 h-11 flex items-center justify-center rounded-full bg-[#191510]/60 text-white hover:bg-white hover:text-[#191510] transition-colors duration-200 ease-[ease] shadow-md cursor-pointer focus-visible:outline-2 focus-visible:outline-white"
          aria-label="Cerrar modal"
        >
          <X size={18} />
        </button>

        {/* 16:9 entero (antes se recortaba en vertical en mobile) */}
        <div className="w-full aspect-video max-h-[55vh] relative overflow-hidden bg-[#191510]">
          <img src={rendered.image} alt={rendered.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#191510] via-transparent to-transparent" />
        </div>

        <div className="p-6 md:p-8 text-white">
          <p className="flex flex-wrap items-center gap-2 mb-3 text-[0.875rem] font-semibold text-[#f2efe6]/70 uppercase tracking-[0.08em]" style={{ fontFamily: 'var(--arch-sans)' }}>
            <span>{rendered.client}</span>
            <span aria-hidden="true">•</span>
            <span>{rendered.tag}</span>
            <span aria-hidden="true">•</span>
            <span>{rendered.year}</span>
          </p>
          <h2 className="text-4xl md:text-5xl leading-none" style={{ fontFamily: 'var(--arch-serif)' }}>
            {rendered.title}
          </h2>
        </div>
      </div>
    </div>
  );
};
