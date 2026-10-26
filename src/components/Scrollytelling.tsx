import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { MotionValue, useMotionValueEvent, useTransform, motion } from "motion/react";

gsap.registerPlugin(ScrollToPlugin);

const ZOOM_FACTOR = 1.0; // Set to 1.0 to show 100% of the image

// --- CONFIGURATION ---
const CONFIG = {
  FOLDER_NAME: "scroll", // The name of the folder inside public/
  TOTAL_FRAMES: 100,   // Total number of images
  EXTENSION: "webp",   // File extension
  getFileName: (index: number) => {
    const paddedIndex = index.toString().padStart(4, "0");
    return `${paddedIndex} copia.${CONFIG.EXTENSION}`;
  }
};

interface ScrollytellingProps {
  scrollY: MotionValue<number>;
  smoothScrollY: MotionValue<number>;
  smoothProgress: MotionValue<number>;
  isZoomDisabled?: boolean;
}

// Generates the SVG path for the stepped polygon mask with vertical step X edge shifted left (26.5%) per red line in reference
function getSteppedMaskPath(p: number, isMobile: boolean) {
  const t_progress = Math.max(0, Math.min(1, p / 0.22));
  const lerp = (start: number, end: number) => start + (end - start) * t_progress;

  const aspect = typeof window !== "undefined" && window.innerHeight > 0 ? window.innerWidth / window.innerHeight : 16 / 9;

  const t = lerp(isMobile ? 0.06 : 0.11, 0.0);   // Top border (11%)
  const l = lerp(isMobile ? 0.04 : 0.05, 0.0);   // Left inset (5%)
  const r = lerp(isMobile ? 0.96 : 0.95, 1.0);   // Right inset (5%)
  const b = lerp(isMobile ? 0.94 : 0.89, 1.0);   // Bottom border (11%)
  const sx = lerp(isMobile ? 0.46 : 0.265, 0.0); // Step X position shifted left to 26.5% (Matching user's red line)
  const sy = lerp(isMobile ? 0.72 : 0.68, 1.0);  // Step Y height position

  const ky = lerp(isMobile ? 0.024 : 0.026, 0.0); // Vertical radius (percentage of screen height)
  const kx = ky / aspect;                          // Aspect-ratio corrected horizontal radius for perfect 1:1 circle

  return `
    M ${(l + kx).toFixed(5)},${t.toFixed(5)}
    L ${(r - kx).toFixed(5)},${t.toFixed(5)}
    Q ${r.toFixed(5)},${t.toFixed(5)} ${r.toFixed(5)},${(t + ky).toFixed(5)}
    L ${r.toFixed(5)},${(b - ky).toFixed(5)}
    Q ${r.toFixed(5)},${b.toFixed(5)} ${(r - kx).toFixed(5)},${b.toFixed(5)}
    L ${(sx + kx).toFixed(5)},${b.toFixed(5)}
    Q ${sx.toFixed(5)},${b.toFixed(5)} ${sx.toFixed(5)},${(b - ky).toFixed(5)}
    L ${sx.toFixed(5)},${(sy + ky).toFixed(5)}
    Q ${sx.toFixed(5)},${sy.toFixed(5)} ${(sx - kx).toFixed(5)},${sy.toFixed(5)}
    L ${(l + kx).toFixed(5)},${sy.toFixed(5)}
    Q ${l.toFixed(5)},${sy.toFixed(5)} ${l.toFixed(5)},${(sy - ky).toFixed(5)}
    L ${l.toFixed(5)},${(t + ky).toFixed(5)}
    Q ${l.toFixed(5)},${t.toFixed(5)} ${(l + kx).toFixed(5)},${t.toFixed(5)}
    Z
  `.replace(/\s+/g, " ").trim();
}

