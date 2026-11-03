import React, { useLayoutEffect, useRef } from 'react';
import { gsap, prefersReducedMotion } from '../../lib/gsap';

/**
 * =========================================================================
 * INK PARTICLES — paper cut-out glyphs drifting just above the page
 * (per senal_Particles_1920px.png and the agreed particle spec).
 * =========================================================================
 * The illusion = two DECOUPLED clocks per particle:
 *
 *   1. SMOOTH CLOCK (60 fps, single gsap.ticker)
 *      Each particle chases a slowly wandering target with a below-damped
 *      chase: `c += (target - c) * ease` (ease 0.05-0.09). Motion always
 *      lags its target, so a glyph coasts like a bit of paper in a draft —
 *      never linear, never snapping. The cursor feeds this clock: near the
 *      pointer the target is pushed out with a r^1.5 falloff (≤46 px) and
 *      the glyph fades with proximity, so the cursor blows dust off the
 *      page. Displacement fades are themselves eased (16%/frame).
 *
 *   2. STEPPED CLOCK (the paper texture, stepped not interpolated)
 *      On each particle's own stepDuration (2.0-2.6 s, seeded so no two
 *      particles share a period — non-harmonic) the cut-out FLIPS its
 *      mirror (scaleX ±1) and snaps a new microRotation (±2.3°). Steps are
 *      instant: that discontinuity is what makes it read as paper-config
 *      changes, an toy flip-book, not a tween.
 *
 *   Desync: noiseOffset shifts the wander phase (up to ±500 "seconds");
 *   phaseDelay staggers the first flip so the field starts scattered.
 *
 *   Rendering:
 *    - 70 deterministic DOM spans (seeded rnd), one transform write each
 *      per frame, ZERO layout reads per frame (bases + field rect are
 *      cached on mount / scroll / resize).
 *    - Ink #191510 on cream: mix-blend multiply, opacity 0.2-0.4. (On a
 *      dark surface the same system would swap to `screen` at 0.3-0.5.)
 *    - feTurbulence paper-grain overlay photosteps its background-position
 *      on a 160-210 ms ladder, hiding DOM regularity.
 * =========================================================================
 */

const INK = '#191510';
const REPEL_RADIUS = 110; // px — cursor reach
const REPEL_PUSH = 46; // px — max push at zero distance

/** hand-cut glyph paths matching the reference's typed marks */
const AST6 = 'M12 2.5v19M4.4 7l15.2 10M19.6 7L4.4 17'; // six-arm asterisk ✳
const PLUS = 'M12 4v16M4 12h16'; // bold registration plus +
const CROSS = 'M5 5l14 14M19 5L5 19'; // ×
const DOT = 'M12 9.4a2.6 2.6 0 1 0 .001 0Z'; // · (stroke-drawn, reads as a dot)
const GLYPHS = [AST6, PLUS, CROSS, DOT] as const;

