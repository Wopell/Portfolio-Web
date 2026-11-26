import React, { useEffect, useRef, useState, type CSSProperties } from 'react';
import './display.css';

/**
 * Clientes — los 30 logos en una tira que se mueve sola, debajo de los trabajos.
 * Cada marca recortada a su contorno (public/logos/ink), en un solo gris. Con
 * reduced-motion la tira queda quieta y los logos bajan a varias filas.
 *
 * Peso visual: cada logo ocupa la misma superficie, corregida por cuánta tinta tiene
 * (un escudo lleno pesa más que un trazo fino). ancho = u · √(proporción / densidad),
 * con densidad = √(cobertura / 0.35) acotada a 0.7–1.4. `u` lo pone el CSS por tamaño.
 * Proporción y cobertura medidas sobre cada archivo. Orden: se alternan formas anchas
 * y compactas para que la tira tenga ritmo.
 */
const CLIENTS: { file: string; name: string; aspect: number; coverage: number }[] = [
  { file: 'diageo', name: 'Diageo', aspect: 4.604, coverage: 0.436 },
  { file: 'banco-macro', name: 'Banco Macro', aspect: 1.561, coverage: 0.576 },
  { file: 'puma', name: 'Puma', aspect: 6.024, coverage: 0.534 },
  { file: 'guinness', name: 'Guinness', aspect: 1.961, coverage: 0.218 },
  { file: 'loreal', name: "L'Oréal", aspect: 3.8, coverage: 0.215 },
  { file: 'general-motors', name: 'General Motors', aspect: 1, coverage: 0.405 },
  { file: 'telecom', name: 'Telecom', aspect: 5, coverage: 0.356 },
  { file: 'chevrolet', name: 'Chevrolet', aspect: 2.739, coverage: 0.364 },
  { file: 'mugler', name: 'Mugler', aspect: 6.914, coverage: 0.37 },
  { file: 'johnnie-walker', name: 'Johnnie Walker', aspect: 1.527, coverage: 0.081 },
  { file: 'gillette', name: 'Gillette', aspect: 4.016, coverage: 0.624 },
  { file: 'banco-interamericando-de-desarrollo', name: 'BID', aspect: 2.697, coverage: 0.468 },
  { file: 'betterfly', name: 'Betterfly', aspect: 5.293, coverage: 0.469 },
  { file: 'footy', name: 'Footy', aspect: 1, coverage: 0.627 },
  { file: 'smirnoff', name: 'Smirnoff', aspect: 3.485, coverage: 0.602 },
  { file: 'salta-cautiva', name: 'Salta Cautiva', aspect: 1.191, coverage: 0.212 },
  { file: 'balanz', name: 'Balanz', aspect: 5.488, coverage: 0.509 },
  { file: 'yoy', name: 'Yoy', aspect: 1.703, coverage: 0.44 },
  { file: 'buen-bit', name: 'Buenbit', aspect: 4.304, coverage: 0.294 },
  { file: 'elemento', name: 'Elemento', aspect: 1.323, coverage: 0.228 },
  { file: 'wegovy', name: 'Wegovy', aspect: 4.745, coverage: 0.41 },
  { file: 'master-metrics', name: 'Master Metrics', aspect: 3.006, coverage: 0.306 },
  { file: 'naldo', name: 'Naldo', aspect: 4.542, coverage: 0.515 },
  { file: 'livian', name: 'Livian', aspect: 1.488, coverage: 0.157 },
  { file: 'simplicity', name: 'Simplicity', aspect: 4.423, coverage: 0.451 },
  { file: 'amaze', name: 'Amaze', aspect: 1.057, coverage: 0.194 },
  { file: 'contagram', name: 'Contagram', aspect: 3.968, coverage: 0.254 },
  { file: 'pascual-toso', name: 'Pascual Toso', aspect: 2.495, coverage: 0.091 },
  { file: 'mayma', name: 'Mayma', aspect: 2.758, coverage: 0.341 },
  { file: 'cremolatti', name: 'Cremolatti', aspect: 2.204, coverage: 0.108 },
];

const widthFactor = (aspect: number, coverage: number) => {
  const density = Math.min(1.4, Math.max(0.7, Math.sqrt(coverage / 0.35)));
  return Math.sqrt(aspect / density);
};

/* una pasada de la tira; se repite una vez para que el giro no tenga costura
   (la copia no la leen los lectores de pantalla) */
const Track: React.FC<{ copy?: boolean; near: boolean }> = ({ copy, near }) => (
  <ul className="logos__track" aria-hidden={copy || undefined} aria-label={copy ? undefined : 'Clientes'}>
    {CLIENTS.map((c) => (
      <li key={c.file} className="logos__item">
        <img
          src={`/logos/ink/${c.file}.webp`}
          alt={copy ? '' : c.name}
          loading={near ? 'eager' : 'lazy'}
          decoding="async"
          draggable={false}
          style={{ '--wf': widthFactor(c.aspect, c.coverage).toFixed(3), aspectRatio: String(c.aspect) } as CSSProperties}
        />
      </li>
    ))}
  </ul>
);

/* los logos que todavía no pasaron por la tira no cuentan como visibles para la
   carga diferida: cuando la tira se acerca a la pantalla, se cargan todos juntos
   (así ninguno aparece tarde al entrar por el borde) */
export const ClientsLine: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: '800px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [near]);
  return (
    <div ref={ref} className="logos">
      <div className="logos__belt">
        <Track near={near} />
        <Track copy near={near} />
      </div>
    </div>
  );
};
