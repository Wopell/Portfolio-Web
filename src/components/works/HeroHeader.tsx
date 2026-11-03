import React from 'react';

/**
 * Hero header of the works page — "MY WORKS" composition per the current
 * approved reference (docs/referencias/aprobados/senal_Titulo_1920px.png):
 * halftone dither bars, giant ink-stamped grotesk title with grain distress,
 * typewriter byline with a hand-drawn swash underline, pencil scribbles,
 * asterisks and tape — the chibi lives in a taped polaroid hanging from the
 * block's bottom-right corner. The planet section below is unchanged.
 */

const INK = '#17130f';

/* thin 6-ray asterisk, as scattered in the reference margins */
const InkStar6: React.FC<{ size: number; className?: string; style?: React.CSSProperties }> = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"
    className={className} style={style}>
    <path d="M12 2v20M4.2 5.9l15.6 8.2M4.2 14.1l15.6-8.2" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

/* big 8-ray asterisk, the bolder star near the title's top-left */
const InkStar8: React.FC<{ size: number; className?: string; style?: React.CSSProperties }> = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"
    className={className} style={style}>
    <path d="M12 3v18M3 7.5l18 9M3 16.5l18-9" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

/* loose pencil scribble (multi-loop hatching) */
const Scribble: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <svg viewBox="0 0 96 64" fill="none" aria-hidden="true" className={className} style={style}>
    <path
      d="M4 44 C 18 22, 30 12, 40 18 C 50 24, 34 42, 22 44 C 34 38, 56 10, 66 16 C 76 22, 58 38, 46 42 C 60 34, 74 20, 86 30 C 90 34, 84 40, 78 44"
      stroke={INK} strokeWidth="1.5" strokeLinecap="round" opacity="0.85"
    />
  </svg>
);

/* big looping swirl scribble, next to the polaroid */
const Swirl: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <svg viewBox="0 0 140 80" fill="none" aria-hidden="true" className={className} style={style}>
    <path
      d="M8 40 C 30 12, 74 10, 82 30 C 88 48, 52 62, 42 44 C 34 28, 70 22, 96 28 C 112 32, 120 44, 112 54 C 102 66, 74 62, 68 52"
      stroke={INK} strokeWidth="1.7" strokeLinecap="round" opacity="0.9"
    />
  </svg>
);

/* double parentheses arcs (" ((" ), left flanks under the title */
const ParenArcs: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <svg viewBox="0 0 40 64" fill="none" aria-hidden="true" className={className} style={style}>
    <path d="M22 4 C 8 16, 8 48, 22 60" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M36 10 C 26 20, 26 44, 36 54" stroke={INK} strokeWidth="1.8" strokeLinecap="round" opacity="0.65" />
  </svg>
);

/* double tilde "≋" pair above the title, right of centre */
const Tildes: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <svg viewBox="0 0 44 36" fill="none" aria-hidden="true" className={className} style={style}>
    <path d="M2 12 q 8 -9, 16 0 t 16 0 t 8 2" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M4 26 q 8 -9, 16 0 t 16 0" stroke={INK} strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
  </svg>
);

const DITHER = 'repeating-conic-gradient(#17130f 0% 25%, transparent 0% 50%) 0 0 / 4px 4px';

const DitherBar: React.FC<{ className?: string }> = ({ className }) => (
  <span
    className={`block h-[13px] sm:h-[15px] ${className ?? ''}`}
    style={{ background: DITHER }}
    aria-hidden="true"
  />
);

/* long hand-drawn swash under "by wopell": thin lead-in from the left,
   gentle dip, and a tail that flicks past the last letter */
const UnderlineSwash: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <svg viewBox="0 0 260 12" fill="none" preserveAspectRatio="none" aria-hidden="true" className={className} style={style}>
    <path d="M2 9 C 3 5, 7 3.5, 11 6.5" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
    <path d="M11 6.5 C 70 10.5, 190 3.5, 258 7.5" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

