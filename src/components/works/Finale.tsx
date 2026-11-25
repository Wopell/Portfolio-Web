import React from 'react';
import { CONTACT_EMAIL as EMAIL } from '../../data/display-works';
import './display.css';

/**
 * Cierre — el único lugar de contacto. El papel se funde en tinta y queda solo
 * lo esencial: la frase, el mail y las redes. Contraste, no efectos.
 */
const SOCIAL = [
  { label: 'Instagram', href: 'https://instagram.com/wopell' },
  { label: 'Behance', href: 'https://www.behance.net/tomypowell' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/tomy-powell' },
  { label: 'Telegram', href: 'https://t.me/wopell' },
];

export const Finale: React.FC = () => (
  <footer className="finale" aria-labelledby="finale-title">
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
