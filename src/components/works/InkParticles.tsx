import React, { useLayoutEffect, useRef } from 'react';
import { gsap, prefersReducedMotion } from '../../lib/gsap';

/**
 * Ink particle field — thin hand-drawn asterisks, plus signs and dots
 * scattered over the paper (per senal_Particles_1920px.png).
 * Deterministic layout; GSAP drifts / twinkles / rotates each glyph.
 */

const STAR6 =
  'M12 2v20M4.2 5.9l15.6 8.2M4.2 14.1l15.6-8.2';
const SPARK4 =
  'M12 2c1 6 3.4 8.4 10 10-6.6 1.6-9 4-10 10-1-6-3.4-8.4-10-10 6.6-1.6 9-4 10-10Z';
const PLUS =
  'M12 4v16M4 12h16';
const DOT = undefined; // rendered as a filled circle

const GLYPHS: Array<{ kind: 0 | 1 | 2 | 3 }> = Array.from({ length: 70 }, (_, i) => ({
  kind: (Math.floor(Math.abs(Math.sin(i * 127.1) * 4)) % 4) as 0 | 1 | 2 | 3,
}));

/* deterministic pseudo-random in [0,1) */
const rnd = (i: number, salt: number) => {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export const InkParticles: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    const glyphs = gsap.utils.toArray<SVGElement>('[data-ink]', ref.current);
    if (!glyphs.length) return;

    const ctx = gsap.context(() => {
      glyphs.forEach((el, i) => {
        const dur = 5 + rnd(i, 1) * 6;
        gsap.to(el, {
          y: (rnd(i, 2) - 0.5) * 26,
          x: (rnd(i, 3) - 0.5) * 18,
          rotation: `+=${24 + rnd(i, 4) * 30 * (rnd(i, 5) > 0.5 ? 1 : -1)}`,
          opacity: 1,
          duration: dur,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          repeatDelay: rnd(i, 6) * 2,
          delay: rnd(i, 7) * 1.5,
        });
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={ref}
      className="absolute inset-0 pointer-events-none overflow-visible"
      aria-hidden="true"
      style={{ zIndex: 0 }}
    >
      {GLYPHS.map((g, i) => {
        const size = 11 + rnd(i, 8) * 18;
        const x = 1 + rnd(i, 9) * 97;
        const y = 2 + rnd(i, 10) * 96;
        const baseRot = rnd(i, 11) * 70 - 35;
        const twinkle = 0.3 + rnd(i, 12) * 0.45;
        return (
          <span
            key={i}
            className="absolute block will-change-transform"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <svg data-ink width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"
              style={{ transform: `rotate(${baseRot}deg)`, opacity: twinkle }}>
              {(() => {
                switch (g.kind) {
                  case 0:
                    return <path d={STAR6} stroke="#191510" strokeWidth="1.3" strokeLinecap="round" />;
                  case 1:
                    return <path d={SPARK4} fill="#191510" />;
                  case 2:
                    return <path d={PLUS} stroke="#191510" strokeWidth="1.3" strokeLinecap="round" />;
                  default:
                    return <circle cx="12" cy="12" r="2.6" fill="#191510" />;
                }
              })()}
            </svg>
          </span>
        );
      })}
    </div>
  );
};
