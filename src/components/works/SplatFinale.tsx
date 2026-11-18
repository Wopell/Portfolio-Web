import React, { useEffect, useMemo, useRef } from 'react';
import { ScrollTrigger, prefersReducedMotion } from '../../lib/gsap';
import { FINALE_IMAGE } from '../../data/display-works';
import { SplatCanvas } from './SplatCanvas';
import './display.css';

/**
 * Cierre — el único lugar de contacto. El papel se funde en un fotograma hecho
 * splats que se arma a medida que bajás; encima, el email y las redes.
 */
const EMAIL = 'tomy.wopell@gmail.com';
const SOCIAL = [
  { label: 'Instagram', href: 'https://instagram.com/wopell' },
  { label: 'Behance', href: 'https://www.behance.net/wopell' },
  { label: 'Telegram', href: 'https://t.me/wopell' },
];

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
    <footer ref={ref} className="finale" aria-labelledby="finale-title">
      <SplatCanvas
        sources={sources}
        index={0}
        assembleRef={assembleRef}
        density={36000}
        depth={0.5}
        className="finale__canvas"
      />
      <span aria-hidden="true" className="disp__scan" />
      <span aria-hidden="true" className="finale__fade" />

      <div className="finale__inner">
        <h2 id="finale-title" className="finale__line">
          Gracias por <em>mirar.</em>
        </h2>
        <a className="finale__mail" href={`mailto:${EMAIL}`}>
          {EMAIL}
        </a>
        <ul className="finale__social" aria-label="Redes">
          {SOCIAL.map((s) => (
            <li key={s.label}>
              <a href={s.href} target="_blank" rel="noopener noreferrer">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="arch-rule arch-rule--wrap finale__rule">
          <span>Wopell — Tomy Powell</span>
          <span aria-hidden="true" className="arch-rule__line" />
          <span>Buenos Aires · Worldwide</span>
        </div>
      </div>
    </footer>
  );
};
