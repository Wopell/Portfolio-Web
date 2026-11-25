import React, { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "../lib/gsap";
import { MotionValue, useMotionValueEvent, useTransform, motion } from "motion/react";


const ZOOM_FACTOR = 1.0; // Set to 1.0 to show 100% of the image

// --- CONFIGURATION ---
const CONFIG = {
  FOLDER_NAME: "scroll", // The name of the folder inside public/
  // La cámara entra en la barra blanca de censura hasta llenar la pantalla en el
  // fotograma ~54; los siguientes (niebla gris → negro) ya no se usan ni se cargan.
  TOTAL_FRAMES: 54,
  EXTENSION: "webp",   // File extension
  getFileName: (index: number) => {
    const paddedIndex = index.toString().padStart(4, "0");
    return `${paddedIndex} copia.${CONFIG.EXTENSION}`;
  }
};

/** recorrido de la intro en alturas de pantalla (antes 4) */
export const INTRO_RANGE_VH = 2.6;
/** progreso en el que se llega al último fotograma */
const FRAMES_END_P = 0.9;
/** resplandor blanco: nace en la barra de censura y cubre la pantalla */
const BLOOM_START_P = 0.6;
const BLOOM_END_P = 0.95;
/** centro de la barra en coordenadas del fotograma (fotogramas 40–54) */
const BAR_CENTER = { x: 0.44, y: 0.35 };
/** reduced-motion: tramo del scroll en el que el blanco entra por opacidad */
const STILL_FADE = { from: 0.2, to: 0.9 };

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

  // en mobile el borde de arriba deja lugar a la navbar (termina a ~76 px): antes
  // la navbar tapaba el borde superior de la foto
  const mobileTop = typeof window !== "undefined" && window.innerHeight > 0 ? Math.min(0.16, 88 / window.innerHeight) : 0.11;
  const t = lerp(isMobile ? mobileTop : 0.11, 0.0);   // Top border (11%)
  const l = lerp(isMobile ? 0.04 : 0.05, 0.0);   // Left inset (5%)
  const r = lerp(isMobile ? 0.96 : 0.95, 1.0);   // Right inset (5%)
  const b = lerp(isMobile ? 0.94 : 0.89, 1.0);   // Bottom border (11%)
  const sx = lerp(isMobile ? 0.7 : 0.265, 0.0); // Step X position shifted left to 26.5% (Matching user's red line)
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
  const sx = lerp(isMobile ? 0.7 : 0.265, 0.0); // Step X position
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
  const bloomRef = useRef<HTMLDivElement>(null);


  const [loadedPercentage, setLoadedPercentage] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  // el loader se funde (200 ms) en vez de cortar de negro al papel; recién
  // después se desmonta
  const [loaderGone, setLoaderGone] = useState(false);
  useEffect(() => {
    if (!isLoaded) return;
    const id = window.setTimeout(() => setLoaderGone(true), 240);
    return () => window.clearTimeout(id);
  }, [isLoaded]);
  const [isMobile, setIsMobile] = useState(false);
  // reduced-motion: intro sin zoom. La imagen queda quieta en su marco (primer
  // fotograma, máscara y escala fijas) y el scroll solo maneja opacidades: el
  // texto se va y el blanco entra; /works arranca sobre ese blanco igual que siempre.
  const [still] = useState(() => prefersReducedMotion());

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Light white frame background opacity (fades out as frame stroke shrinks to 0)
  // (reduced-motion: el marco no se va; lo tapa el blanco)
  const frameOpacity = useTransform(smoothProgress, (p) =>
    still ? 1 : p <= 0.18 ? 1 : p >= 0.25 ? 0 : 1 - (p - 0.18) / 0.07
  );

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

    // progreso que mueve la geometría (fotogramas, máscara, zoom): quieto en reduced-motion
    const geoP = still ? 0 : latestProgress;
    const totalFrames = CONFIG.TOTAL_FRAMES;
    const rawFrame = Math.min(1, geoP / FRAMES_END_P) * (totalFrames - 1);
    const currentFrame = Math.min(
      totalFrames - 1, 
      Math.max(0, Math.floor(rawFrame))
    );
    
    // Fractional progress between current frame and next frame (0.0 to 1.0)
    const frameFraction = rawFrame - currentFrame;

    // Only draw to canvas when the discrete frame index changes
    if (currentFrame !== lastRenderedFrameRef.current) {
      lastRenderedFrameRef.current = currentFrame;
      drawFrame(currentFrame);
    }

    // Update SVG mask path in real time via DOM attribute (hardware-accelerated GPU 60fps+)
    if (maskPathRef.current) {
      maskPathRef.current.setAttribute("d", getSteppedMaskPath(geoP, isMobile));
    }
    if (heroTextMaskRef.current) {
      heroTextMaskRef.current.setAttribute("d", getHeroTextMaskPath(geoP, isMobile));
    }

    // Continuous digital zoom: combines progressive base zoom + sub-frame micro zoom to smooth out low frame-rate jumps
    const vh = window.innerHeight;
    const baseScale = 1.0 + (geoP * 0.32);
    const microZoom = (frameFraction / totalFrames) * 0.50;
    const virtualScale = baseScale + microZoom;

    const opacity = 1;
    const display = "block";

    // Resplandor blanco: nace en la barra de censura (que la cámara ya está
    // atravesando) y cubre la pantalla; /works arranca sobre ese mismo blanco.
    const bloom = bloomRef.current;
    if (bloom && still) {
      // reduced-motion: blanco liso que entra solo por opacidad
      const t = isZoomDisabled
        ? 0
        : Math.max(0, Math.min(1, (latestProgress - STILL_FADE.from) / (STILL_FADE.to - STILL_FADE.from)));
      bloom.style.background = "#ffffff";
      bloom.style.opacity = (t * t * (3 - 2 * t)).toFixed(3);
    } else if (bloom) {
      const t = isZoomDisabled
        ? 0
        : Math.max(0, Math.min(1, (latestProgress - BLOOM_START_P) / (BLOOM_END_P - BLOOM_START_P)));
      if (t <= 0) {
        bloom.style.opacity = "0";
      } else if (t >= 1) {
        bloom.style.opacity = "1";
        bloom.style.background = "#ffffff";
      } else {
        const e = t * t * (3 - 2 * t);
        const vw = window.innerWidth;
        // posición en pantalla de la barra: cover del fotograma + zoom del canvas
        // (desde el centro) + escala 1.05 del contenedor de parallax
        const tex = framesRef.current[0];
        const tw = tex ? tex.width : 1920;
        const th = tex ? tex.height : 1080;
        const fit = Math.max(vw / tw, vh / th);
        const sw = tw * fit;
        const sh = th * fit;
        const zoom = virtualScale * 1.05;
        const cx = vw / 2 + ((vw - sw) / 2 + BAR_CENTER.x * sw - vw / 2) * zoom;
        const cy = vh / 2 + ((vh - sh) / 2 + BAR_CENTER.y * sh - vh / 2) * zoom;
        const r = Math.hypot(vw, vh) * (0.1 + 1.15 * e);
        bloom.style.opacity = Math.min(1, t * 3).toFixed(3);
        bloom.style.background = `radial-gradient(circle at ${cx.toFixed(1)}px ${cy.toFixed(1)}px, #ffffff ${(r * 0.55).toFixed(1)}px, rgba(255,255,255,0) ${r.toFixed(1)}px)`;
      }
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

  // Parallax del mouse: la imagen sigue al puntero con un retardo suave.
  // quickTo reutiliza un solo tween por eje (antes se creaba uno por cada
  // mousemove). Con reduced-motion no hay parallax: es movimiento decorativo
  // que sigue al cursor.
  useEffect(() => {
    const el = parallaxWrapperRef.current;
    if (!isLoaded || !el || prefersReducedMotion()) return;

    gsap.set(el, { scale: 1.05 });
    const toX = gsap.quickTo(el, "x", { duration: 0.8, ease: "power2.out" });
    const toY = gsap.quickTo(el, "y", { duration: 0.8, ease: "power2.out" });

    const handleMouseMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      toX(-((e.clientX - cx) / cx) * 18);
      toY(-((e.clientY - cy) / cy) * 18);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      gsap.killTweensOf(el);
    };
  }, [isLoaded]);

  return (
    <div 
      ref={containerRef} 
      className={`w-full ${isZoomDisabled ? "relative bg-[#f2efe6]" : "bg-black"}`} 
      style={{ height: isZoomDisabled ? "100vh" : `${(INTRO_RANGE_VH + 1) * 100}vh` }}
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
      {!loaderGone && (
        <div
          aria-hidden={isLoaded || undefined}
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-white transition-opacity duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] ${isLoaded ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        >
          <div className="font-sans text-[0.875rem] font-semibold uppercase tracking-[0.08em] mb-3 text-white/70">Cargando</div>
          <div className="text-7xl md:text-8xl tabular-nums" style={{ fontFamily: "'Instrument Serif', serif" }}>
            {loadedPercentage.toString().padStart(3, "0")}%
          </div>
          <div className="w-64 h-1 bg-white/20 mt-8 rounded-full overflow-hidden">
            {/* scaleX en vez de width: no dispara layout en cada paso */}
            <div
              className="h-full w-full origin-left bg-white transition-transform duration-200 ease-linear motion-reduce:transition-none"
              style={{ transform: `scaleX(${loadedPercentage / 100})` }}
            />
          </div>
        </div>
      )}

      {/* Light White Outer Frame Background */}
      <motion.div 
        className="fixed top-0 left-0 w-full h-screen pointer-events-none z-0 bg-[#f2efe6]"
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
            style={{ opacity: isLoaded ? 1 : 0, transition: "opacity 600ms cubic-bezier(0.23, 1, 0.32, 1)" }}
          />
        </div>

        {/* Cinematic Vignette / Border Fade */}
        <div 
          ref={vignetteRef}
          className="absolute inset-0 pointer-events-none"
          style={{ 
            opacity: isLoaded ? 1 : 0,
            transition: "opacity 600ms cubic-bezier(0.23, 1, 0.32, 1)",
            boxShadow: "inset 0 0 150px 80px rgba(0,0,0,1)",
            background: "radial-gradient(circle, transparent 60%, rgba(0,0,0,0.6) 100%)"
          }}
        />
      </motion.div>

      {/* Resplandor blanco del final (lo maneja updateRenderState) */}
      <div
        ref={bloomRef}
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-[15]"
        style={{ opacity: 0 }}
      />

    </div>
  );
}
