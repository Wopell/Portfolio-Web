import React, { useEffect, useRef, useState } from 'react';
import { gsap, EASE, prefersReducedMotion } from '../../lib/gsap';
import { SectionHead } from './SectionHead';

/**
 * Contacto — tablero de stickers.
 * Tu foto pegada con cinta + cuatro fichas de color (una por canal), cada una
 * levemente torcida como pegada a mano; al pasar el mouse se enderezan y se
 * levantan. El email es la acción principal: mailto + copiar.
 */
const EMAIL = 'tomy.wopell@gmail.com';

const CHANNELS = [
  { id: 'email', label: 'Email', value: EMAIL, href: `mailto:${EMAIL}`, external: false },
  { id: 'instagram', label: 'Instagram', value: '@wopell', href: 'https://instagram.com/wopell', external: true },
  { id: 'telegram', label: 'Telegram', value: '@wopell', href: 'https://t.me/wopell', external: true },
  { id: 'behance', label: 'Behance', value: 'Tomy Powell', href: 'https://www.behance.net/wopell', external: true },
];

export const WorkTogetherCard: React.FC = () => {
  const rootRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);

  /* entrada: las fichas se «pegan» una por una */
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from('[data-wt-stick]', {
        y: 40,
        rotate: (i) => (i % 2 ? 8 : -8),
        scale: 0.92,
        autoAlpha: 0,
        duration: 0.8,
        ease: EASE.outBack,
        stagger: 0.08,
        clearProps: 'transform,opacity,visibility',
        scrollTrigger: { trigger: rootRef.current, start: 'top 75%', once: true },
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(t);
  }, [copied]);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
    } catch {
      window.location.href = `mailto:${EMAIL}`;
    }
  };

  return (
    <section
      ref={rootRef}
      id="work-together"
      data-section="work-together"
      aria-labelledby="work-together-title"
      className="arch-wrap py-20 sm:py-28"
    >
      <SectionHead
        index="02"
        label="Contacto"
        meta="Buenos Aires — AR"
        id="work-together-title"
        title={
          <>
            Let&rsquo;s work <em>together</em>
          </>
        }
      />

      <div className="wt mt-12 sm:mt-16">
        <div className="wt__side">
          <figure className="wt__photo" data-wt-stick>
            <img src="/works/tomy-card.webp" alt="Tomy Powell, retrato en blanco y negro" width={540} height={324} loading="lazy" />
            <span aria-hidden="true" className="tape tape--tl" />
            <span aria-hidden="true" className="tape tape--br" />
          </figure>

          <p className="arch-lede">
            Motion, 3D y post. Para marcas, agencias y emprendedores que quieren piezas{' '}
            <span className="hl">con criterio</span>.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <a href={`mailto:${EMAIL}`} className="arch-btn arch-btn--solid">
              Escribime <span aria-hidden="true">→</span>
            </a>
            <button type="button" onClick={copyEmail} className="arch-btn" aria-live="polite">
              {copied ? '¡Copiado! ✓' : 'Copiar email'}
            </button>
          </div>
        </div>

        <div className="wt__board">
          <p className="hand wt__hint" aria-hidden="true">
            elegí uno
            <svg viewBox="0 0 40 46" width="26" height="30">
              <path d="M8 4 C 20 10, 26 22, 22 40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M15 34 L 22 41 L 29 34" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </p>
          <ul className="wt__tiles" aria-label="Canales de contacto">
            {CHANNELS.map((c) => (
              <li key={c.id} className={`wt__cell wt__cell--${c.id}`} data-wt-stick>
                <a
                  href={c.href}
                  className={`wt-tile wt-tile--${c.id}`}
                  {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  <span className="wt-tile__label">{c.label}</span>
                  <span className="wt-tile__value">{c.value}</span>
                  <span aria-hidden="true" className="wt-tile__arrow">
                    {c.external ? '↗' : '→'}
                  </span>
                  {c.id === 'email' && <span aria-hidden="true" className="tape tape--top" />}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};