export const HeroHeader: React.FC = () => {
  return (
    <div
      id="hero-header-container"
      className="relative pointer-events-none w-full pt-20 sm:pt-28 pb-14 sm:pb-16 flex flex-col items-center justify-center select-none"
      style={{ zIndex: 'var(--z-title, 50)' }}
    >
      {/* ── title block (bars + word mark + byline) with % anchored decor ── */}
      <div className="relative w-full flex flex-col items-center">
        {/* top dither pair, echoed at both ends of the word mark */}
        <div className="w-[92%] sm:w-[82%] flex items-center justify-between" aria-hidden="true">
          <DitherBar className="w-[26%] sm:w-[30%]" />
          <DitherBar className="w-[26%] sm:w-[30%]" />
        </div>

        {/* hand decor around the word mark */}
        <Scribble className="absolute -left-2 sm:left-[2%] -top-6 sm:-top-4 w-16 sm:w-24 -rotate-[14deg] opacity-90" />
        <Tildes className="absolute left-[60%] sm:left-[63%] -top-5 sm:-top-2 w-8 sm:w-10 rotate-[-6deg]" />
        <span className="kraft-tape hidden sm:block absolute right-[3%] top-6 w-24 h-10 rotate-[5deg]" aria-hidden="true" />
        <span className="font-mono font-bold text-[9px] text-zinc-800/70 absolute right-[16%] sm:right-[19%] -top-1 sm:-top-2 rotate-[6deg] tracking-widest select-none" aria-hidden="true">* * *</span>

        <InkStar8 size={30} className="absolute left-[3%] sm:left-[5%] top-[24%] rotate-12" style={{ marginTop: '6px' }} />
        <InkStar6 size={17} className="absolute right-[2%] sm:right-[4%] top-[30%] rotate-[20deg]" />
        <InkStar6 size={14} className="absolute right-[1%] sm:right-[2%] bottom-[36%] rotate-[45deg] opacity-85" />
        <svg viewBox="0 0 40 18" fill="none" aria-hidden="true" className="absolute right-[6%] sm:right-[8%] top-[22%] w-7 sm:w-9">
          <path d="M2 5h20M8 13h28" stroke={INK} strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />
        </svg>
        <ParenArcs className="absolute left-[1%] sm:left-[2%] bottom-[8%] w-6 sm:w-8 -rotate-[8deg]" />

        {/* ── giant ink-stamped title ─────────────────────────────────────── */}
        <div className="relative mt-3 sm:mt-5">
          <h1
            className="ink-stamp-title uppercase leading-[0.94] tracking-[0.015em] text-[52px] sm:text-[92px] md:text-[110px] lg:text-[132px]"
          >
            MY WORKS
          </h1>
          <span className="sr-only">My Works — by Tomy Powell (wopell)</span>
        </div>

        {/* ── byline: typewriter word with bar + swash underline ─────────── */}
        <div className="relative w-[92%] sm:w-[74%] flex items-center justify-between mt-2 sm:mt-3">
          <DitherBar className="w-[24%] sm:w-[28%]" />
          <p className="relative shrink-0 font-typer text-zinc-950 text-[22px] sm:text-[32px] leading-none">
            by wopell
            <UnderlineSwash className="absolute -bottom-2.5 sm:-bottom-3 -left-[14%] w-[122%] h-2.5 sm:h-3" />
          </p>
          <DitherBar className="w-[24%] sm:w-[28%]" />
        </div>

        {/* swirl scribble near the polaroid */}
        <Swirl className="absolute right-[13%] sm:right-[17%] -bottom-7 sm:-bottom-9 w-20 sm:w-28 rotate-[6deg]" />
      </div>

      {/* ── taped polaroid chibi, hanging at the block's bottom-right ────── */}
      <figure
        className="absolute right-0 sm:right-1 -bottom-40 sm:-bottom-44 w-[96px] sm:w-[150px] rotate-[2deg]"
        aria-hidden="true"
      >
        <span className="kraft-tape absolute -top-2 -left-3 w-12 h-4 -rotate-[24deg] z-10 block" />
        <span className="kraft-tape absolute top-[8%] -right-4 w-14 h-4 rotate-[32deg] z-10 hidden sm:block" />
        <div className="polaroid-card p-1.5 pb-5 sm:p-2 sm:pb-6 rounded-[2px]">
          <img
            src="/ref/wopell-chibi.png"
            alt=""
            className="w-full rounded-[1px] select-none"
            draggable={false}
          />
        </div>
      </figure>
    </div>
  );
};
