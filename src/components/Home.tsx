import { motion, useTransform, useScroll, useSpring, useMotionValueEvent } from "motion/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Scrollytelling from "./Scrollytelling";
import About from "./About";
import { useProgressiveMagneticScroll } from "../hooks/useProgressiveMagneticScroll";

import { useWorksState } from "../context/WorksStateContext";

interface HomeProps {
  activeTab?: "works" | "about";
}

export default function Home({ activeTab = "works" }: HomeProps) {
  const navigate = useNavigate();
  const { setIsWorksActive } = useWorksState();
  const isAbout = activeTab === "about";

  // Activate Progressive Real-Time Magnetic Gravity Pull ONLY in "works" mode
  useProgressiveMagneticScroll({
    totalFrames: 100,
    activationFrame: 2,
    targetFrame: 99,
    exponent: 2.0,
    maxPullSpeed: 4.5,
    scrollytellingRangeVh: 4,
    enabled: !isAbout,
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

  // Calculate smooth progress (0.0 to 1.0) over the 400vh active zoom range
  const smoothProgress = useTransform(smoothScrollY, (y) => {
    if (isAbout) return 0;
    const zoomScrollRange = window.innerHeight * 4;
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

  // Monitor progress when in landing mode: when smoothProgress hits 0.99 (reaching frame 99), activate works state and navigate!
  useMotionValueEvent(smoothProgress, "change", (latestProgress) => {
    if (!isAbout && latestProgress >= 0.99) {
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
          <div className="absolute top-[68vh] bottom-[11vh] left-[4vw] md:left-[5vw] w-[21vw] md:w-[21vw] flex flex-col justify-center z-30 pointer-events-auto">
            <div className="text-reveal mb-2">
              <h1 className="text-[5.8vw] md:text-[4vw] lg:text-[3.4vw] leading-[0.85] select-none tracking-tight inline-flex items-baseline text-zinc-950 font-black">
                <span className="font-futura uppercase tracking-[-0.04em]">port</span>
                <span className="font-serif font-normal uppercase ml-1.5 text-zinc-900">folio</span>
              </h1>
            </div>

            <div className="pl-0.5">
              <div className="text-[10px] md:text-[11px] lg:text-xs font-sans tracking-wide space-y-0.5 leading-tight text-zinc-800 font-semibold">
                <p className="opacity-70 font-normal">trabajos seleccionados de</p>
                <p className="uppercase tracking-wider">ANIMATION</p>
                <p className="uppercase tracking-wider">3D ART</p>
                <p className="uppercase tracking-wider">IA &amp; POST PRODUCTION</p>
              </div>
            </div>
          </div>

          {/* Language Switcher anchored in the bottom white strip, aligned with the right mask edge */}
          <div className="absolute top-[89vh] bottom-0 right-[4vw] md:right-[5vw] flex items-center gap-2 z-40 text-xs md:text-sm font-sans tracking-widest uppercase font-bold text-zinc-900 pointer-events-auto">
            <span className="opacity-50">EN</span>
            <span className="opacity-30">-</span>
            <span className="opacity-100">ES</span>
          </div>

          {/* Vignette effect */}
          <div className="absolute inset-0 pointer-events-none bg-radial-gradient from-transparent to-black/20" />
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
