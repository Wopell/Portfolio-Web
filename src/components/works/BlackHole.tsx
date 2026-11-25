import React, { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger, prefersReducedMotion } from '../../lib/gsap';
import './blackhole.css';

/**
 * Transición planeta → trabajos, en 3D real (CSS 3D, una sola escena):
 *  1. Un piso de papel visto en isométrico, con un pozo cuadrado (sin ventanas:
 *     solo paredes en sombra y un fondo negro). Encima se lee CREATIVE y, al
 *     bajar, las letras caen una por una dentro del pozo.
 *  2. La cámara cambia de ángulo: el piso gira hasta quedar de frente y el pozo
 *     crece hasta ocupar toda la base; se ven sus paredes en perspectiva.
 *  3. Barrido en 3D: el fondo del pozo, que ya llena la pantalla, es una losa
 *     negra con espesor. Bascula desde su borde de arriba hacia el fondo (en
 *     perspectiva, se ve su canto) y debajo aparece la galería, que ya estaba ahí.
 * Atado al scroll (scrub). Con reduced-motion queda el piso quieto en isométrico.
 */

const WORD = 'CREATIVE';

export const BlackHole: React.FC = () => {
  const rootRef = useRef<HTMLElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const spinRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLParagraphElement>(null);
  const slabRef = useRef<HTMLDivElement>(null);
  const shadeRef = useRef<HTMLDivElement>(null);
  const fogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const tilt = tiltRef.current;
    const spin = spinRef.current;
    const word = wordRef.current;
    const slab = slabRef.current;
    const shade = shadeRef.current;
    const fog = fogRef.current;
    if (!root || !tilt || !spin || !word || !slab || !shade || !fog || prefersReducedMotion()) return;
    const letters = [...word.querySelectorAll<HTMLElement>('[data-letter]')];

    const ctx = gsap.context(() => {
      // punto de partida explícito (el mismo que el CSS): isométrico
      gsap.set(tilt, { rotationX: 58, scale: 1, y: 0 });
      gsap.set(spin, { rotation: 45 });
      gsap.set([slab, shade], { autoAlpha: 0 });
      gsap.set(slab, { rotationX: 0 });

      /* las letras caen al centro de la boca del pozo (el origen de la escena,
         que en pantalla queda fijo: .bh__world está centrado ahí) */
      const dx = (el: HTMLElement) => () => tilt.offsetLeft - (word.offsetLeft + el.offsetLeft + el.offsetWidth / 2);
      const dy = (el: HTMLElement) => () => tilt.offsetTop - (word.offsetTop + el.offsetTop + el.offsetHeight / 2);

      /* escala para que la boca del pozo cubra toda la pantalla de frente */
      const fill = () => {
        const hole = spin.querySelector<HTMLElement>('.bh__shaft')!.offsetWidth;
        return (Math.max(window.innerWidth, window.innerHeight) * 1.35) / hole;
      };

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: root,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });

      // 1. las letras caen en orden de lectura (ease-in: gravedad, no interfaz)
      letters.forEach((el, k) => {
        const s = (k % 2 ? 1 : -1) * (16 + ((k * 23) % 28));
        tl.to(el, { x: dx(el), y: dy(el), rotation: s, scale: 0.35, ease: 'power2.in', duration: 0.14 }, 0.02 + k * 0.035);
        tl.to(el, { opacity: 0, duration: 0.03 }, 0.02 + k * 0.035 + 0.12);
      });

      // 2. la cámara gira hasta mirar el pozo de frente y se mete en él: la boca
      //    crece hasta ocupar toda la base y las paredes pasan en perspectiva
      tl.to(fog, { autoAlpha: 0, duration: 0.12 }, 0.34);
      tl.to(spin, { rotation: 0, ease: 'power2.inOut', duration: 0.24 }, 0.34);
      tl.to(tilt, { rotationX: 0, ease: 'power2.inOut', duration: 0.24 }, 0.34);
      tl.to(tilt, { scale: fill, ease: 'power2.in', duration: 0.22 }, 0.38);

      // el fondo del pozo pasa a ser la losa (oscuro sobre oscuro: el cambio no se nota)
      tl.to([slab, shade], { autoAlpha: 1, duration: 0.04 }, 0.6);
      tl.set(tilt, { autoAlpha: 0 }, 0.64);

      // 3. barrido en 3D: la losa bascula hacia el fondo desde su borde de arriba;
      //    debajo, la galería se aclara a medida que la losa se va
      tl.to(slab, { rotationX: -90, ease: 'power1.inOut', duration: 0.3 }, 0.64);
      tl.to(shade, { autoAlpha: 0, duration: 0.3 }, 0.64);
    }, root);

    const id = window.setTimeout(() => ScrollTrigger.refresh(), 600);
    return () => {
      window.clearTimeout(id);
      ctx.revert();
    };
  }, []);

  return (
    <section ref={rootRef} className="bh" aria-hidden="true">
      <div className="bh__stage">
        {/* la escena 3D: tilt (rotateX, escala, y) ▸ spin (rotateZ) ▸ piso + pozo */}
        <div ref={tiltRef} className="bh__world">
          <div ref={spinRef} className="bh__spin">
            {/* el piso: cuatro paños alrededor del hueco, así el hueco es real */}
            <div className="bh__panel bh__panel--n" />
            <div className="bh__panel bh__panel--s" />
            <div className="bh__panel bh__panel--w" />
            <div className="bh__panel bh__panel--e" />
            {/* el pozo: paredes que bajan y el fondo negro */}
            <div className="bh__shaft">
              <div className="bh__wall bh__wall--n" />
              <div className="bh__wall bh__wall--s" />
              <div className="bh__wall bh__wall--w" />
              <div className="bh__wall bh__wall--e" />
              <div className="bh__bottom" />
            </div>
          </div>
        </div>
        <div ref={fogRef} className="bh__fog" />
        {/* la losa del barrido, con su propia perspectiva (bisagra arriba) */}
        <div className="bh__lid">
          <div ref={shadeRef} className="bh__shade" />
          <div ref={slabRef} className="bh__slab">
            <div className="bh__edge" />
          </div>
        </div>
        <p ref={wordRef} className="bh__word">
          {WORD.split('').map((ch, i) => (
            <span key={i} data-letter className="bh__letter">
              {ch}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
};
