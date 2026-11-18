import React from 'react';
import './display.css';

/** Clientes — una fila estática de las marcas más reconocibles (logos reales en /logos/Black). */
const CLIENTS = [
  ['Diageo', 'Diageo'],
  ['Chevrolet', 'Chevrolet'],
  ['Loreal', "L'Oréal"],
  ['Guinness', 'Guinness'],
  ['Johnnie Walker', 'Johnnie Walker'],
  ['Smirnoff', 'Smirnoff'],
  ['Gillette', 'Gillette'],
  ['General motors', 'General Motors'],
  ['Mugler', 'Mugler'],
  ['Banco Macro', 'Banco Macro'],
  ['Betterfly', 'Betterfly'],
  ['Telecom', 'Telecom'],
] as const;

export const Clients: React.FC = () => (
  <section className="clients" aria-labelledby="clients-title">
    <div className="clients__inner">
      <h2 id="clients-title" className="clients__label">
        Clientes
      </h2>
      <ul className="clients__logos">
        {CLIENTS.map(([file, name]) => (
          <li key={file}>
            <img src={`/logos/Black/${file}.webp`} alt={name} loading="lazy" draggable={false} />
          </li>
        ))}
      </ul>
    </div>
  </section>
);
