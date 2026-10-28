/**
 * lib/gsap.ts — single place where GSAP and its plugins are registered.
 * Import { gsap, ScrollTrigger } from here everywhere; never import from
 * 'gsap' directly so registration and defaults stay consistent.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

gsap.defaults({ ease: 'power3.out', duration: 0.7 });

/** True when the user asked the OS to reduce motion (skip non-essential animation). */
export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Shared easings for the paper/office aesthetic. */
export const EASE = {
  outSoft: 'power2.out',
  outBack: 'back.out(1.4)',
  settle: 'power4.out',
  snap: 'expo.out',
} as const;

export { gsap, ScrollTrigger };
