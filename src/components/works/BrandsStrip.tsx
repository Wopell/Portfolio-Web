import React, { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger, EASE, prefersReducedMotion } from '../../lib/gsap';

/**
 * "MARCAS & CLIENTES COMERCIALES" — 3 featured logos on a graph-paper band
 * plus a marquee whose speed reacts to scroll velocity (GSAP ScrollTrigger).
 */

const FEATURED = [
  { name: 'Diageo', logo: '/logos/Black/Diageo.webp' },
  { name: 'Elemento', logo: '/logos/Black/Elemento.webp' },
  { name: 'Footy', logo: '/logos/Black/Footy.webp' },
];

const EXTENDED = [
  'Chevrolet', "L'Oreal", 'Guinness', 'Johnnie Walker', 'Puma Energy',
  'Wegovy', 'Telecom', 'Amaze', 'Smirnoff', 'Balanz', 'Banco Macro',
].map((name) => ({ name, logo: `/logos/Black/${name}.webp` }));

export const BrandsStrip: React.FC = () => {
  const rootRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('[data-brands-cell]', {
        autoAlpha: 0,
        y: 16,
        duration: 0.55,
        ease: EASE.settle,
        stagger: 0.08,
        scrollTrigger: { trigger: rootRef.current, start: 'top 85%', once: true },
      });

      const track = trackRef.current;
      if (!track) return;

      if (prefersReducedMotion()) {
        track.classList.add('brands-marquee--static');
        return;
      }

      // endless loop with wrap; scroll velocity briefly boosts the speed
      const loop = gsap.to(track, {
        xPercent: -50,
        ease: 'none',
        duration: 26,
        repeat: -1,
      });
      const st = ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: (self) => {
          const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 1200, 3);
          gsap.to(loop, { timeScale: boost, duration: 0.25, overwrite: true });
          gsap.to(loop, { timeScale: 1, duration: 1.2, delay: 0.25, overwrite: false });
        },
      });
      const parent = track.parentElement;
      const pause = () => gsap.to(loop, { timeScale: 0, duration: 0.4, overwrite: true });
      const resume = () => gsap.to(loop, { timeScale: 1, duration: 0.6, overwrite: true });
      parent?.addEventListener('pointerenter', pause);
      parent?.addEventListener('pointerleave', resume);

      return () => {
        st.kill();
        loop.kill();
        parent?.removeEventListener('pointerenter', pause);
        parent?.removeEventListener('pointerleave', resume);
      };
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      id="brands"
      data-section="brands"
      aria-labelledby="brands-title"
      className="w-full mt-16 sm:mt-24 mb-10"
    >
      <p
        id="brands-title"
        className="mb-3 font-mono text-xs uppercase tracking-[0.25em] text-zinc-800 font-bold"
      >
        MARCAS &amp; CLIENTES COMERCIALES
      </p>

      <div className="w-full bg-[#fffdfa]/60 border border-black/30 rounded-xl overflow-hidden shadow-sm">
        <ul className="grid grid-cols-3 divide-x divide-black/30">
          {FEATURED.map((brand) => (
            <li
              key={brand.name}
              data-brands-cell
              className="brands-cell flex items-center justify-center p-4 sm:p-7 min-h-[85px] sm:min-h-[110px]"
            >
              <img
                src={brand.logo}
                alt={brand.name}
                loading="lazy"
                className="h-8 sm:h-11 w-auto max-w-[130px] object-contain brightness-0 opacity-90 transition-transform duration-300 hover:scale-105"
              />
            </li>
          ))}
        </ul>
      </div>

      <div className="brands-marquee mt-3.5 pt-3.5 border-t border-black/15 overflow-hidden">
        <div ref={trackRef} className="flex whitespace-nowrap items-center w-max will-change-transform">
          {[...EXTENDED, ...EXTENDED].map((brand, i) => (
            <span key={`${brand.name}-${i}`} className="flex items-center px-5 sm:px-7">
              <img
                src={brand.logo}
                alt={i < EXTENDED.length ? brand.name : ''}
                aria-hidden={i >= EXTENDED.length}
                loading="lazy"
                className="h-6 sm:h-7 w-auto max-w-[100px] object-contain brightness-0 opacity-60 hover:opacity-100 transition-opacity duration-300"
              />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};
