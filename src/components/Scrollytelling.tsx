import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

gsap.registerPlugin(ScrollToPlugin);

const ZOOM_FACTOR = 1.0; // Set to 1.0 to show 100% of the image

// --- CONFIGURATION ---
// Change these values when you replace the zoom folder
const CONFIG = {
  FOLDER_NAME: "scroll", // The name of the folder inside public/
  TOTAL_FRAMES: 100,   // Total number of images
  EXTENSION: "webp",   // File extension (e.g., 'webp', 'jpg', 'png')
  // Function to generate the filename. Change this if your files are named differently.
  // For example, if your files are just "1.jpg", "2.jpg", change it to: return `${index}.${CONFIG.EXTENSION}`;
  getFileName: (index: number) => {
    const paddedIndex = index.toString().padStart(4, "0");
    // Default format: "0001 copia.webp"
    return `${paddedIndex} copia.${CONFIG.EXTENSION}`;
  }
};

export default function Scrollytelling() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadedPercentage, setLoadedPercentage] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Store pre-rendered ImageBitmaps for ZERO-latency drawing without hitting browser canvas limits
  const framesRef = useRef<(ImageBitmap | HTMLImageElement)[]>([]);

  // Preload and decode images
  useEffect(() => {
    let loadedCount = 0;
    const frames: HTMLImageElement[] = [];

    for (let i = 1; i <= CONFIG.TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = encodeURI(`/${CONFIG.FOLDER_NAME}/${CONFIG.getFileName(i)}`);
      
      img.decode()
        .then(() => {
          frames[i - 1] = img;
          loadedCount++;
          setLoadedPercentage(Math.floor((loadedCount / CONFIG.TOTAL_FRAMES) * 100));
          if (loadedCount === CONFIG.TOTAL_FRAMES) {
            framesRef.current = frames;
            setIsLoaded(true);
          }
        })
        .catch((e) => {
          console.error(`Error loading frame ${i}:`, e);
          frames[i - 1] = img;
          loadedCount++;
          setLoadedPercentage(Math.floor((loadedCount / CONFIG.TOTAL_FRAMES) * 100));
          if (loadedCount === CONFIG.TOTAL_FRAMES) {
            framesRef.current = frames;
            setIsLoaded(true);
          }
        });
    }
  }, []);

  // Draw frame function
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

    // Do the scaling math here so it perfectly adapts to window resizes
    // and fixes any squashing issues!
    const scale = Math.max(canvas.width / texture.width, canvas.height / texture.height) * ZOOM_FACTOR;
    const scaledWidth = texture.width * scale;
    const scaledHeight = texture.height * scale;
    const offsetX = (canvas.width - scaledWidth) / 2;
    const offsetY = (canvas.height - scaledHeight) / 2;

    ctx.drawImage(texture, offsetX, offsetY, scaledWidth, scaledHeight);
  };

  const vignetteRef = useRef<HTMLDivElement>(null);

  // Scroll and Resize handling
  useEffect(() => {
    if (!isLoaded) return;

    drawFrame(0);
    let animationFrameId: number;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const zoomScrollRange = window.innerHeight * 4;
      const scrollFraction = Math.max(0, Math.min(1, scrollY / zoomScrollRange));
      const frameIndex = Math.min(CONFIG.TOTAL_FRAMES - 1, Math.floor(scrollFraction * CONFIG.TOTAL_FRAMES));
      
      // Show scroll to top button only after 4.5 * viewport height
      setShowScrollButton(scrollY > window.innerHeight * 4.5);
      
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        drawFrame(frameIndex);

        // Virtual Zoom: Continuously scale the canvas using CSS
        if (canvasRef.current) {
          // Start at 1.0 (100% of the image) and zoom slightly as images pass
          const virtualScale = 1.0 + (scrollFraction * 0.15);
          
          let opacity = 1;
          let display = "block";
          if (scrollY > window.innerHeight * 4) {
            const fadeFraction = (scrollY - window.innerHeight * 4) / window.innerHeight;
            opacity = Math.max(0, 1 - fadeFraction);
          }
          if (scrollY >= window.innerHeight * 5) {
            display = "none";
          }

          canvasRef.current.style.transform = `scale(${virtualScale})`;
          canvasRef.current.style.opacity = opacity.toString();
          canvasRef.current.style.display = display;
        }

        if (vignetteRef.current) {
          let opacity = 1;
          let display = "block";
          if (scrollY > window.innerHeight * 4) {
            const fadeFraction = (scrollY - window.innerHeight * 4) / window.innerHeight;
            opacity = Math.max(0, 1 - fadeFraction);
          }
          if (scrollY >= window.innerHeight * 5) {
            display = "none";
          }
          vignetteRef.current.style.opacity = opacity.toString();
          vignetteRef.current.style.display = display;
        }
      });
    };

    const handleResize = () => {
      // Just redraw the current cached frame to prevent blanking on resize
      handleScroll();
    };

    // Run once initially to set the proper layout state
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isLoaded]);

  // Mouse parallax with GSAP
  useEffect(() => {
    if (!isLoaded || !canvasRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;

      const moveX = (clientX - centerX) / centerX;
      const moveY = (clientY - centerY) / centerY;

      gsap.to(canvasRef.current, {
        x: -moveX * 20, 
        y: -moveY * 20,
        duration: 0.5,
        ease: "power2.out",
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isLoaded]);

  const handleScrollToTop = () => {
    gsap.to(window, { scrollTo: 0, duration: 1.5, ease: "power3.inOut" });
  };

  return (
    <div ref={containerRef} className="bg-black w-full" style={{ height: "500vh" }}>
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

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full object-cover scale-105 origin-center pointer-events-none"
        style={{ opacity: isLoaded ? 1 : 0, transition: "opacity 1s ease-in-out" }}
      />

      {/* Cinematic Vignette / Border Fade */}
      <div 
        ref={vignetteRef}
        className="fixed inset-0 pointer-events-none z-10"
        style={{ 
          opacity: isLoaded ? 1 : 0, 
          transition: "opacity 1s ease-in-out",
          // Strong inset shadow to hide rough edges, plus a subtle radial fade
          boxShadow: "inset 0 0 150px 80px rgba(0,0,0,1)",
          background: "radial-gradient(circle, transparent 60%, rgba(0,0,0,0.6) 100%)"
        }}
      />

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
