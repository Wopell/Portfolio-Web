/**
 * lib/gsap.ts — single place where GSAP and its plugins are registered.
 * Import { gsap, ScrollTrigger } from here everywhere; never import from
 * 'gsap' directly so registration and defaults stay consistent.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, CustomEase);

/* La misma curva que --arch-ease en CSS: ease-out fuerte para todo lo que entra o sale. */
CustomEase.create('uiOut', '0.23, 1, 0.32, 1');
/* ease-in-out fuerte para lo que se mueve de A a B a la vista (p. ej. volver arriba). */
CustomEase.create('uiInOut', '0.77, 0, 0.175, 1');

gsap.defaults({ ease: 'power3.out', duration: 0.7 });

/** True when the user asked the OS to reduce motion (skip non-essential animation). */
export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Curvas compartidas. `ui` = cubic-bezier(0.23, 1, 0.32, 1), igual que --arch-ease;
 *  `move` = cubic-bezier(0.77, 0, 0.175, 1). */
export const EASE = {
  ui: 'uiOut',
  move: 'uiInOut',
  outSoft: 'power2.out',
  outBack: 'back.out(1.4)',
  settle: 'power4.out',
  snap: 'expo.out',
} as const;

export { gsap, ScrollTrigger };
