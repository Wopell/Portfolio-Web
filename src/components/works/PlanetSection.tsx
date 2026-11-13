import React from 'react';
import { PlanetHero } from '../PlanetHero';

/**
 * PlanetSection — Wrapper de PlanetHero (Fase 2: planeta como sección propia).
 * REGLA: PlanetHero.tsx no se modifica.
 *
 * Características:
 * 1. Espaciado: ~120px de aire en desktop y ~64px en mobile sobre el globo.
 * 2. Papel cuadriculado con bordes difuminados (mask-image en los 4 lados).
 * 3. Halo suave detrás del globo (~130% diámetro, z-index inferior al canvas y órbitas).
 * 4. Marcas decorativas perimetrales tenues (+, ×, *, ·), aria-hidden y pointer-events: none.
 * 5. Overflow visible hacia los costados, sin scroll horizontal.
 */

const INK_MARK = '#191510';

const MarkPlus: React.FC<{ size?: number; className?: string; style?: React.CSSProperties }> = ({
  size = 12,
  className = '',
  style,
}) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none" aria-hidden="true" className={className} style={style}>
    <path d="M6 1v10M1 6h10" stroke={INK_MARK} strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const MarkX: React.FC<{ size?: number; className?: string; style?: React.CSSProperties }> = ({
  size = 11,
  className = '',
  style,
}) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none" aria-hidden="true" className={className} style={style}>
    <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" stroke={INK_MARK} strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const MarkStar: React.FC<{ size?: number; className?: string; style?: React.CSSProperties }> = ({
  size = 14,
  className = '',
  style,
}) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" className={className} style={style}>
    <path d="M8 2v12M2 8h12M3.8 3.8l8.4 8.4M3.8 12.2l8.4-8.4" stroke={INK_MARK} strokeWidth="1.1" strokeLinecap="round" />
  </svg>
);

export const PlanetSection: React.FC = () => {
  return (
    <section
      data-section="planet"
      aria-label="Presentación interactiva del portafolio"
      className="relative w-full overflow-visible pt-[14px] sm:pt-[92px] lg:pt-[100px]"
      style={{
        isolation: 'isolate',
        zIndex: 'var(--z-planet, 10)',
      }}
    >
      {/* Neutraliza los márgenes verticales del wrapper interno de PlanetHero (mt-6/sm:mt-8/md:mt-4/lg:mt-10)
          para controlar el aire hero→globo desde aquí, vía data-attribute estable (agregado en PlanetHero.tsx) */}
      <style>{`[data-section="planet"] [data-planet-canvas-wrap] { margin-top: 0; }`}</style>
      {/* 1. Papel cuadriculado con bordes difuminados en los 4 lados (sin cortes duros) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none select-none"
        style={{ zIndex: 0 }}
      >
        <div
          className="w-full h-full"
          style={{
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)',
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)',
          }}
        >
          <div
            className="w-full h-full paper-grid bg-[var(--color-paper,#efece1)]"
            style={{
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
              maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
            }}
          />
        </div>
      </div>

      {/* 2. Halo suave detrás del globo (~130% del diámetro: 910px desktop · 68.5vw tablet · 97vw mobile;
             el centro del globo queda pt/2 por debajo del centro de la sección) */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-[calc(50%+27px)] sm:top-[calc(50%+46px)] xl:top-[calc(50%+50px)] -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none rounded-full w-[97vw] h-[97vw] sm:w-[68.5vw] sm:h-[68.5vw] xl:w-[910px] xl:h-[910px]"
        style={{
          background:
            'radial-gradient(circle, rgba(255, 255, 255, 0.72) 0%, rgba(254, 251, 240, 0.42) 42%, rgba(239, 236, 225, 0) 72%)',
          zIndex: 1,
        }}
      />

      {/* 3. Marcas decorativas tenues perimetrales (fuera del área del globo y de las órbitas) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none select-none overflow-hidden"
        style={{ zIndex: 2 }}
      >
        {/* Flanco izquierdo (fuera del alcance orbital: 1.70×radio desde el centro) */}
        <MarkStar className="hidden md:block absolute left-[8%] top-[10%] opacity-35" />
        <MarkPlus className="hidden md:block absolute left-[18%] top-[18%] opacity-35" />
        <MarkX className="hidden md:block absolute left-[12%] top-[38%] opacity-30" />
        <MarkPlus className="hidden sm:block absolute left-[9%] bottom-[22%] opacity-35" />

        {/* Centro inferior (bajo el disco, fuera de órbitas) */}
        <MarkX className="hidden lg:block absolute left-[30%] bottom-[2%] opacity-35" />

        {/* Flanco derecho */}
        <MarkPlus className="hidden sm:block absolute right-[14%] top-[12%] opacity-35" />
        <MarkX className="hidden md:block absolute right-[16%] top-[22%] opacity-30" />
        <span
          className="hidden md:inline-flex absolute right-[4%] top-[38%] gap-1.5 opacity-35"
        >
          <span className="w-1 h-1 rounded-full bg-[#191510]" />
          <span className="w-1 h-1 rounded-full bg-[#191510]" />
        </span>
        <span
          className="hidden sm:inline-block absolute right-[7%] bottom-[16%] w-1 h-1 rounded-full bg-[#191510] opacity-35"
        />
      </div>

      {/* 4. Planeta con órbitas (PlanetHero intacto) */}
      <div
        className="relative w-full max-w-[1280px] mx-auto px-2 sm:px-4 overflow-visible"
        style={{ isolation: 'isolate', zIndex: 'var(--z-planet, 10)' }}
      >
        <PlanetHero />
      </div>
    </section>
  );
};