/** deterministic pseudo-random in [0,1) — layout is stable across reloads */
const rnd = (i: number, salt: number) => {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

interface PaperParticle {
  el: HTMLDivElement;
  /** base anchor, cached in px (offsetLeft/Top — refreshed on resize) */
  baseX: number; baseY: number;
  /** SMOOTH CLOCK state (px offsets around the base) */
  cx: number; cy: number; // current
  tx: number; ty: number; // target
  ease: number; // 0.05-0.09 chase factor
  ampX: number; ampY: number; // wander amplitude (px)
  omX: number; omY: number; // wander angular velocity (rad/s)
  phX: number; phY: number; // wander phase (rad)
  /** cursor field */
  fade: number; // 1 = full ink; eased toward 0.25-0.8 near the pointer
  /** STEPPED CLOCK state */
  noiseOffset: number; // s — wander phase offset (desync)
  phaseDelay: number; // s — negative delay before the first flip
  lastStep: number; // s timestamp domain of the last flip
  stepDuration: number; // s — 2.0-2.6, seeded non-harmonic
  stepIndex: number; // counts flips (seeds the next microRotation)
  flipState: 1 | -1; // mirror of the cut-out
  microAngle: number; // deg snapped at each step
}

/** feTurbulence paper grain, baked into an SVG data URI */
const GRAIN_URI =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'>" +
  "<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/>" +
  "<feColorMatrix type='saturate' values='0'/></filter>" +
  "<rect width='220' height='220' filter='url(%23n)' opacity='0.55'/></svg>";

const GRAIN_SHIFTS = ['0px 0px', '-2px 3px', '3px -1px', '-1px -2px', '2px 2px', '-3px 1px'];

export const InkParticles: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return; // reduced motion: static field, no ticker
    const field = ref.current;
    if (!field) return;

    const nodes = gsap.utils.toArray<HTMLDivElement>('[data-ink]', field);
    if (!nodes.length) return;

    /* cursor field (shared, page-wide) */
    const mouse = { x: -99999, y: -99999 };

    /* ── particle table (deterministic, fully typed) ───────────────────── */
    const parts: PaperParticle[] = nodes.map((el, i) => {
      const p: PaperParticle = {
        el,
        baseX: 0, baseY: 0,
        cx: 0, cy: 0, tx: 0, ty: 0,
        ease: 0.05 + rnd(i, 20) * 0.04,
        ampX: 5 + rnd(i, 21) * 9,
        ampY: 6 + rnd(i, 22) * 10,
        omX: (0.10 + rnd(i, 23) * 0.16) * (rnd(i, 24) > 0.5 ? 1 : -1),
        omY: (0.08 + rnd(i, 25) * 0.14) * (rnd(i, 26) > 0.5 ? 1 : -1),
        phX: rnd(i, 27) * Math.PI * 2,
        phY: rnd(i, 28) * Math.PI * 2,
        fade: 1,
        noiseOffset: -rnd(i, 29) * 500,
        phaseDelay: -rnd(i, 30) * 4,
        lastStep: 0,
        stepDuration: 2.0 + rnd(i, 31) * 0.6,
        stepIndex: 0,
        flipState: rnd(i, 32) > 0.5 ? 1 : -1,
        microAngle: 0,
      };
      p.tx = Math.sin(p.phX) * p.ampX;
      p.ty = Math.cos(p.phY) * p.ampY;
      p.cx = p.tx; p.cy = p.ty; // start already in-flight, no snap-in
      return p;
    });

    /* geometry cache — the only layout reads happen here (mount/scroll) */
    let fieldRect = { left: 0, right: 0, top: 0, bottom: 0 };
    let vw = window.innerWidth; let vh = window.innerHeight;
    const measure = () => {
      const r = field.getBoundingClientRect();
      fieldRect = { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
      vw = window.innerWidth; vh = window.innerHeight;
      for (const p of parts) {
        p.baseX = p.el.offsetLeft; // % anchors → px
        p.baseY = p.el.offsetTop;
      }
    };
    measure();

    const onScroll = () => {
      const r = field.getBoundingClientRect();
      fieldRect = { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
    };
    const onResize = () => { measure(); };
    const onMove = (e: PointerEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const onOut = () => { mouse.x = -99999; mouse.y = -99999; };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onOut);

    /* ── the two clocks → one rAF (gsap.ticker; lagSmoothing keeps the
          chase stable after tab switches) ───────────────────────────────── */
    let grainSlot = 0;
    let grainNext = 0;
    const grain = field.querySelector<HTMLElement>('[data-grain]');

    const tick = () => {
      if (document.hidden) return;
      if (fieldRect.bottom < 0 || fieldRect.top > vh) return; // offscreen

      const t = performance.now() / 1000;

      for (let pi = 0; pi < parts.length; pi++) {
        const p = parts[pi];
        /* smooth clock — wander target orbits the base anchor */
        const it = t + p.noiseOffset;
        p.tx = Math.sin(it * p.omX + p.phX) * p.ampX;
        p.ty = Math.cos(it * p.omY + p.phY) * p.ampY;

        /* cursor — push the target away, fade with proximity */
        const gpX = fieldRect.left + p.baseX + p.cx;
        const gpY = fieldRect.top + p.baseY + p.cy;
        const ddx = gpX - mouse.x;
        const ddy = gpY - mouse.y;
        const dist = Math.hypot(ddx, ddy);
        if (dist < REPEL_RADIUS) {
          const f = Math.pow(1 - dist / REPEL_RADIUS, 1.5);
          p.tx += (ddx / (dist || 1)) * f * REPEL_PUSH;
          p.ty += (ddy / (dist || 1)) * f * REPEL_PUSH;
          p.fade += (0.25 + f * 0.55 - p.fade) * 0.16;
        } else {
          p.fade += (1 - p.fade) * 0.07;
        }

        /* under-damped chase (the coasting feel) */
        p.cx += (p.tx - p.cx) * p.ease;
        p.cy += (p.ty - p.cy) * p.ease;

        /* stepped clock — instant flips on the particle's own period */
        if (t + p.noiseOffset + p.phaseDelay - p.lastStep >= p.stepDuration) {
          p.stepIndex++;
          p.microAngle = (rnd(p.stepIndex * 13 + pi * 7, 3) - 0.5) * 4.6; // ±2.3°
          p.flipState = p.flipState === 1 ? -1 : 1;
          p.phaseDelay = 0;
          p.lastStep = t + p.noiseOffset;
        }

        /* single style write */
        p.el.style.transform =
          `translate3d(${p.cx.toFixed(2)}px, ${p.cy.toFixed(2)}px, 0)` +
          ` rotate(${p.microAngle.toFixed(2)}deg) scaleX(${p.flipState})`;
        p.el.style.opacity = (0.2 + 0.2 * p.fade).toFixed(3);
      }

      /* grain photosteps on its own 160-210 ms ladder */
      if (t >= grainNext) {
        grainNext = t + 0.16 + (grainSlot % 3) * 0.05;
        grainSlot++;
        grain?.style.setProperty('background-position', GRAIN_SHIFTS[grainSlot % GRAIN_SHIFTS.length]);
      }
    };
    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onOut);
    };
  }, []);

  return (
    <div ref={ref} className="ink-particles absolute inset-0 pointer-events-none" aria-hidden="true">
      {/* photostepped paper grain */}
      <span
        data-grain
        className="absolute -inset-6 mix-blend-multiply pointer-events-none"
        style={{
          backgroundImage: `url("${GRAIN_URI}")`,
          backgroundSize: '220px 220px',
          opacity: 0.05,
        }}
      />
      {Array.from({ length: 70 }, (_, i) => {
        const kind = Math.floor(Math.abs(Math.sin(i * 127.1) * 4)) % GLYPHS.length;
        const size = 11 + rnd(i, 8) * 18;
        const x = 1 + rnd(i, 9) * 97;
        const y = 2 + rnd(i, 10) * 96;
        const baseRot = rnd(i, 11) * 70 - 35;
        const isDot = kind === 3;
        return (
          <div
            key={i}
            data-ink
            className="absolute will-change-transform mix-blend-multiply"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              transform: `rotate(${baseRot.toFixed(1)}deg)`,
              opacity: 0.3 + rnd(i, 12) * 0.2,
            }}
          >
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
              {isDot ? (
                <path d={DOT} stroke={INK} strokeWidth="4.4" strokeLinecap="round" />
              ) : (
                <path d={GLYPHS[kind]} stroke={INK} strokeWidth={kind === 1 ? 2.2 : 1.4} strokeLinecap="round" />
              )}
            </svg>
          </div>
        );
      })}
    </div>
  );
};
