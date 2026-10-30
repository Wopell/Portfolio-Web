import React from 'react';

/**
 * Hero header of the works page — "WORK'S" composition per the approved
 * reference (docs/referencias/aprobados/senal_Titulo_1920px.png):
 * dither strips + asterisk runs, giant striped pixel title, mono subtitle
 * with hand-drawn underline, taped chibi sticker with a pointing arrow.
 * The planet section below is unchanged.
 */

/* thin ink asterisk (6-ray star) used as a floating particle glyph */
const InkStar: React.FC<{ size: number; className?: string; style?: React.CSSProperties }> = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"
    className={className} style={style}>
    <path
      d="M12 2v20M4.2 5.9l15.6 8.2M4.2 14.1l15.6-8.2M12 2l-2.6 6.8M12 22l-2.6-6.8"
      stroke="#191510" strokeWidth="1.4" strokeLinecap="round"
    />
  </svg>
);

const DITHER = 'repeating-conic-gradient(#191510 0% 25%, transparent 0% 50%) 0 0 / 5px 5px';

const StarRun: React.FC<{ className?: string }> = ({ className }) => (
  <span className={`flex items-center gap-2.5 ${className ?? ''}`} aria-hidden="true">
    {[0, 1, 2, 3].map((i) => (
      <InkStar key={i} size={14} className={i % 2 ? 'translate-y-[3px]' : ''} />
    ))}
  </span>
);

const DitherBar: React.FC<{ className?: string }> = ({ className }) => (
  <span
    className={`block h-[13px] sm:h-[15px] ${className ?? ''}`}
    style={{ background: DITHER }}
    aria-hidden="true"
  />
);

export const HeroHeader: React.FC = () => {
  return (
    <div
      id="hero-header-container"
      className="relative pointer-events-none w-full pt-2 pb-14 sm:pb-16 flex flex-col items-center justify-center select-none"
      style={{ zIndex: 'var(--z-title, 50)' }}
    >
      {/* Blueprint cross, as in the reference */}
      <span className="absolute left-0 sm:left-3 -top-1 font-mono text-2xl text-zinc-800" aria-hidden="true">+</span>

      {/* ── top dither strip run — spans the same width as the title ─────── */}
      <div className="w-full flex items-center gap-3 sm:gap-5" aria-hidden="true">
        <DitherBar className="flex-[1.8] min-w-0" />
        <StarRun className="shrink-0" />
        <DitherBar className="flex-[1.05] min-w-0 opacity-90" />
        <StarRun className="shrink-0" />
      </div>

      {/* ── giant striped pixel title ────────────────────────────────────── */}
      <div className="relative mt-2 sm:mt-3" aria-hidden="false">
        {/* floating ink stars around the word, as in the reference margins */}
        <InkStar size={30} className="absolute -left-10 sm:-left-16 top-[38%] rotate-12" />
        <InkStar size={22} className="absolute -right-6 sm:-right-12 top-[26%] rotate-[30deg]" />
        <InkStar size={17} className="absolute -right-9 sm:-right-16 bottom-[6%] rotate-[55deg] opacity-85" />
        <InkStar size={13} className="absolute left-4 -bottom-8 -rotate-12 opacity-70" />

        <h1
          className="works-stripe-title font-pixel uppercase leading-none text-[52px] sm:text-[100px] md:text-[120px] lg:text-[180px]"
        >
          WORK&rsquo;S
        </h1>
        <span className="sr-only">Work&rsquo;s — Tomy Powell&rsquo;s portfolio</span>
      </div>

      {/* ── subtitle strip run ───────────────────────────────────────────── */}
      <div className="w-full mt-2 sm:mt-3 flex items-center gap-4 sm:gap-6">
        <DitherBar className="flex-[1.15] min-w-0" />
        <p className="shrink-0 flex items-baseline gap-2 sm:gap-3 font-mono font-bold text-zinc-950 text-[13px] sm:text-lg md:text-xl tracking-[0.14em] uppercase">
          <span className="relative inline-block">
            TOMY POWELL&rsquo;S
            <svg
              className="absolute left-0 -bottom-2 w-full"
              viewBox="0 0 120 8"
              fill="none"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d="M3 5.5 C 28 3, 62 6.5, 117 3.6" stroke="#191510" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
          </span>
          <span aria-hidden="true">//</span>
          <span>PORTFOLIO</span>
        </p>
        <DitherBar className="flex-[1.15] min-w-0 opacity-90" />
      </div>

      {/* ── taped chibi sticker with pointing arrow (right edge, below the
             subtitle row, as in the reference) ────────────────────────────── */}
      <figure className="absolute right-1 sm:right-2 -bottom-20 sm:-bottom-24 w-[104px] sm:w-[150px] rotate-[-3deg] pointer-events-none" aria-hidden="true">
        <svg viewBox="0 0 80 40" className="absolute -left-[64px] sm:-left-[88px] top-[38%] w-[62px] sm:w-[80px] -rotate-6" fill="none">
          <path d="M4 30 C 22 36, 50 30, 70 18" stroke="#191510" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M60 16 L 71 17.5 L 66 27" stroke="#191510" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
        <span className="absolute inset-0 border-2 border-[#4A4036] rounded-[10px]" />
        <span className="tape-strip absolute -top-2.5 left-1/2 -translate-x-1/2 w-14 h-5 rotate-[3deg]" />
        <img
          src="/ref/wopell-chibi.png"
          alt=""
          className="w-full rounded-[8px] select-none"
          draggable={false}
        />
      </figure>
    </div>
  );
};
