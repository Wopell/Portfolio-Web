import React from 'react';

/**
 * SectionHead — encabezado de archivo compartido (DIRECTION.md · Layout).
 * Fila mono `0N — NOMBRE` · línea fina · dato; debajo, el título serif con una
 * palabra en itálica. Repite el patrón de la regla del hero
 * («SELECTED PORTFOLIO ——— 2023-2027»).
 */
export const SectionHead: React.FC<{
  index: string;
  label: string;
  meta?: string;
  id: string;
  title: React.ReactNode;
  align?: 'left' | 'center';
}> = ({ index, label, meta, id, title, align = 'left' }) => (
  <header className={align === 'center' ? 'text-center' : ''}>
    <div className="arch-rule">
      <span>
        {index} — {label}
      </span>
      <span aria-hidden="true" className="arch-rule__line" />
      {meta && <span>{meta}</span>}
    </div>
    <h2 id={id} className="arch-title mt-6 sm:mt-8">
      {title}
    </h2>
  </header>
);
