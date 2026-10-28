import React from 'react';

/**
 * Hero header of the works page — APPROVED, do not restyle.
 * Pixel headline + marker script + blueprint crosses, per the reference.
 */
export const HeroHeader: React.FC = () => {
  return (
    <div
      id="hero-header-container"
      className="relative pointer-events-none w-full pt-4 pb-2 flex flex-col items-center justify-center text-center select-none"
      style={{ zIndex: 'var(--z-title, 50)' }}
    >
      {/* Decorative Blueprint Crosses (+) */}
      <div className="absolute -left-3 sm:left-2 top-0 text-zinc-400 font-mono text-xl pointer-events-none opacity-60">
        +
      </div>
      <div className="absolute -right-3 sm:right-2 top-0 text-zinc-400 font-mono text-xl pointer-events-none opacity-60">
        +
      </div>

      {/* Top curved annotation: TURNING IDEAS INTO VISUALS. ↴ */}
      <div className="flex items-center gap-2 mb-1.5 text-zinc-900">
        <span className="font-mono text-xs sm:text-sm font-black tracking-widest uppercase">
          TURNING IDEAS INTO VISUALS.
        </span>
        <svg
          className="w-5 h-5 text-zinc-900 -rotate-12 translate-y-0.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          aria-hidden="true"
        >
          <path d="M4 4 C10 4, 18 10, 18 18" strokeLinecap="round" />
          <path d="M13 14 L18 19 L22 14" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Main Titles: Chunky Pixel Font & Raw Marker Brush Script */}
      <div className="relative flex flex-col items-center">
        {/* Floating sparkles around typography */}
        <span className="absolute -top-3 -left-5 sm:-left-10 text-zinc-800 text-lg sm:text-2xl animate-pulse" aria-hidden="true">
          ✦
        </span>
        <span className="absolute top-1 -right-3 sm:-right-8 text-zinc-800 text-base sm:text-xl" aria-hidden="true">
          *
        </span>
        <span className="absolute -bottom-1 -left-4 text-zinc-700 text-xs sm:text-sm" aria-hidden="true">
          *
        </span>

        {/* 1. TOMY POWELL'S (Solid 8-bit chunky pixel blocks directly matching reference) */}
        <h1 className="font-pixel text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight uppercase text-zinc-950 leading-tight drop-shadow-sm select-none">
          TOMY POWELL&rsquo;S
        </h1>

        {/* 2. *PORTFOLIO* (Distressed dry-brush marker with asterisks) */}
        <p className="mt-1 flex items-center justify-center gap-1 sm:gap-2 m-0">
          <span className="font-marker text-3xl sm:text-5xl md:text-6xl lg:text-7xl text-zinc-950 rotate-[-1deg] select-none tracking-wider">
            *PORTFOLIO*
          </span>
        </p>
      </div>
    </div>
  );
};
