import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { gsap, prefersReducedMotion } from '../../lib/gsap';
import { WORKS, Work } from '../../data/display-works';
import { SplatCanvas } from './SplatCanvas';
import './display.css';

/**
 * Display — la sala de proyección de /works.
 * Un monitor oscuro apoyado sobre el papel: cada pieza aparece como una nube de
 * splats gaussianos (SplatCanvas) que se desarma y se rearma al cambiar de canal.
 *  - Autoplay cada 7 s (pausa con hover, foco o fuera de vista).
 *  - Lista de canales numerada: hover/clic cambia de canal.
 *  - Clic en la pantalla abre la ficha de la pieza.
 *  - Al entrar en vista: encendido de CRT y la imagen se arma desde polvo.
 */

const HOLD_MS = 7000;

const pad = (n: number) => String(n).padStart(2, '0');

interface WorksDisplayProps {
  onOpenWork?: (work: Work) => void;
}

export const WorksDisplay: React.FC<WorksDisplayProps> = ({ onOpenWork }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const assembleRef = useRef(prefersReducedMotion() ? 1 : 0);
  const [index, setIndex] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [inView, setInView] = useState(false);
  const [powered, setPowered] = useState(false);
  const hoverTimer = useRef<number>(0);

  const sources = useMemo(() => WORKS.map((w) => ({ src: w.image, focusX: w.focusX })), []);
  const work = WORKS[index];
  const n = WORKS.length;
  const playing = powered && inView && !hovering && !prefersReducedMotion();

  const go = useCallback((i: number) => setIndex(((i % n) + n) % n), [n]);

  /* autoplay */
  useEffect(() => {
    if (!playing) return;
    const t = window.setTimeout(() => go(index + 1), HOLD_MS);
    return () => window.clearTimeout(t);
  }, [playing, index, go]);

  /* vista + encendido (una vez) */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* encendido: una sola vez; el timeline vive hasta desmontar (no se mata al
     cambiar `powered`, que es justamente lo que dispara este efecto) */
  const powerTl = useRef<gsap.core.Timeline | null>(null);
  useEffect(() => () => void powerTl.current?.kill(), []);
  useEffect(() => {
    if (!inView || powerTl.current || powered) return;
    setPowered(true);
    if (prefersReducedMotion()) {
      assembleRef.current = 1;
      return;
    }
    powerTl.current = gsap
      .timeline()
      .fromTo(
        screenRef.current,
        { clipPath: 'inset(49.6% 0% 49.6% 0% round 18px)', filter: 'brightness(3)' },
        {
          clipPath: 'inset(0% 0% 0% 0% round 18px)',
          filter: 'brightness(1)',
          duration: 0.7,
          ease: 'expo.out',
          clearProps: 'clipPath,filter',
        }
      )
      .to(assembleRef, { current: 1, duration: 2.4, ease: 'power2.out' }, 0.15);
  }, [inView, powered]);

  const preview = (i: number) => {
    window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => go(i), 90);
  };

  return (
    <section
      ref={sectionRef}
      id="display"
      data-section="display"
      aria-labelledby="display-title"
      className="disp"
    >
      <div className="disp__inner">
        <header className="disp__head">
          <div className="arch-rule disp__rule">
            <span>01 — En pantalla</span>
            <span aria-hidden="true" className="arch-rule__line" />
            <span className="disp__pixel">
              CH {pad(index + 1)} / {pad(n)}
            </span>
          </div>
          <div className="disp__titlerow">
            <h2 id="display-title" className="arch-title disp__title">
              Now <em>playing</em>
            </h2>
            <p className="disp__note" aria-hidden="true">
              pasá el mouse
              <svg viewBox="0 0 60 40" width="46" height="30">
                <path d="M4 8 C 22 4, 40 12, 50 30" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M42 28 L 51 32 L 53 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </p>
          </div>
        </header>

        <div
          ref={screenRef}
          className="disp__screen"
          onPointerEnter={() => setHovering(true)}
          onPointerLeave={() => setHovering(false)}
        >
          <SplatCanvas
            sources={sources}
            index={index}
            assembleRef={assembleRef}
            className="disp__canvas"
            alt={`${work.client} — ${work.title}`}
          />
          <span aria-hidden="true" className="disp__scan" />
          <span aria-hidden="true" className="disp__vignette" />

          <button
            type="button"
            className="disp__open"
            onClick={() => onOpenWork?.(work)}
            aria-label={`Ver ficha: ${work.client} — ${work.title}`}
          />

          <div className="disp__hud disp__hud--tl" aria-hidden="true">
            <span className="disp__rec">● REC</span>
            <span>CH {pad(index + 1)}</span>
          </div>
          <div className="disp__hud disp__hud--tr" aria-hidden="true">
            <span>{work.kind}</span>
            <span>{work.format}</span>
          </div>
          <div className="disp__hud disp__hud--bl">
            <span className="disp__client">{work.client}</span>
            <span key={work.id} className="disp__worktitle">
              {work.title}
            </span>
          </div>
          <div className="disp__hud disp__hud--br" aria-hidden="true">
            <span>{work.duration}</span>
            <span className="disp__cta">Ver ficha ↗</span>
          </div>
          <span
            key={`${index}-${playing}`}
            aria-hidden="true"
            className={`disp__progress ${playing ? '' : 'is-paused'}`}
            style={{ animationDuration: `${HOLD_MS}ms` }}
          />
        </div>

        <div className="disp__controls">
          <button type="button" className="disp__step" onClick={() => go(index - 1)} aria-label="Canal anterior">
            ◀ CH
          </button>
          <span className="disp__pixel" aria-live="polite">
            {pad(index + 1)} — {work.client}
          </span>
          <button type="button" className="disp__step" onClick={() => go(index + 1)} aria-label="Canal siguiente">
            CH ▶
          </button>
        </div>

        <ol
          className="disp__list"
          onPointerEnter={() => setHovering(true)}
          onPointerLeave={() => {
            window.clearTimeout(hoverTimer.current);
            setHovering(false);
          }}
        >
          {WORKS.map((w, i) => (
            <li key={w.id}>
              <button
                type="button"
                className={`disp__item ${i === index ? 'is-on' : ''}`}
                aria-current={i === index ? 'true' : undefined}
                onPointerEnter={(e) => e.pointerType === 'mouse' && preview(i)}
                onFocus={() => go(i)}
                onClick={() => go(i)}
              >
                <span className="disp__num">{pad(i + 1)}</span>
                <span className="disp__name">
                  <span>{w.client}</span>
                  <span>{w.title}</span>
                </span>
                <span className="disp__kind">{w.kind}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};
