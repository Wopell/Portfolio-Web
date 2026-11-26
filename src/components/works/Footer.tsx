import React from 'react';
import { ClientsLine } from './Clients';
import './display.css';

/**
 * Footer — debajo de los trabajos y antes de la placa de contacto: «Clientes», la
 * tira que se mueve con los 30 logos, y la firma.
 */
export const Footer: React.FC = () => (
  <footer className="foot">
    <p className="foot__label">Clientes</p>
    <ClientsLine />
    <div className="foot__inner">
      <div className="foot__bar">
        <span>Wopell — Tomy Powell</span>
        <span>Buenos Aires · Worldwide</span>
        <span>© {new Date().getFullYear()}</span>
      </div>
    </div>
  </footer>
);
