import { useEffect, useRef } from "react";

interface ProgressiveMagneticOptions {
  /**
   * Total number of frames in the scrollytelling canvas sequence.
   * @default 100
   */
  totalFrames?: number;
  /**
   * Frame index where progressive magnetic pulling starts (0-indexed).
   * @default 25
   */
  activationFrame?: number;
  /**
   * Target frame index where sequence completes (0-indexed).
   * @default 99
   */
  targetFrame?: number;
  /**
   * Exponent for non-linear ease-in force curve (quadratic / cubic).
   * @default 2.5
   */
  exponent?: number;
  /**
   * Maximum displacement speed added per frame tick (in px).
   * @default 4.5
   */
  maxPullSpeed?: number;
  /**
   * Height multiplier for the scrollytelling section (in vh).
   * @default 4
   */
  scrollytellingRangeVh?: number;
  /**
   * Whether the magnetic scroll attraction is enabled.
   * @default true
   */
  enabled?: boolean;
}

/**
 * Custom hook for real-time progressive magnetic scroll attraction.
 * Applies a non-linear gravity pull towards the target frame between activationFrame (25) and targetFrame (99).
 * Instantly cancels when scrolling up to ensure zero scroll-hijacking.
 */
export function useProgressiveMagneticScroll({
  totalFrames = 100,
  activationFrame = 25,
  targetFrame = 99,
  exponent = 2.5,
  maxPullSpeed = 4.5,
  scrollytellingRangeVh = 4,
  enabled = true,
}: ProgressiveMagneticOptions = {}) {
  const isScrollingDownRef = useRef(false);
  const lastScrollYRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let active = true;

    // Track scroll direction cleanly via window scroll position
    const handleScrollDirection = () => {
      const currentY = window.scrollY;
      if (currentY > lastScrollYRef.current) {
        isScrollingDownRef.current = true;
      } else if (currentY < lastScrollYRef.current) {
        isScrollingDownRef.current = false;
      }
      lastScrollYRef.current = currentY;
    };

    // Immediate wheel direction detector
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY > 0) {
        isScrollingDownRef.current = true;
      } else if (e.deltaY < 0) {
        isScrollingDownRef.current = false;
      }
    };

    // Touch direction detectors for mobile gestures
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        touchStartYRef.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartYRef.current !== null && e.touches.length > 0) {
        const currentY = e.touches[0].clientY;
        // Dragging finger UP (clientY decreases) means scrolling DOWN
        if (touchStartYRef.current > currentY + 2) {
          isScrollingDownRef.current = true;
        } else if (touchStartYRef.current < currentY - 2) {
          isScrollingDownRef.current = false;
        }
      }
    };

    window.addEventListener("scroll", handleScrollDirection, { passive: true });
    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    // Physics Engine Loop (rAF) running continuously in real time
    const physicsTick = () => {
      if (!active) return;

      const currentScrollY = window.scrollY;
      const targetScrollY = window.innerHeight * scrollytellingRangeVh;

      // Rule 1 & 4: Active ONLY within scrollytelling range (0 to 400vh)
      if (currentScrollY > 0 && currentScrollY < targetScrollY) {
        const progress = currentScrollY / targetScrollY;
        const currentFrame = Math.min(totalFrames - 1, Math.floor(progress * totalFrames));

        // Rule 1 & 3: Active ONLY between Frame 25 and Frame 99 AND when scrolling DOWN
        if (currentFrame >= activationFrame && currentFrame < targetFrame && isScrollingDownRef.current) {
          // Rule 2: Non-linear Exponential Force Curve Math
          // t goes from 0.0 (at activationFrame 25) to 1.0 (at targetFrame 99)
          const t = Math.max(0, Math.min(1, (currentFrame - activationFrame) / (targetFrame - activationFrame)));
          
          // Exponential attraction curve: F(t) = t^2.5
          const forceMultiplier = Math.pow(t, exponent);

          // Calculate magnetic pull displacement towards target 400vh (smooth entrance tracking)
          const remainingDistance = targetScrollY - currentScrollY;
          const pullAmount = Math.min(
            remainingDistance * 0.015 * forceMultiplier + (forceMultiplier * maxPullSpeed),
            remainingDistance
          );

          if (pullAmount > 0.05) {
            window.scrollBy({
              top: pullAmount,
              behavior: "instant" as ScrollBehavior,
            });
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(physicsTick);
    };

    animationFrameRef.current = requestAnimationFrame(physicsTick);

    return () => {
      active = false;
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener("scroll", handleScrollDirection);
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [enabled, activationFrame, targetFrame, totalFrames, exponent, maxPullSpeed, scrollytellingRangeVh]);
}
