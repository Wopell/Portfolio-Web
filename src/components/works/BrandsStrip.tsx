import React, { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger, EASE, prefersReducedMotion } from '../../lib/gsap';

/**
 * "MARCAS & CLIENTES COMERCIALES" — one retro ruled band: graph-paper
 * texture, top & bottom rules, every client logo drifting as a marquee
 * whose speed reacts to scroll velocity (per senal_Clientes_1920px.png).
 */

const CLIENTS = [
  'Diageo', 'Elemento', 'Footy', 'Chevrolet', "L'Oreal", 'Guinness',
  'Johnnie Walker', 'Puma Energy', 'Wegovy', 'Telecom', 'Amaze',
  'Smirnoff', 'Balanz', 'Banco Macro',
].map((name) => ({ name, logo: `/logos/Black/${name}.webp` }));

export const BrandsStrip: React.FC = () => {
  const rootRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('[data-brands-logo]', {
        autoAlpha: 0,
        y: 14,
        duration: 0.55,
        ease: EASE.settle,
        stagger: 0.05,
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

      <div
        className="brands-band w-full mt-3 border-y-2 border-[#191510] overflow-hidden bg-[#f6f3e9]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(25,21,16,0.13) 1px, transparent 1px), linear-gradient(to bottom, rgba(25,21,16,0.13) 1px, transparent 1px)',
          backgroundSize: '26px 26px',
        }}
      >
        <div ref={trackRef} className="flex whitespace-nowrap items-center w-max will-change-transform py-6 sm:py-8">
          {[...CLIENTS, ...CLIENTS].map((brand, i) => (
            <span key={`${brand.name}-${i}`} data-brands-logo className="flex items-center px-10 sm:px-16">
              <img
                src={brand.logo}
                alt={i < CLIENTS.length ? brand.name : ''}
                aria-hidden={i >= CLIENTS.length}
                loading="lazy"
                className="h-12 sm:h-[68px] w-auto max-w-[170px] object-contain brightness-0 mix-blend-multiply opacity-85 hover:opacity-100 hover:scale-[1.04] transition-transform duration-300"
              />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};
