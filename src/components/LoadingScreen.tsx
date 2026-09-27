/**
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState, useRef } from "react";

export interface LoadingScreenProps {
  onComplete: () => void;
  key?: string;
}

const words = ["Design", "Create", "Inspire"];

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [wordIndex, setWordIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const onCompleteRef = useRef(onComplete);

  // Update ref when prop changes
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Word cycling logic
  useEffect(() => {
    const wordInterval = setInterval(() => {
      setWordIndex((prev) => {
        if (prev < words.length - 1) return prev + 1;
        clearInterval(wordInterval);
        return prev;
      });
    }, 900);

    return () => clearInterval(wordInterval);
  }, []);

  // Counter logic (2.7s for 0-100)
  useEffect(() => {
    const startTime = performance.now();
    const duration = 2700;

    const updateCounter = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const nextProgress = Math.min((elapsed / duration) * 100, 100);
      
      setProgress(nextProgress);

      if (nextProgress < 100) {
        requestAnimationFrame(updateCounter);
      } else {
        // Progress reached 100
        setTimeout(() => {
          onCompleteRef.current();
        }, 400);
      }
    };

    requestAnimationFrame(updateCounter);
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] bg-[#0a0a0a] flex flex-col overflow-hidden"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Portfolio Label (Top-Left) */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="absolute top-8 left-8 md:top-12 md:left-12"
      >
        <span className="text-xs md:text-sm text-[#888888] uppercase tracking-[0.3em]">
          Portfolio
        </span>
      </motion.div>

      {/* Rotating Words (Center) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.span
            key={wordIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="text-4xl md:text-6xl lg:text-7xl font-display italic text-[#f5f5f5]/80"
          >
            {words[wordIndex]}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Counter (Bottom-Right) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="absolute bottom-8 right-8 md:bottom-12 md:right-12"
      >
        <span className="text-6xl md:text-8xl lg:text-9xl font-display text-[#f5f5f5] tabular-nums">
          {Math.round(progress).toString().padStart(3, '0')}
        </span>
      </motion.div>

      {/* Progress Bar (Bottom Edge) */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#1f1f1f]/50 w-full overflow-hidden">
        <motion.div
          className="h-full origin-left bg-linear-to-r from-[#89AACC] to-[#4E85BF]"
          style={{ 
            scaleX: progress / 100,
            boxShadow: "0 0 8px rgba(137, 170, 204, 0.35)"
          }}
          transition={{ duration: 0.1, ease: "linear" }}
        />
      </div>
    </motion.div>
  );
}
