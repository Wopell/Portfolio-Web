import { motion, useMotionValue, useTransform, useScroll } from "motion/react";
import { useEffect, useState } from "react";
import Scrollytelling from "./Scrollytelling";
import Works from "./Works";

export default function Home() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Parallax transforms for foreground (moves in opposite direction for depth)
  const fgX = useTransform(mouseX, [-0.5, 0.5], ["10px", "-10px"]);
  const fgY = useTransform(mouseY, [-0.5, 0.5], ["10px", "-10px"]);

  // Scroll animations for camera moving forward effect
  const { scrollY } = useScroll();
  const [showOverlay, setShowOverlay] = useState(true);

  // Create a discrete frame index (0 to 99) that matches Scrollytelling.tsx
  const frameIndex = useTransform(scrollY, (y) => {
    const zoomScrollRange = window.innerHeight * 4;
    const progress = Math.max(0, Math.min(1, y / zoomScrollRange));
    return Math.floor(progress * 99);
  });

  // Scale and fade the UI in discrete steps so it stutters synchronously with the images
  const scale = useTransform(frameIndex, [0, 20], [1, 2.5]);
  const scrollOpacity = useTransform(frameIndex, [0, 15], [1, 0]);

  useEffect(() => {
    const handleScroll = () => {
      // Hide overlay after scrolling past 2 viewports
      if (window.scrollY > window.innerHeight * 2) {
        setShowOverlay(false);
      } else {
        setShowOverlay(true);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Normalize values from -0.5 to 0.5
      mouseX.set((e.clientX / window.innerWidth) - 0.5);
      mouseY.set((e.clientY / window.innerHeight) - 0.5);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("mousemove", handleMouseMove);
    
    // Initial check
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [mouseX, mouseY]);

  return (
    <div className="bg-black w-full min-h-screen text-white relative">
      {/* Scrollytelling Canvas Section (500vh scroll container inside) */}
      <Scrollytelling />

      {/* Cinematic Hero UI Overlay */}
      {showOverlay && (
        <motion.div 
          className="fixed inset-0 w-full h-full flex flex-col justify-end p-8 md:p-16 lg:px-24 lg:pb-24 pointer-events-none z-10 origin-center"
          style={{ 
            opacity: scrollOpacity, 
            scale: scale,
          }}
        >
          {/* Grain/Noise Overlay */}
          <div className="noise-overlay" />

          {/* Content */}
          <motion.div 
            className="relative z-10 w-full max-w-4xl pointer-events-auto"
            style={{ x: fgX, y: fgY }}
          >
            <div className="text-reveal mb-6">
              <h1 className="text-[7vw] md:text-[5vw] leading-none select-none tracking-tight inline-flex items-baseline">
                <span className="font-futura font-black uppercase tracking-[-0.05em] text-white">port</span>
                <span className="font-didot font-normal uppercase ml-2.5 text-white/80">folio</span>
              </h1>
            </div>

            <div className="pl-2">
              <div className="text-xs md:text-sm font-sans tracking-wide space-y-0.5 leading-tight">
                <p className="opacity-70">trabajos seleccionados de</p>
                <p className="text-white font-medium uppercase">motion graphics</p>
                <p className="text-white font-medium uppercase">modelado 3D</p>
                <p className="text-white font-medium uppercase">&amp; diseño</p>
              </div>
            </div>
          </motion.div>

          {/* Language Switcher */}
          <div className="absolute bottom-8 right-8 md:bottom-12 md:right-16 z-20 flex gap-2 text-sm md:text-base font-sans tracking-widest uppercase opacity-100">
            <span className="opacity-50">EN</span>
            <span className="opacity-30">-</span>
            <span className="text-white opacity-100 font-medium">ES</span>
          </div>

          {/* Vignette effect */}
          <div className="absolute inset-0 pointer-events-none bg-radial-gradient from-transparent to-black/30" />
        </motion.div>
      )}

      {/* Works Page Content Section */}
      {/* Positioned relatively to start right below the 500vh Scrollytelling canvas */}
      <div className="relative z-20 bg-black">
        <Works />
      </div>
    </div>
  );
}