// Generates the SVG path for the bottom-left cutout rectangle that contains the hero text
function getHeroTextMaskPath(p: number, isMobile: boolean) {
  const t_progress = Math.max(0, Math.min(1, p / 0.22));
  const lerp = (start: number, end: number) => start + (end - start) * t_progress;

  const aspect = typeof window !== "undefined" && window.innerHeight > 0 ? window.innerWidth / window.innerHeight : 16 / 9;

  const l = lerp(isMobile ? 0.04 : 0.05, 0.0);   // Left inset
  const b = lerp(isMobile ? 0.94 : 0.89, 1.0);   // Bottom border
  const sx = lerp(isMobile ? 0.46 : 0.265, 0.0); // Step X position
  const sy = lerp(isMobile ? 0.72 : 0.68, 1.0);  // Step Y height position

  const ky = lerp(isMobile ? 0.024 : 0.026, 0.0); // Vertical radius
  const kx = ky / aspect;                          // Horizontal radius

  return `
    M ${(l + kx).toFixed(5)},${sy.toFixed(5)}
    L ${(sx - kx).toFixed(5)},${sy.toFixed(5)}
    Q ${sx.toFixed(5)},${sy.toFixed(5)} ${sx.toFixed(5)},${(sy + ky).toFixed(5)}
    L ${sx.toFixed(5)},${(b - ky).toFixed(5)}
    Q ${sx.toFixed(5)},${b.toFixed(5)} ${(sx - kx).toFixed(5)},${b.toFixed(5)}
    L ${(l + kx).toFixed(5)},${b.toFixed(5)}
    Q ${l.toFixed(5)},${b.toFixed(5)} ${l.toFixed(5)},${(b - ky).toFixed(5)}
    L ${l.toFixed(5)},${(sy + ky).toFixed(5)}
    Q ${l.toFixed(5)},${sy.toFixed(5)} ${(l + kx).toFixed(5)},${sy.toFixed(5)}
    Z
  `.replace(/\s+/g, " ").trim();
}

// Module-level persistent frame cache across component lifecycles
let globalFramesCache: (HTMLImageElement | ImageBitmap)[] | null = null;

