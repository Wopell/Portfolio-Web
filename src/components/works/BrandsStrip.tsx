import React, { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger, EASE, prefersReducedMotion } from '../../lib/gsap';
import { SectionHead } from './SectionHead';

/**
 * Marcas — dos cintas cruzadas (lima con logos en tinta, tinta con logos en
 * papel) que corren en sentidos opuestos. La velocidad reacciona al scroll;
 * hover frena la cinta que tocás.
 */

/* every logo in public/logos/Black/ — files keep their exact names
   (Loreal.webp has no apostrophe, Puma.webp is "Puma Energy") */
const CLIENTS = [
  { file: 'Diageo', name: 'Diageo' },
  { file: 'Elemento', name: 'Elemento' },
  { file: 'Footy', name: 'Footy' },
  { file: 'Chevrolet', name: 'Chevrolet' },
  { file: 'Loreal', name: "L'Oréal" },
  { file: 'Guinness', name: 'Guinness' },
  { file: 'Johnnie Walker', name: 'Johnnie Walker' },
  { file: 'Puma', name: 'Puma Energy' },
  { file: 'Wegovy', name: 'Wegovy' },
  { file: 'Telecom', name: 'Telecom' },
  { file: 'Amaze', name: 'Amaze' },
  { file: 'Smirnoff', name: 'Smirnoff' },
  { file: 'Balanz', name: 'Balanz' },
  { file: 'Banco Macro', name: 'Banco Macro' },
  { file: 'Betterfly', name: 'Betterfly' },
  { file: 'Buen Bit', name: 'Buen Bit' },
  { file: 'Contagram', name: 'Contagram' },
  { file: 'Cremolatti', name: 'Cremolatti' },
  { file: 'Gillette', name: 'Gillette' },
  { file: 'General motors', name: 'General Motors' },
  { file: 'Master Metrics', name: 'Master Metrics' },
  { file: 'Mayma', name: 'Mayma' },
  { file: 'Mugler', name: 'Mugler' },
  { file: 'Naldo', name: 'Naldo' },
  { file: 'Pascual Toso', name: 'Pascual Toso' },
  { file: 'Salta cautiva', name: 'Salta Cautiva' },
  { file: 'Simplicity', name: 'Simplicity' },
  { file: 'Livian', name: 'Livian' },
  { file: 'Yoy', name: 'Yoy' },
  { file: 'Banco Interamericando de desarrollo', name: 'Banco Interamericano de Desarrollo' },
].map((b) => ({ ...b, logo: `/logos/Black/${b.file}.webp` }));

/* la cinta de abajo arranca por la otra mitad, así no se repiten enfrentadas */
const HALF = Math.ceil(CLIENTS.length / 2);
const ROWS = [CLIENTS, [...CLIENTS.slice(HALF), ...CLIENTS.slice(0, HALF)]];

export const BrandsStrip: React.FC = () => {
  const rootRef = useRef<HTMLElement>(null);
  const trackRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('[data-brands-band]', {
        autoAlpha: 0,
        scaleX: 0.6,
        duration: 0.9,
        ease: EASE.settle,
        stagger: 0.12,
        clearProps: 'opacity,visibility',
        scrollTrigger: { trigger: rootRef.current, start: 'top 80%', once: true },
      });

      const tracks = trackRefs.current.filter(Boolean) as HTMLDivElement[];
      if (prefersReducedMotion()) {
        tracks.forEach((t) => t.classList.add('brands-marquee--static'));
        return;
      }

      // dos loops infinitos en sentidos opuestos; el scroll los acelera un rato
      const loops = tracks.map((track, i) =>
        i === 0
          ? gsap.to(track, { xPercent: -50, ease: 'none', duration: 34, repeat: -1 })
          : gsap.fromTo(track, { xPercent: -50 }, { xPercent: 0, ease: 'none', duration: 40, repeat: -1 })
      );
      const st = ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: (self) => {
          const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 1200, 3);
          loops.forEach((loop) => {
            gsap.to(loop, { timeScale: boost, duration: 0.25, overwrite: true });
            gsap.to(loop, { timeScale: 1, duration: 1.2, delay: 0.25, overwrite: false });
          });
        },
      });
      const offs = tracks.map((track, i) => {
        const band = track.parentElement!;
        const pause = () => gsap.to(loops[i], { timeScale: 0, duration: 0.4, overwrite: true });
        const resume = () => gsap.to(loops[i], { timeScale: 1, duration: 0.6, overwrite: true });
        band.addEventListener('pointerenter', pause);
        band.addEventListener('pointerleave', resume);
        return () => {
          band.removeEventListener('pointerenter', pause);
          band.removeEventListener('pointerleave', resume);
        };
      });

      return () => {
        st.kill();
        loops.forEach((l) => l.kill());
        offs.forEach((off) => off());
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
      className="brands py-20 sm:py-28"
    >
      <div className="arch-wrap relative">
        <SectionHead
          index="04"
          label="Marcas"
          meta={`${CLIENTS.length} clientes`}
          id="brands-title"
          title={
            <>
              Brands I&rsquo;ve <em>worked with</em>
            </>
          }
        />
        <p className="hand brands__hint" aria-hidden="true">
          …y contando
        </p>
      </div>

      <div className="brands__tapes mt-12 sm:mt-16">
        {ROWS.map((row, r) => (
          <div
            key={r}
            data-brands-band
            className={`brands__band ${r === 0 ? 'brands__band--hi' : 'brands__band--ink'}`}
            {...(r === 1 ? { 'aria-hidden': true } : {})}
          >
            <div
              ref={(el) => {
                trackRefs.current[r] = el;
              }}
              className="brands__track"
            >
              {[...row, ...row].map((brand, i) => (
                <span key={`${brand.file}-${i}`} className="brands__logo">
                  <img
                    src={brand.logo}
                    alt={r === 0 && i < row.length ? brand.name : ''}
                    aria-hidden={r === 1 || i >= row.length ? true : undefined}
                    loading="lazy"
                    draggable={false}
                  />
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
