import { motion, useTransform, useScroll, useSpring, useMotionValueEvent } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Scrollytelling, { INTRO_RANGE_VH } from "./Scrollytelling";
import About from "./About";
import { useProgressiveMagneticScroll } from "../hooks/useProgressiveMagneticScroll";

import { useWorksState } from "../context/WorksStateContext";

/** progreso en el que la pantalla ya es blanco puro y se pasa a /works */
const NAVIGATE_AT = 0.985;

interface HomeProps {
  activeTab?: "works" | "about";
}

export default function Home({ activeTab = "works" }: HomeProps) {
  const navigate = useNavigate();
  const { setIsWorksActive } = useWorksState();
  const isAbout = activeTab === "about";

  // El imán solo asienta el final (desde el 70 %, cuando ya empieza el blanco).
  // Nunca con reduced-motion ni en pantallas táctiles: ahí manda el dedo.
  const [magnetAllowed] = useState(
    () =>
      typeof window !== "undefined" &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
      !window.matchMedia("(pointer: coarse)").matches
  );
  useProgressiveMagneticScroll({
    totalFrames: 100,
    activationFrame: 70,
    targetFrame: 99,
    exponent: 2.0,
    maxPullSpeed: 4.5,
    scrollytellingRangeVh: INTRO_RANGE_VH,
    enabled: !isAbout && magnetAllowed,
  });

  // Raw scroll position from document
  const { scrollY } = useScroll();

  // Scroll source for works mode: feeds raw scrollY ONLY when activeTab is "works", otherwise stays at 0
  const worksScrollY = useTransform(scrollY, (y) => {
    return isAbout ? 0 : y;
  });

  // Apply custom spring physics (damping: 30, stiffness: 160, mass: 0.8) ONLY to works scroll
  const smoothScrollY = useSpring(worksScrollY, {
    damping: 30,
    stiffness: 160,
    mass: 0.8
  });

  // Calculate smooth progress (0.0 to 1.0) over the intro range
  const smoothProgress = useTransform(smoothScrollY, (y) => {
    if (isAbout) return 0;
    const zoomScrollRange = window.innerHeight * INTRO_RANGE_VH;
    return Math.max(0, Math.min(1, y / zoomScrollRange));
  });

  // Hero UI elements stay statically positioned on the white frame at scroll 0
  // and gracefully slide & fade out when the white stepped mask expands & contracts to 0 (or scroll up with document in About mode)
  const heroOpacity = useTransform(smoothProgress, (p) => {
    if (isAbout) return 1;
    if (p <= 0.05) return 1;
    if (p >= 0.16) return 0;
    return 1 - (p - 0.05) / 0.11;
  });

  const heroY = useTransform(scrollY, (y) => {
    if (isAbout) return -y;
    return 0;
  });

  const [showOverlay, setShowOverlay] = useState(true);

  // Sync spring physics and state when activeTab changes
  useEffect(() => {
    if (isAbout) {
      smoothScrollY.jump(0);
    } else {
      smoothScrollY.jump(window.scrollY);
    }
  }, [activeTab, isAbout, smoothScrollY]);

  // Cuando la pantalla ya es blanco puro, pasa a /works UNA sola vez
  // (antes navegaba en cada tick del spring y llenaba el historial).
  // `armed`: solo navega si en esta visita el scroll pasó por la primera mitad
  // (al volver con Atrás no se dispara solo por una posición restaurada).
  const navigatedRef = useRef(false);
  const armedRef = useRef(false);
  useMotionValueEvent(smoothProgress, "change", (latestProgress) => {
    if (latestProgress < 0.5) armedRef.current = true;
    if (!isAbout && armedRef.current && !navigatedRef.current && latestProgress >= NAVIGATE_AT) {
      navigatedRef.current = true;
      setIsWorksActive(true);
      navigate("/works");
    }
  });

  useEffect(() => {
    const handleScroll = () => {
      // Hide overlay after scrolling past 2 viewports
      if (window.scrollY > window.innerHeight * 2) {
        setShowOverlay(false);
      } else {
        setShowOverlay(true);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className={`w-full min-h-screen relative ${isAbout ? 'bg-[#e8e9eb] text-black' : 'bg-black text-white'}`}>
      {/* Scrollytelling Canvas Section with Spring Physics and Dynamic Stepped Rounded Mask */}
      <Scrollytelling 
        scrollY={scrollY}
        smoothScrollY={smoothScrollY} 
        smoothProgress={smoothProgress} 
        isZoomDisabled={isAbout}
      />

      {/* Hero UI Overlay: Enmasked literally by the shrinking white frame mask as it contracts */}
      {showOverlay && (
        <motion.div 
          className="fixed top-0 left-0 w-full h-screen pointer-events-none z-20"
          style={{ 
            clipPath: "url(#hero-text-cutout-mask)",
            opacity: heroOpacity,
            y: heroY,
          }}
        >
          {/* Hero Content vertically and horizontally centered inside the bottom-left white cutout square */}
          {/* la caja sigue al recorte de la máscara: mobile 4–70 % × 72–94 %, desktop 5–26,5 % × 68–89 % */}
          <div className="absolute top-[72vh] bottom-[6vh] left-[4vw] w-[64vw] md:top-[68vh] md:bottom-[11vh] md:left-[5vw] md:w-[21vw] flex flex-col justify-center z-30 pointer-events-auto">
            {/* misma voz que «MY WORKS» del otro lado del blanco */}
            <h1
              className="text-[12vw] md:text-[3.9vw] leading-[0.85] select-none uppercase text-zinc-950"
              style={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400, letterSpacing: '0.01em' }}
            >
              Portfolio
            </h1>
            <div className="mt-3 font-sans text-zinc-950">
              <p className="text-base font-semibold leading-snug">Tomy Powell</p>
              <p className="text-sm font-medium leading-snug text-zinc-700">Animation · 3D Art · IA · Post Production</p>
              <p className="mt-3 text-[0.875rem] font-semibold uppercase tracking-[0.08em] text-zinc-600" aria-hidden="true">
                Deslizá ↓
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Mode "about": Render About section directly below landing frame */}
      {isAbout && (
        <div className="relative z-20 bg-[#e8e9eb] text-black min-h-screen">
          <About />
        </div>
      )}
    </div>
  );
}