export default function Scrollytelling({ scrollY, smoothScrollY, smoothProgress, isZoomDisabled = false }: ScrollytellingProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const parallaxWrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const vignetteRef = useRef<HTMLDivElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const maskPathRef = useRef<SVGPathElement>(null);
  const heroTextMaskRef = useRef<SVGPathElement>(null);

  // Ref to persist the last known mouse position across mousemove, scroll, and render updates
  const mousePosRef = useRef<{ x: number; y: number } | null>(null);

  const [loadedPercentage, setLoadedPercentage] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Light white frame background opacity (fades out as frame stroke shrinks to 0)
  const frameOpacity = useTransform(smoothProgress, [0.18, 0.25], [1, 0]);

  // Translate outer frame background up along with document scroll when in About mode
  const frameY = useTransform(scrollY, (y) => (isZoomDisabled ? -y : 0));

  // Ref to track last rendered frame index to prevent duplicate canvas draws
  const lastRenderedFrameRef = useRef<number>(-1);

  // Store pre-rendered images
  const framesRef = useRef<(ImageBitmap | HTMLImageElement)[]>([]);

  // Preload and decode images
  useEffect(() => {
    if (globalFramesCache && globalFramesCache.length === CONFIG.TOTAL_FRAMES) {
      framesRef.current = globalFramesCache;
      setLoadedPercentage(100);
      setIsLoaded(true);
      return;
    }

    let loadedCount = 0;
    const frames: HTMLImageElement[] = [];

    const onFrameLoad = () => {
      loadedCount++;
      setLoadedPercentage(Math.floor((loadedCount / CONFIG.TOTAL_FRAMES) * 100));
      if (loadedCount === CONFIG.TOTAL_FRAMES) {
        globalFramesCache = frames;
        framesRef.current = frames;
        setIsLoaded(true);
      }
    };

    for (let i = 1; i <= CONFIG.TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = encodeURI(`/${CONFIG.FOLDER_NAME}/${CONFIG.getFileName(i)}`);
      
      img.decode()
        .then(() => {
          frames[i - 1] = img;
          onFrameLoad();
        })
        .catch((e) => {
          console.error(`Error loading frame ${i}:`, e);
          frames[i - 1] = img;
          onFrameLoad();
        });
    }
  }, []);

  // Draw frame function with object-fit: cover scaling
  const drawFrame = (index: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false }); 
    if (!ctx) return;

    const texture = framesRef.current[index];
    if (!texture) return; 

    // Match canvas to window size
    if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
       canvas.width = window.innerWidth;
       canvas.height = window.innerHeight;
    }

    const scale = Math.max(canvas.width / texture.width, canvas.height / texture.height) * ZOOM_FACTOR;
    const scaledWidth = texture.width * scale;
    const scaledHeight = texture.height * scale;
    const offsetX = (canvas.width - scaledWidth) / 2;
    const offsetY = (canvas.height - scaledHeight) / 2;

    ctx.drawImage(texture, offsetX, offsetY, scaledWidth, scaledHeight);
  };

  // Helper function to update canvas, SVG mask, and vignette state based on spring values
  const updateRenderState = (latestScrollY: number, latestProgress: number) => {
    if (!isLoaded) return;

    const totalFrames = CONFIG.TOTAL_FRAMES;
    const rawFrame = latestProgress * (totalFrames - 1);
    const currentFrame = Math.min(
      totalFrames - 1, 
      Math.max(0, Math.floor(rawFrame))
    );
    
    // Fractional progress between current frame and next frame (0.0 to 1.0)
    const frameFraction = rawFrame - currentFrame;

    // Show scroll to top button only after 4.5 * viewport height
    setShowScrollButton(latestScrollY > window.innerHeight * 4.5);

    // Only draw to canvas when the discrete frame index changes
    if (currentFrame !== lastRenderedFrameRef.current) {
      lastRenderedFrameRef.current = currentFrame;
      drawFrame(currentFrame);
    }

    // Update SVG mask path in real time via DOM attribute (hardware-accelerated GPU 60fps+)
    if (maskPathRef.current) {
      maskPathRef.current.setAttribute("d", getSteppedMaskPath(latestProgress, isMobile));
    }
    if (heroTextMaskRef.current) {
      heroTextMaskRef.current.setAttribute("d", getHeroTextMaskPath(latestProgress, isMobile));
    }

    // Continuous digital zoom: combines progressive base zoom + sub-frame micro zoom to smooth out low frame-rate jumps
    const vh = window.innerHeight;
    const baseScale = 1.0 + (latestProgress * 0.32);
    const microZoom = (frameFraction / totalFrames) * 0.50;
    const virtualScale = baseScale + microZoom;

    let opacity = 1;
    let display = "block";

    // Smooth fade out between 3.8vh and 4.0vh as Works section enters (in Works mode only)
    if (!isZoomDisabled && latestScrollY > vh * 3.8) {
      const fadeFraction = (latestScrollY - vh * 3.8) / (vh * 0.2);
      opacity = Math.max(0, 1 - fadeFraction);
    }
    if (!isZoomDisabled && latestScrollY >= vh * 4) {
      display = "none";
    }

    if (canvasRef.current) {
      canvasRef.current.style.transform = `scale(${virtualScale.toFixed(5)})`;
    }

    if (canvasWrapperRef.current) {
      canvasWrapperRef.current.style.opacity = opacity.toString();
      canvasWrapperRef.current.style.display = display;
      if (isZoomDisabled) {
        canvasWrapperRef.current.style.transform = `translate3d(0, -${latestScrollY}px, 0)`;
      } else {
        canvasWrapperRef.current.style.transform = "none";
      }
    }
  };

  // Draw frame 0 when assets finish loading or when zoom mode changes
  useEffect(() => {
    if (isLoaded) {
      if (isZoomDisabled) {
        lastRenderedFrameRef.current = -1;
        updateRenderState(scrollY.get(), 0);
      } else {
        lastRenderedFrameRef.current = -1;
        drawFrame(0);
        updateRenderState(0, 0);
      }
    }
  }, [isLoaded, isZoomDisabled]);

  // Subscribe to raw scrollY updates when in About mode to translate canvas wrapper up
  useMotionValueEvent(scrollY, "change", (latestScrollY) => {
    if (isZoomDisabled) {
      updateRenderState(latestScrollY, 0);
    }
  });

  // Subscribe to spring motion value updates for smooth 60fps+ rendering with inertia in Works mode
  useMotionValueEvent(smoothScrollY, "change", (latestScrollY) => {
    if (!isZoomDisabled) {
      updateRenderState(latestScrollY, smoothProgress.get());
    }
  });

  // Handle window resizes
  useEffect(() => {
    const handleResize = () => {
      if (isLoaded) {
        lastRenderedFrameRef.current = -1; // Force redraw on resize
        updateRenderState(smoothScrollY.get(), smoothProgress.get());
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isLoaded, smoothScrollY, smoothProgress]);

  // Persistent mouse parallax function anchored to last known mouse position
  const updateParallax = () => {
    if (!parallaxWrapperRef.current) return;

    const mouseX = mousePosRef.current ? mousePosRef.current.x : window.innerWidth / 2;
    const mouseY = mousePosRef.current ? mousePosRef.current.y : window.innerHeight / 2;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    const moveX = (mouseX - centerX) / centerX;
    const moveY = (mouseY - centerY) / centerY;

    gsap.to(parallaxWrapperRef.current, {
      x: -moveX * 18,
      y: -moveY * 18,
      scale: 1.05,
      duration: 0.8,
      ease: "power2.out",
      overwrite: "auto",
    });
  };

  // Mouse move and scroll listener to lock parallax to last mouse coordinates
  useEffect(() => {
    if (!isLoaded) return;

    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };
      updateParallax();
    };

    const handleScroll = () => {
      if (mousePosRef.current) {
        updateParallax();
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isLoaded]);

  const handleScrollToTop = () => {
    gsap.to(window, { scrollTo: 0, duration: 1.5, ease: "power3.inOut" });
  };

  return (
    <div 
      ref={containerRef} 
      className={`w-full ${isZoomDisabled ? "relative bg-[#e8e9eb]" : "bg-black"}`} 
      style={{ height: isZoomDisabled ? "100vh" : "500vh" }}
    >
      {/* SVG ClipPath Definition for the Stepped Rounded Mask & Hero Text Cutout Mask */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <clipPath id="stepped-hero-mask" clipPathUnits="objectBoundingBox">
            <path ref={maskPathRef} d={getSteppedMaskPath(0, isMobile)} />
          </clipPath>
          <clipPath id="hero-text-cutout-mask" clipPathUnits="objectBoundingBox">
            <path ref={heroTextMaskRef} d={getHeroTextMaskPath(0, isMobile)} />
          </clipPath>
        </defs>
      </svg>

      {/* Loading Overlay */}
      {!isLoaded && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-white">
          <div className="text-4xl font-light mb-4 text-white/80">Loading Assets</div>
          <div className="text-8xl font-bold font-display tabular-nums">
            {loadedPercentage.toString().padStart(3, "0")}%
          </div>
          <div className="w-64 h-1 bg-white/20 mt-8 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-300 ease-out" 
              style={{ width: `${loadedPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Light White Outer Frame Background */}
      <motion.div 
        className="fixed top-0 left-0 w-full h-screen pointer-events-none z-0 bg-[#e8e9eb]"
        style={{ opacity: frameOpacity, y: frameY }}
      />

      {/* Canvas Wrapper clipped with the stepped rounded SVG mask */}
      <motion.div
        ref={canvasWrapperRef}
        className="fixed top-0 left-0 w-full h-screen pointer-events-none z-10 overflow-hidden"
        style={{ clipPath: "url(#stepped-hero-mask)" }}
      >
        {/* Dedicated Mouse Parallax Container (Independent of Canvas Scroll Zoom) */}
        <div ref={parallaxWrapperRef} className="w-full h-full scale-105 origin-center pointer-events-none">
          {/* Canvas */}
          <canvas
            ref={canvasRef}
            className="w-full h-full object-cover origin-center pointer-events-none"
            style={{ opacity: isLoaded ? 1 : 0, transition: "opacity 1s ease-in-out" }}
          />
        </div>

        {/* Cinematic Vignette / Border Fade */}
        <div 
          ref={vignetteRef}
          className="absolute inset-0 pointer-events-none"
          style={{ 
            opacity: isLoaded ? 1 : 0, 
            transition: "opacity 1s ease-in-out",
            boxShadow: "inset 0 0 150px 80px rgba(0,0,0,1)",
            background: "radial-gradient(circle, transparent 60%, rgba(0,0,0,0.6) 100%)"
          }}
        />
      </motion.div>

      {/* Scroll to top button */}
      <button
        onClick={handleScrollToTop}
        className={`fixed bottom-8 right-8 z-40 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md rounded-full w-12 h-12 flex items-center justify-center transition-all duration-300 shadow-lg border border-white/10 cursor-pointer ${showScrollButton ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}
        aria-label="Scroll to Top"
        style={{ display: isLoaded ? "flex" : "none" }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m18 15-6-6-6 6"/>
        </svg>
      </button>
    </div>
  );
}
