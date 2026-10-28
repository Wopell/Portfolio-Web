import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ProjectItem } from '../data/projects';

interface AsciiWorldProps {
  onSelectProject?: (project: ProjectItem) => void;
}

// ASCII character palette for authentic monochrome halftone rendering
const ASCII_CHARS = [' ', '.', ':', '-', '+', '*', '3', '7', '5', '9', '8', 'S', '%', '?', '#', '@'];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  char: string;
  size: number;
  opacity: number;
  pulsePhase: number;
  pulseSpeed: number;
}

export function AsciiWorld({ onSelectProject }: AsciiWorldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mouse interaction for 3D tilt & rotation
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, isHovering: false });
  const rotationRef = useRef(0);

  // Ambient floating particles
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    // 36 ambient floating stars and dust particles
    const particleChars = ['*', '+', '·', '✦', '°', '×', '•'];
    const pCount = 36;
    const initialParticles: Particle[] = [];
    for (let i = 0; i < pCount; i++) {
      initialParticles.push({
        x: Math.random(),
        y: Math.random(),
        vx: (Math.random() - 0.5) * 0.0003,
        vy: -0.0002 - Math.random() * 0.00035, // slowly drifting upward
        char: particleChars[Math.floor(Math.random() * particleChars.length)],
        size: 9 + Math.floor(Math.random() * 5),
        opacity: 0.25 + Math.random() * 0.55,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.02 + Math.random() * 0.03,
      });
    }
    particlesRef.current = initialParticles;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const handleResize = () => {
      const container = containerRef.current;
      if (!container || !canvas) return;
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const renderLoop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Smooth mouse spring interpolation
      const mouse = mouseRef.current;
      mouse.x += (mouse.targetX - mouse.x) * 0.06;
      mouse.y += (mouse.targetY - mouse.y) * 0.06;

      // Real-time auto-rotation
      rotationRef.current += (0.75 + mouse.x * 0.8) * dt;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);

      // 1. Render Floating Ambient Particles
      ctx.fillStyle = '#1c1917';
      ctx.font = '11px "JetBrains Mono", monospace';
      particlesRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.pulsePhase += p.pulseSpeed;

        if (p.y < -0.05) p.y = 1.05;
        if (p.x < -0.05) p.x = 1.05;
        if (p.x > 1.05) p.x = -0.05;

        const currentOpacity = p.opacity * (0.65 + 0.35 * Math.sin(p.pulsePhase));
        ctx.globalAlpha = Math.max(0, Math.min(1, currentOpacity));
        ctx.fillText(p.char, p.x * width, p.y * height);
      });

      // 2. Render 3D Diagonal Rotating ASCII Saturn (Matching user reference)
      const isMobile = width < 640;
      const cols = isMobile ? 64 : 88;
      const rows = isMobile ? 36 : 46;

      const cellW = width / cols;
      const cellH = height / rows;

      ctx.font = `${isMobile ? 10 : 12}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Geometry: Planet sphere + Wide diagonal tilted rings
      const Rs = 0.44; // Sphere radius
      const Rin = 0.64; // Ring inner radius
      const Rout = 1.54; // Ring outer radius (wide expansive ring system)

      // Diagonal screen tilt angle (matching user reference ~ -26 degrees)
      const gamma = (-26 + mouse.x * 5) * (Math.PI / 180);
      const cosG = Math.cos(gamma);
      const sinG = Math.sin(gamma);

      // Ring inclination angle
      const baseTilt = (24 + mouse.y * 8) * (Math.PI / 180);
      const cosB = Math.cos(baseTilt);
      const sinB = Math.sin(baseTilt);

      // Dynamic light vector
      const Lx = -0.55;
      const Ly = 0.6;
      const Lz = 0.65;
      const Llen = Math.hypot(Lx, Ly, Lz);
      const nLx = Lx / Llen;
      const nLy = Ly / Llen;
      const nLz = Lz / Llen;

      const rot = rotationRef.current;

      for (let j = 0; j < rows; j++) {
        // Screen normalized coordinates centered
        const sy = ((j / rows) * 2 - 1) * 0.95;
        for (let i = 0; i < cols; i++) {
          const sx = ((i / cols) * 2 - 1) * 1.55;

          // 2D Rotation by diagonal angle gamma to match the reference tilt
          const nx = sx * cosG + sy * sinG;
          const ny = -sx * sinG + sy * cosG;

          // Check Sphere Hit
          const r2 = nx * nx + ny * ny;
          const hitSphere = r2 <= Rs * Rs;
          const zSphere = hitSphere ? Math.sqrt(Rs * Rs - r2) : 999;

          // Check Ring Hit
          const zRing = ny * (cosB / sinB);
          const rRing = Math.sqrt(nx * nx + Math.pow(ny / sinB, 2));
          // Ring bounds with Cassini division gap
          const hitRing = rRing >= Rin && rRing <= Rout && !(rRing >= 0.98 && rRing <= 1.05);

          let char = '';
          let alpha = 0.85;

          if (hitSphere && (!hitRing || zSphere < zRing)) {
            // Sphere in Front
            const normX = nx / Rs;
            const normY = ny / Rs;
            const normZ = zSphere / Rs;

            // Surface coordinates rotating around Y axis
            const phi = Math.asin(Math.max(-1, Math.min(1, normY)));
            const lam = Math.atan2(normX, normZ) + rot;

            // Cloud bands & swirling atmosphere
            const band =
              Math.sin(phi * 7) * 0.2 +
              Math.cos(phi * 16 + Math.sin(lam * 3)) * 0.12 +
              Math.sin(lam * 4) * 0.08;

            const dot = Math.max(0, normX * nLx + normY * nLy + normZ * nLz);
            const ambient = 0.15;

            // Ring shadow cast on sphere
            let ringShadowFactor = 1.0;
            const rayY = normY - nLy * 0.35;
            const rayRingR = Math.sqrt(normX * normX + Math.pow(rayY / sinB, 2));
            if (rayRingR >= Rin && rayRingR <= Rout) {
              ringShadowFactor = 0.3;
            }

            const intensity = Math.max(0, Math.min(1, (dot * (0.8 + band) + ambient) * ringShadowFactor));
            const charIdx = Math.floor(intensity * (ASCII_CHARS.length - 1));
            char = ASCII_CHARS[charIdx];
            alpha = 0.35 + intensity * 0.65;

          } else if (hitRing) {
            // Ring in Front
            let ringIntensity =
              0.55 +
              0.25 * Math.sin(rRing * 38) +
              0.15 * Math.cos(rRing * 75);

            // Planet shadow on the ring behind it
            if (zRing > 0 && r2 < Rs * Rs * 1.4) {
              ringIntensity *= 0.18;
            }

            ringIntensity = Math.max(0.08, Math.min(1, ringIntensity));
            const charIdx = Math.floor(ringIntensity * (ASCII_CHARS.length - 1));
            char = ASCII_CHARS[charIdx];
            alpha = 0.25 + ringIntensity * 0.75;
          }

          if (char && char !== ' ') {
            ctx.globalAlpha = alpha;
            ctx.fillText(char, (i + 0.5) * cellW, (j + 0.5) * cellH);
          }
        }
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    mouseRef.current.targetX = x;
    mouseRef.current.targetY = y;
    mouseRef.current.isHovering = true;
  };

  const handleMouseLeave = () => {
    mouseRef.current.targetX = 0;
    mouseRef.current.targetY = 0;
    mouseRef.current.isHovering = false;
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full max-w-4xl mx-auto h-[380px] sm:h-[460px] md:h-[520px] flex items-center justify-center select-none overflow-visible my-2"
    >
      {/* 1. Real-time Canvas ASCII 3D Diagonal Saturn */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* 2. Floating Circular Badges & Stickers from Exact Reference */}

      {/* Top-Left: Circular Chibi Avatar Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        whileHover={{ scale: 1.15, rotate: -4 }}
        className="absolute left-[11%] top-[18%] z-20 cursor-pointer group"
        onClick={() => {
          onSelectProject?.({
            id: 'anim-editorial',
            title: 'Editorial Design & Character Animation',
            client: 'Personal Lab',
            tag: 'Character 3D',
            year: '2026',
            image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1000&auto=format&fit=crop',
            description: 'Stylized 2.5D character model and animator rig exploring anime stepped keyframing.',
          });
        }}
      >
        <div className="w-12 h-12 sm:w-15 sm:h-15 rounded-full border-2 border-teal-600 bg-white shadow-xl overflow-hidden p-0.5 transition-shadow group-hover:shadow-2xl">
          <img
            src="/ref/chibi_avatar_clean.png"
            alt="Editorial avatar preview"
            className="w-full h-full object-cover rounded-full"
          />
        </div>
      </motion.div>

      {/* [ Editorial Design ] Label with Curved Arrow to Top-Left Badge */}
      <div className="absolute left-[6%] top-[34%] z-20 pointer-events-none">
        <div className="px-2.5 py-0.5 bg-white border border-black/30 rounded shadow-sm font-mono text-[10px] sm:text-xs text-zinc-900 font-semibold flex items-center gap-1.5">
          <span>Editorial Design</span>
        </div>
        {/* Curved arrow pointing up-left */}
        <svg
          className="absolute -top-7 left-7 w-12 h-10 pointer-events-none text-zinc-800 overflow-visible"
          viewBox="0 0 50 40"
          fill="none"
        >
          <path
            d="M 12 34 C 12 16, 26 12, 36 6"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeDasharray="2.5 2"
          />
          <polygon points="38,4 32,5 35,9" fill="currentColor" />
        </svg>
      </div>

      {/* [ Social Media ] Label with Pink Square Dot */}
      <div className="absolute left-[27%] top-[40%] z-20 pointer-events-none">
        <div className="px-2.5 py-0.5 bg-white border border-black/30 rounded shadow-sm font-mono text-[10px] sm:text-xs text-zinc-900 font-semibold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-[2px] bg-[#d82d6b]" />
          <span>Social Media</span>
        </div>
      </div>

      {/* Top-Right: Standing Chibi Avatar Sticker with Washi Tape */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        whileHover={{ scale: 1.1, rotate: 3 }}
        className="absolute right-[16%] top-[14%] z-20 pointer-events-auto"
      >
        <div className="relative p-1.5 bg-[#fffdf9] rounded-lg shadow-xl border border-black/15 rotate-[-2deg]">
          {/* Top washi tape strip */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-11 h-3.5 bg-amber-100/85 border-x border-amber-300/60 rotate-[3deg] shadow-sm pointer-events-none" />
          <div className="w-12 h-14 sm:w-14 sm:h-16 rounded overflow-hidden flex items-center justify-center">
            <img
              src="/ref/chibi_sticker_clean.png"
              alt="Avatar sticker"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
        {/* Small curved arrow pointing to sticker */}
        <svg
          className="absolute -left-6 top-6 w-8 h-8 pointer-events-none text-zinc-700 -rotate-12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M4 18 C8 18, 16 14, 18 6" strokeLinecap="round" />
          <path d="M13 6 L19 5 L20 11" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.div>

      {/* [ Branding ] Label with Purple Square Dot */}
      <div className="absolute right-[22%] top-[42%] z-20 pointer-events-none">
        <div className="px-2.5 py-0.5 bg-white border border-black/30 rounded shadow-sm font-mono text-[10px] sm:text-xs text-zinc-900 font-semibold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-[2px] bg-[#7c3aed]" />
          <span>Branding</span>
        </div>
      </div>

      {/* Center-Bottom: Circular Portrait Badge with Thick Dark Border */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        whileHover={{ scale: 1.15, y: -4 }}
        className="absolute left-[47%] -translate-x-1/2 bottom-[14%] z-30 cursor-pointer group"
        onClick={() => {
          onSelectProject?.({
            id: 'post-hero-portrait',
            title: 'Vintage Film Lookdev & Color Timing',
            client: 'Tomy Powell',
            tag: 'Post-Production',
            year: '2026',
            image: '/ref/tomy_vintage_card.png',
            description: 'Photographic lookdev study utilizing authentic 35mm grain halation and ACES color timing.',
          });
        }}
      >
        <div className="w-14 h-14 sm:w-17 sm:h-17 rounded-full border-[2.5px] border-zinc-950 bg-black shadow-2xl overflow-hidden p-0.5 transition-all group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
          <img
            src="/ref/portrait_clean.png"
            alt="Tomy Powell portrait preview"
            className="w-full h-full object-cover rounded-full"
          />
        </div>
      </motion.div>

      {/* Right Side: Circular Avatar Badge with Teal Border */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        whileHover={{ scale: 1.15, rotate: 4 }}
        className="absolute right-[17%] bottom-[24%] z-20 cursor-pointer group"
        onClick={() => {
          onSelectProject?.({
            id: 'ia-visuals',
            title: 'Event Graphics & Neural Visuals',
            client: 'Personal Lab',
            tag: 'Generative IA',
            year: '2026',
            image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1000&auto=format&fit=crop',
            description: 'Multi-stage generative diffusion exploring neural surrealism and chromatic aberration.',
          });
        }}
      >
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-teal-600 bg-white shadow-xl overflow-hidden p-0.5 transition-shadow group-hover:shadow-2xl">
          <img
            src="/ref/right_circle_clean.png"
            alt="Event graphics avatar preview"
            className="w-full h-full object-cover rounded-full"
          />
        </div>
      </motion.div>

      {/* [ Event Graphics ] Label with Maroon Square Dot & Pointer Line */}
      <div className="absolute right-[12%] bottom-[12%] z-20 pointer-events-none flex flex-col items-end">
        <div className="px-2.5 py-0.5 bg-white border border-black/30 rounded shadow-sm font-mono text-[10px] sm:text-xs text-zinc-900 font-semibold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-[2px] bg-[#991b1b]" />
          <span>Event Graphics</span>
        </div>
      </div>

      {/* Blueprint Alignment Crosses (+) */}
      <div className="absolute -left-2 top-1/2 -translate-y-1/2 text-zinc-400 font-mono text-xl select-none pointer-events-none opacity-60">
        +
      </div>
      <div className="absolute -right-2 top-1/2 -translate-y-1/2 text-zinc-400 font-mono text-xl select-none pointer-events-none opacity-60">
        +
      </div>
    </div>
  );
}
