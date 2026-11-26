import React, { useEffect, useRef, useState } from 'react';
import { CONTACT_EMAIL as EMAIL, WORKS, type Work } from '../../data/display-works';
import { gsap } from '../../lib/gsap';
import { createFinaleGL, type FinaleGL } from './finaleGL';
import './display.css';

/**
 * Placa de contacto — el único lugar de contacto, a pantalla completa, al final de la
 * página (el footer con los clientes va antes). Entra por transición, atada al
 * scroll: el papel cuadriculado se desarma en sus cuadritos (tinta → píxel con el
 * color de la pieza → la pieza) hasta que la placa queda entera; recién ahí entra el
 * bloque de contacto.
 * Detrás pasan los loops de las piezas (finaleGL.ts): el mouse los arrastra como un
 * líquido, el scroll los ondula abajo y cada pieza entra en bloques.
 * El bloque: etiqueta, «Let’s work together» y una tarjeta por canal, en blanco y
 * negro sobre un vidrio oscuro (el mail se copia con un botón).
 * Con reduced-motion: sin transición ni efectos; el póster quieto y el bloque a la vista.
 */

const ICON = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

const Instagram = () => (
  <svg viewBox="0 0 24 24" {...ICON}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);
const Telegram = () => (
  <svg viewBox="0 0 24 24" {...ICON}>
    <path d="M21 4 3 11.2l6.2 2.2L21 4l-8.6 11.6L17.5 20 21 4Z" />
    <path d="m9.2 13.4 1.4 5.6 1.8-3.4" />
  </svg>
);
const Mail = () => (
  <svg viewBox="0 0 24 24" {...ICON}>
    <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
    <path d="m4 7.5 8 6 8-6" />
  </svg>
);
const Copy = () => (
  <svg className="card__ic card__ic--copy" viewBox="0 0 24 24" {...ICON}>
    <rect x="8.5" y="8.5" width="12" height="12" rx="2.5" />
    <path d="M15.5 8.5V6A2.5 2.5 0 0 0 13 3.5H6A2.5 2.5 0 0 0 3.5 6v7A2.5 2.5 0 0 0 6 15.5h2.5" />
  </svg>
);
const Check = () => (
  <svg className="card__ic card__ic--check" viewBox="0 0 24 24" {...ICON} strokeWidth={2.2}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

type Channel = { key: string; label: string; handle: string; href: string; icon: React.ReactNode };
const SOCIAL: Channel[] = [
  { key: 'instagram', label: 'Instagram', handle: '@wopell', href: 'https://instagram.com/wopell', icon: <Instagram /> },
  { key: 'telegram', label: 'Telegram', handle: '@wopell', href: 'https://t.me/wopell', icon: <Telegram /> },
  { key: 'behance', label: 'Behance', handle: 'Tomy Powell', href: 'https://www.behance.net/tomypowell', icon: <span className="card__glyph">Bē</span> },
  { key: 'linkedin', label: 'LinkedIn', handle: 'Tomy Powell', href: 'https://www.linkedin.com/in/tomy-powell', icon: <span className="card__glyph">in</span> },
];

/* piezas horizontales que pasan en la placa, en este orden */
const PREFERRED = ['reel', 'mela-b3', 'betterfly', 'arcane', 'salta-promo', 'master-metrics', 'buen-dolar'];
const CLIPS: Work[] = (() => {
  const wide = WORKS.filter((w) => w.ratio === '16/9' && w.loop);
  const picked = PREFERRED.map((id) => wide.find((w) => w.id === id)).filter((w): w is Work => Boolean(w));
  return picked.length ? picked : wide.slice(0, 6);
})();

const prefersReduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const SocialCard: React.FC<{ c: Channel }> = ({ c }) => (
  <li className={`card card--${c.key}`}>
    <a className="card__link" href={c.href} target="_blank" rel="noopener noreferrer">
      <span className="card__icon" aria-hidden="true">
        {c.icon}
      </span>
      <span className="card__text">
        <span className="card__name">{c.label}</span>
        <span className="card__handle">{c.handle}</span>
      </span>
    </a>
  </li>
);

export const Finale: React.FC = () => {
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fxRef = useRef<FinaleGL | null>(null);
  const revealRef = useRef(0);
  const [reduced] = useState(prefersReduced);
  const [noGL, setNoGL] = useState(false);
  const [now, setNow] = useState(0);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef(0);
  const live = !reduced && !noGL && CLIPS.length > 0;

  // la entrada, atada al scroll: empieza apenas asoma la sección; el papel se
  // desarma en sus cuadritos hasta que la placa queda entera, y ahí entra el bloque
  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduced) return;
    const state = { p: 0 };
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom bottom', scrub: 0.6 },
        onUpdate: () => {
          revealRef.current = state.p;
          fxRef.current?.reveal(state.p);
          root.classList.toggle('is-full', tl.progress() > 0.72);
        },
      });
      tl.to(state, { p: 1, duration: 0.7 });
      // un tramo quieto con la placa entera y el bloque a la vista
      tl.to({}, { duration: 0.3 });
    }, root);
    return () => ctx.revert();
  }, [reduced]);

  // el video y sus efectos
  useEffect(() => {
    if (!live) return;
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    const fx = createFinaleGL(canvas, root.closest('.paper-grid'));
    if (!fx) {
      setNoGL(true);
      return;
    }
    fx.reveal(revealRef.current);
    fxRef.current = fx;

    // mientras carga el primer video, el póster de la pieza
    let videoReady = false;
    const poster = new Image();
    poster.decoding = 'async';
    poster.onload = () => {
      if (!videoReady) fx.setSource(poster, false);
    };
    poster.src = CLIPS[0].image;

    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    let i = 0;
    let visible = false;
    const onData = () => {
      fx.setSource(video, videoReady); // el primero entra sin golpe; los siguientes, con
      videoReady = true;
    };
    const onEnded = () => {
      i = (i + 1) % CLIPS.length;
      video.src = CLIPS[i].loop;
      setNow(i);
      if (visible) video.play().catch(() => {});
    };
    video.addEventListener('loadeddata', onData);
    video.addEventListener('ended', onEnded);
    video.src = CLIPS[0].loop;

    // solo corre en pantalla
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (visible) {
          fx.start();
          video.play().catch(() => {});
        } else {
          fx.stop();
          video.pause();
        }
      },
      { rootMargin: '120px 0px' }
    );
    io.observe(root);

    // mouse y lápiz por pointermove; el dedo por touchmove, que sigue llegando mientras
    // la página scrollea (pointermove se corta apenas el navegador toma el gesto)
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const r = canvas.getBoundingClientRect();
      fx.pointer(e.clientX - r.left, e.clientY - r.top);
    };
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      const r = canvas.getBoundingClientRect();
      fx.pointer(t.clientX - r.left, t.clientY - r.top, e.type === 'touchstart');
    };
    root.addEventListener('pointermove', onMove, { passive: true });
    root.addEventListener('touchstart', onTouch, { passive: true });
    root.addEventListener('touchmove', onTouch, { passive: true });

    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (visible) fx.scroll(y - lastY);
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    const ro = new ResizeObserver(() => fx.resize());
    ro.observe(canvas);

    return () => {
      io.disconnect();
      ro.disconnect();
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('touchstart', onTouch);
      root.removeEventListener('touchmove', onTouch);
      window.removeEventListener('scroll', onScroll);
      video.removeEventListener('loadeddata', onData);
      video.removeEventListener('ended', onEnded);
      video.pause();
      video.removeAttribute('src');
      video.load();
      fxRef.current = null;
      fx.destroy();
    };
  }, [live]);

  useEffect(() => () => window.clearTimeout(copyTimer.current), []);

  const copyMail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* sin permiso de portapapeles: queda el link del mail */
    }
  };

  const clip = CLIPS[now];

  return (
    <section ref={rootRef} className={`finale${reduced ? ' finale--still is-full' : ''}`} aria-labelledby="finale-title">
      <div className="finale__stage">
        <div className="finale__screen">
          {live ? (
            <canvas ref={canvasRef} className="finale__gl" aria-hidden="true" />
          ) : (
            clip && (
              <>
                <img className="finale__poster" src={clip.image} alt="" aria-hidden="true" decoding="async" loading="lazy" />
                <div className="finale__scan" aria-hidden="true" />
              </>
            )
          )}
        </div>

        <div className="finale__center">
          <div className="finale__panel">
            <p className="finale__kicker">
              <span className="finale__dot" aria-hidden="true" />
              Mis redes &amp; contacto directo
            </p>
            <h2 id="finale-title" className="finale__title">
              Let’s work together
            </h2>
            <span className="finale__rule" aria-hidden="true" />
            <ul className="finale__cards">
              <SocialCard c={SOCIAL[0]} />
              <SocialCard c={SOCIAL[1]} />
              <li className={`card card--mail${copied ? ' is-copied' : ''}`}>
                <a className="card__link" href={`mailto:${EMAIL}`}>
                  <span className="card__icon" aria-hidden="true">
                    <Mail />
                  </span>
                  <span className="card__text">
                    <span className="card__name">Email</span>
                    <span className="card__handle">{EMAIL}</span>
                  </span>
                </a>
                <button type="button" className="card__copy" onClick={copyMail} aria-label="Copiar el mail">
                  <Copy />
                  <Check />
                </button>
              </li>
              <SocialCard c={SOCIAL[2]} />
              <SocialCard c={SOCIAL[3]} />
            </ul>
            <p className="sr-only" aria-live="polite">
              {copied ? 'Mail copiado' : ''}
            </p>
          </div>
        </div>

        {clip && (
          <p className="finale__now">
            En pantalla · <span className="finale__keep">{clip.client}</span> — {clip.title}
          </p>
        )}
      </div>
    </section>
  );
};
