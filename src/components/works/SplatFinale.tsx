import React, { useEffect, useMemo, useRef } from 'react';
import { ScrollTrigger, prefersReducedMotion } from '../../lib/gsap';
import { FINALE_IMAGE } from '../../data/display-works';
import { SplatCanvas } from './SplatCanvas';

/**
 * Imagen final — cierre de la página. Un fotograma de Arcane hecho splats que
 * se arma desde polvo a medida que bajás; el pie de página vive encima.
 */
export const SplatFinale: React.FC = () => {
  const ref = useRef<HTMLElement>(null);
  const assembleRef = useRef(prefersReducedMotion() ? 1 : 0);
  const sources = useMemo(() => [{ src: FINALE_IMAGE, focusX: 0.72 }], []);

  useEffect(() => {
    if (prefersReducedMotion() || !ref.current) return;
    const st = ScrollTrigger.create({
      trigger: ref.current,
      start: 'top bottom',
      end: 'top 10%',
      scrub: true,
      onUpdate: (self) => {
        assembleRef.current = self.progress;
      },
    });
    return () => st.kill();
  }, []);

  return (
    <footer ref={ref} className="finale" aria-label="Cierre">
      <SplatCanvas
        sources={sources}
        index={0}
        assembleRef={assembleRef}
        density={52000}
        depth={0.5}
        className="finale__canvas"
      />
      <span aria-hidden="true" className="disp__scan" />
      <span aria-hidden="true" className="finale__fade" />

      <div className="finale__inner">
        <p className="disp__pixel finale__kicker">Fin de la transmisión</p>
        <p className="finale__line">
          Gracias por <em>mirar.</em>
        </p>
        <a className="finale__mail" href="mailto:tomy.wopell@gmail.com">
          tomy.wopell@gmail.com <span aria-hidden="true">↗</span>
        </a>
        <div className="arch-rule arch-rule--wrap finale__rule">
          <span>Wopell — Tomy Powell</span>
          <span aria-hidden="true" className="arch-rule__line" />
          <span>Buenos Aires · Worldwide</span>
        </div>
      </div>
    </footer>
  );
};
