import { useEffect, useRef } from 'react';

interface Segment {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface Wave {
  segments: Segment[];
  radius: number;
  speed: number;
  strength: number;
  startTime: number;
  stopTime?: number;
  lifetime: number;
}

export function ReactiveHalftone() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Two waves in memory (1 active wave, 1 historical fading wave)
  const wave1Ref = useRef<Wave | null>(null); // Active or recently completed wave
  const wave2Ref = useRef<Wave | null>(null); // Historical fading wave
  
  const isMovingRef = useRef(false);
  const lastMoveTimeRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  const lastMousePosRef = useRef({ x: -9999, y: -9999 });
  const lastSpawnTimeRef = useRef(0);
  const mouseRef = useRef({ x: -9999, y: -9999, targetX: -9999, targetY: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.warn('WebGL not supported');
      return;
    }

    // Set initial canvas size with a restricted DPR to optimize performance
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Vertex shader: Fullscreen quad
    const vsSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    // Fragment shader: WebGL 1.0 water-rippling dual path-based animated halftone shader
    const fsSource = `
      precision mediump float;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse; // Smooth lerped cursor coordinates (physical pixels)
      uniform float u_time;
      uniform float u_dpr;

      // Wave 1 Uniforms (Active drag path - up to 8 segments)
      uniform vec2 u_wave1_starts[8];
      uniform vec2 u_wave1_ends[8];
      uniform int u_wave1_count;
      uniform float u_wave1_radius;
      uniform float u_wave1_strength;

      // Wave 2 Uniforms (Historical drag path 1 - up to 8 segments)
      uniform vec2 u_wave2_starts[8];
      uniform vec2 u_wave2_ends[8];
      uniform int u_wave2_count;
      uniform float u_wave2_radius;
      uniform float u_wave2_strength;

      // Simple 2D hash for noise
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      // 2D Value Noise
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
                   mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
      }

      // Evolving Fractal Brownian Motion (layered noise with time-phase morphing)
      float fbm(vec2 p, float time) {
        float value = 0.0;
        float amplitude = 0.5;
        float frequency = 1.0;
        
        // Octave 1: Moves slowly vertically
        value += amplitude * noise(p * frequency + vec2(0.0, -time * 0.8));
        
        // Octave 2: Moves diagonally
        amplitude *= 0.5;
        frequency *= 2.0;
        value += amplitude * noise(p * frequency + vec2(-time * 0.5, time * 0.7));
        
        // Octave 3: Moves horizontally
        amplitude *= 0.5;
        frequency *= 2.0;
        value += amplitude * noise(p * frequency + vec2(time * 0.9, -time * 0.4));
        
        return value;
      }

      void main() {
        // Grid spacing in physical pixels (scaled by devicePixelRatio)
        float dotSpacing = 16.0 * u_dpr;
        vec2 pixelCoords = gl_FragCoord.xy;
        
        vec2 gridUv = fract(pixelCoords / dotSpacing) - 0.5;
        vec2 cellId = floor(pixelCoords / dotSpacing);
        vec2 cellCenterPixels = (cellId + 0.5) * dotSpacing;

        // 1. Concentrated Static Hover (where the mouse rests)
        float staticDist = distance(cellCenterPixels, u_mouse);
        float staticRadius = 65.0 * u_dpr;
        
        // Negative Bulge (Attraction/Pinch) effect: pull dot centers towards the cursor
        vec2 pullDir = normalize(u_mouse - cellCenterPixels);
        float pullStrength = smoothstep(staticRadius, 0.0, staticDist) * 7.5 * u_dpr;
        
        vec2 pulledCenter = cellCenterPixels;
        if (staticDist > 0.1) {
          pulledCenter += pullDir * pullStrength;
        }

        // Re-calculate gridUV based on pulled centers
        vec2 pulledGridUv = (pixelCoords - pulledCenter) / dotSpacing;

        // Subtler swell (dots grow slightly larger, up to +0.06, keeping them elegant)
        float staticSwell = smoothstep(staticRadius, 0.0, staticDist) * 0.06;
        float staticOpacity = smoothstep(staticRadius, 0.0, staticDist);

        // 2. Dynamic Expanding Waves (Wavy, asymmetric, and cursor-repelled)
        // --- WAVE 1: Active Drag Path (Unified radius prevents segment overlap "sapito" glitches) ---
        float wave1Intensity = 0.0;
        vec2 warp1 = vec2(0.0);
        
        if (u_wave1_count > 0 && u_wave1_strength > 0.01) {
          float minDist1 = 99999.0;
          vec2 closestPoint1 = vec2(0.0);
          vec2 closestSegStart1 = vec2(0.0);
          vec2 closestSegEnd1 = vec2(0.0);
          
          for (int i = 0; i < 8; i++) {
            if (i >= u_wave1_count) break;
            vec2 start = u_wave1_starts[i];
            vec2 end = u_wave1_ends[i];
            vec2 ba = end - start;
            vec2 pa = cellCenterPixels - start;
            float lenSq = dot(ba, ba);
            float h = lenSq > 0.0001 ? clamp(dot(pa, ba) / lenSq, 0.0, 1.0) : 0.0;
            vec2 pt = start + ba * h;
            float d = length(cellCenterPixels - pt);
            if (d < minDist1) {
              minDist1 = d;
              closestPoint1 = pt;
              closestSegStart1 = start;
              closestSegEnd1 = end;
            }
          }

          vec2 ba1 = closestSegEnd1 - closestSegStart1;
          float segLen1 = length(ba1);
          vec2 velDir1 = segLen1 > 0.1 ? ba1 / segLen1 : vec2(0.0);

          vec2 toCell1 = cellCenterPixels - closestPoint1;
          vec2 dirNorm1 = minDist1 > 0.1 ? toCell1 / minDist1 : vec2(0.0);
          float proj1 = dot(dirNorm1, velDir1);

          float waveNoise1 = fbm(cellId * 0.045, u_time * 0.6);
          float radiusOffset1 = (waveNoise1 - 0.5) * 45.0 * u_dpr;

          float waveDist1 = abs(minDist1 - (u_wave1_radius + radiusOffset1));
          float maxWaveWidth = 35.0 * u_dpr;
          float waveWidth = min(maxWaveWidth, u_wave1_radius * 0.8 + 6.0 * u_dpr);

          float x1 = clamp(waveDist1 / waveWidth, 0.0, 1.0);
          float waveIntensityFactor1 = 1.0 - x1 * x1;
          waveIntensityFactor1 = waveIntensityFactor1 * waveIntensityFactor1 * waveIntensityFactor1;

          float directionScale1 = smoothstep(-0.3, 0.3, proj1) * 0.93 + 0.07;

          wave1Intensity = waveIntensityFactor1 * u_wave1_strength * directionScale1;
          wave1Intensity *= smoothstep(0.0, 45.0 * u_dpr, minDist1); // fade center of the path

          if (minDist1 > 0.1) {
            vec2 warpDir = normalize(toCell1);
            float waveOsc = sin(minDist1 * 0.08 - u_wave1_radius * 0.15);
            warp1 = warpDir * waveOsc * wave1Intensity * 1.5 * u_dpr;
          }
        }

        // --- WAVE 2: Historical Drag Path 1 (Fading out organically) ---
        float wave2Intensity = 0.0;
        vec2 warp2 = vec2(0.0);
        
        if (u_wave2_count > 0 && u_wave2_strength > 0.01) {
          float minDist2 = 99999.0;
          vec2 closestPoint2 = vec2(0.0);
          vec2 closestSegStart2 = vec2(0.0);
          vec2 closestSegEnd2 = vec2(0.0);

          for (int i = 0; i < 8; i++) {
            if (i >= u_wave2_count) break;
            vec2 start = u_wave2_starts[i];
            vec2 end = u_wave2_ends[i];
            vec2 ba = end - start;
            vec2 pa = cellCenterPixels - start;
            float lenSq = dot(ba, ba);
            float h = lenSq > 0.0001 ? clamp(dot(pa, ba) / lenSq, 0.0, 1.0) : 0.0;
            vec2 pt = start + ba * h;
            float d = length(cellCenterPixels - pt);
            if (d < minDist2) {
              minDist2 = d;
              closestPoint2 = pt;
              closestSegStart2 = start;
              closestSegEnd2 = end;
            }
          }

          vec2 ba2 = closestSegEnd2 - closestSegStart2;
          float segLen2 = length(ba2);
          vec2 velDir2 = segLen2 > 0.1 ? ba2 / segLen2 : vec2(0.0);

          vec2 toCell2 = cellCenterPixels - closestPoint2;
          vec2 dirNorm2 = minDist2 > 0.1 ? toCell2 / minDist2 : vec2(0.0);
          float proj2 = dot(dirNorm2, velDir2);

          float waveNoise2 = fbm(cellId * 0.045, u_time * 0.6);
          float radiusOffset2 = (waveNoise2 - 0.5) * 45.0 * u_dpr;

          float waveDist2 = abs(minDist2 - (u_wave2_radius + radiusOffset2));
          float maxWaveWidth2 = 35.0 * u_dpr;
          float waveWidth2 = min(maxWaveWidth2, u_wave2_radius * 0.8 + 6.0 * u_dpr);

          float x2 = clamp(waveDist2 / waveWidth2, 0.0, 1.0);
          float waveIntensityFactor2 = 1.0 - x2 * x2;
          waveIntensityFactor2 = waveIntensityFactor2 * waveIntensityFactor2 * waveIntensityFactor2;

          float directionScale2 = smoothstep(-0.3, 0.3, proj2) * 0.93 + 0.07;

          wave2Intensity = waveIntensityFactor2 * u_wave2_strength * directionScale2;
          wave2Intensity *= smoothstep(0.0, 45.0 * u_dpr, minDist2); // fade center

          if (minDist2 > 0.1) {
            vec2 warpDir = normalize(toCell2);
            float waveOsc = sin(minDist2 * 0.08 - u_wave2_radius * 0.15);
            warp2 = warpDir * waveOsc * wave2Intensity * 1.5 * u_dpr;
          }
        }

        // Combine all waves (Wave 1, Wave 2)
        float totalWave = max(wave1Intensity, wave2Intensity);
        vec2 totalWarp = warp1 + warp2;

        // Apply noise coords distorted by water refraction warp
        vec2 noiseCoords = cellId * 0.07 - totalWarp * 0.2;

        float noiseVal = fbm(noiseCoords, u_time);

        // Combined Swell: static hover swell takes precedence, dynamic wave swell overlays
        float swell = max(staticSwell, totalWave * 0.10);
        
        // Final radius: clamped to 0.28 to keep dots small and elegant
        float dotRadius = clamp(noiseVal * 0.30 + swell, 0.01, 0.28);

        // Draw dot shape with antialiased borders using the pulled centers
        float distToCenter = length(pulledGridUv);
        float antialias = 0.08;
        float dotColor = smoothstep(dotRadius, dotRadius - antialias, distToCenter);

        // Combined Opacity: static hover and dynamic waves light up to 100%, idle background stays at 15%
        float totalOpacityFactor = max(staticOpacity, totalWave);
        float finalOpacity = mix(0.15, 1.0, totalOpacityFactor);

        // Output black halftone dots with dynamic alpha
        gl_FragColor = vec4(vec3(0.0), dotColor * finalOpacity);
      }
    `;

    // Shader compilation
    const compileShader = (source: string, type: number) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = compileShader(vsSource, gl.VERTEX_SHADER);
    const fs = compileShader(fsSource, gl.FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Fullscreen quad vertices
    const vertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    const resolutionLoc = gl.getUniformLocation(program, 'u_resolution');
    const mouseLoc = gl.getUniformLocation(program, 'u_mouse');
    const timeLoc = gl.getUniformLocation(program, 'u_time');
    const dprLoc = gl.getUniformLocation(program, 'u_dpr');
    
    // Wave 1 uniforms
    const wave1StartsLoc = gl.getUniformLocation(program, 'u_wave1_starts');
    const wave1EndsLoc = gl.getUniformLocation(program, 'u_wave1_ends');
    const wave1CountLoc = gl.getUniformLocation(program, 'u_wave1_count');
    const wave1RadiusLoc = gl.getUniformLocation(program, 'u_wave1_radius');
    const wave1StrengthLoc = gl.getUniformLocation(program, 'u_wave1_strength');

    // Wave 2 uniforms
    const wave2StartsLoc = gl.getUniformLocation(program, 'u_wave2_starts');
    const wave2EndsLoc = gl.getUniformLocation(program, 'u_wave2_ends');
    const wave2CountLoc = gl.getUniformLocation(program, 'u_wave2_count');
    const wave2RadiusLoc = gl.getUniformLocation(program, 'u_wave2_radius');
    const wave2StrengthLoc = gl.getUniformLocation(program, 'u_wave2_strength');

    // Handle mouse movement to update paths and state machine
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      
      const mouseX = (e.clientX - rect.left) * dpr;
      const mouseY = (rect.height - (e.clientY - rect.top)) * dpr;

      // Update static hover target coordinates
      mouseRef.current.targetX = mouseX;
      mouseRef.current.targetY = mouseY;

      const now = performance.now();
      const timeSinceLastMove = now - lastMoveTimeRef.current;

      // Transition from REST to MOTION, or start of a NEW drag stroke (pause > 120ms)
      if (!isMovingRef.current || timeSinceLastMove > 120) {
        isMovingRef.current = true;
        
        // Cycle active wave to historical wave (only if Wave 1 contains actual segments)
        if (wave1Ref.current && wave1Ref.current.segments.length > 0) {
          wave1Ref.current.stopTime = now;
          wave2Ref.current = { ...wave1Ref.current };
        }

        // Initialize Wave 1
        wave1Ref.current = {
          segments: [],
          radius: 0,
          speed: 110 * dpr,
          strength: 1.0,
          startTime: now,
          lifetime: 2400
        };

        lastMousePosRef.current = { x: mouseX, y: mouseY };
        lastSpawnTimeRef.current = now;
      }

      // If we are moving, append segments to the current active wave path
      const lastPos = lastMousePosRef.current;
      const dx = mouseX - lastPos.x;
      const dy = mouseY - lastPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Append segment if cursor moved at least 15px and at least 60ms passed
      if (wave1Ref.current && dist > 15 * dpr && now - lastSpawnTimeRef.current > 60) {
        wave1Ref.current.segments.push({
          startX: lastPos.x,
          startY: lastPos.y,
          endX: mouseX,
          endY: mouseY
        });

        // Limit active path length to 8 segments for performance
        if (wave1Ref.current.segments.length > 8) {
          wave1Ref.current.segments.shift();
        }

        lastMousePosRef.current = { x: mouseX, y: mouseY };
        lastSpawnTimeRef.current = now;
      }

      // Record last move time
      lastMoveTimeRef.current = now;
    };

    const handleMouseLeave = () => {
      // Send mouse coordinates offscreen
      mouseRef.current.targetX = -9999;
      mouseRef.current.targetY = -9999;
      lastMousePosRef.current = { x: -9999, y: -9999 };
      
      // Cycle active wave to Wave 2 immediately when mouse leaves (only if it has segments)
      if (isMovingRef.current && wave1Ref.current) {
        if (wave1Ref.current.segments.length > 0) {
          wave1Ref.current.stopTime = performance.now();
          wave2Ref.current = { ...wave1Ref.current };
        }
        wave1Ref.current = null;
      }
      isMovingRef.current = false;
    };

    const handleWindowBlur = () => {
      // Reset all mouse states when tab loses focus
      mouseRef.current.targetX = -9999;
      mouseRef.current.targetY = -9999;
      mouseRef.current.x = -9999;
      mouseRef.current.y = -9999;
      lastMousePosRef.current = { x: -9999, y: -9999 };
      
      if (isMovingRef.current && wave1Ref.current) {
        if (wave1Ref.current.segments.length > 0) {
          wave1Ref.current.stopTime = performance.now();
          wave2Ref.current = { ...wave1Ref.current };
        }
        wave1Ref.current = null;
      }
      isMovingRef.current = false;
    };

    // Listen on the parent section for mouse events
    const parentSection = canvas.parentElement;
    if (parentSection) {
      parentSection.addEventListener('mousemove', handleMouseMove);
      parentSection.addEventListener('mouseleave', handleMouseLeave);
      window.addEventListener('blur', handleWindowBlur);
      
      // Initialize offscreen
      mouseRef.current.x = -9999;
      mouseRef.current.y = -9999;
      mouseRef.current.targetX = -9999;
      mouseRef.current.targetY = -9999;
    }

    let animationFrameId = 0;
    const startTime = performance.now();
    lastFrameTimeRef.current = startTime;

    const render = () => {
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      const now = performance.now();

      // Clamp dt to a maximum of 100ms to prevent radius explosions on tab awake
      const dt = Math.min(100, now - lastFrameTimeRef.current);
      lastFrameTimeRef.current = now;

      // Smoothly interpolate mouse coordinates (Lerp) for organic static highlight movement
      if (mouseRef.current.targetX === -9999) {
        mouseRef.current.x = -9999;
        mouseRef.current.y = -9999;
      } else {
        if (mouseRef.current.x === -9999) {
          mouseRef.current.x = mouseRef.current.targetX;
          mouseRef.current.y = mouseRef.current.targetY;
        } else {
          mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.08;
          mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.08;
        }
      }

      // RULE 1: Check if mouse has entered rest state (no mousemove for 120ms)
      // Cycle active segments to Wave 2 immediately!
      if (isMovingRef.current && now - lastMoveTimeRef.current > 120) {
        isMovingRef.current = false;
        if (wave1Ref.current) {
          if (wave1Ref.current.segments.length > 0) {
            wave1Ref.current.stopTime = now;
            wave2Ref.current = { ...wave1Ref.current };
          }
          wave1Ref.current = null;
        }
      }

      // 1. Update Active Wave (Wave 1)
      if (wave1Ref.current) {
        const mx = mouseRef.current.targetX;
        const my = mouseRef.current.targetY;

        let baseStrength = 1.0; // Clamped to 1.0 during active movement
        if (!isMovingRef.current && wave1Ref.current.stopTime) {
          const elapsedSinceStop = now - wave1Ref.current.stopTime;
          const progress = elapsedSinceStop / wave1Ref.current.lifetime;
          baseStrength = Math.max(0, 1 - progress);
        }

        let proximity = 0;
        // RULE 2: Only calculate proximity and apply boosts if base strength is >= 0.22
        // AND the wave radius is less than 150px
        if (baseStrength >= 0.22 && mx !== -9999 && wave1Ref.current.segments.length > 0 && wave1Ref.current.radius < 150 * dpr) {
          let minDist = 99999;
          for (const seg of wave1Ref.current.segments) {
            const dx = seg.endX - seg.startX;
            const dy = seg.endY - seg.startY;
            const lenSq = dx * dx + dy * dy;
            let t = lenSq > 0.0001 ? ((mx - seg.startX) * dx + (my - seg.startY) * dy) / lenSq : 0;
            t = Math.max(0, Math.min(1, t));
            const px = seg.startX + t * dx;
            const py = seg.startY + t * dy;
            const d = Math.sqrt((mx - px) ** 2 + (my - py) ** 2);
            if (d < minDist) minDist = d;
          }

          const distToWaveFront = Math.abs(minDist - wave1Ref.current.radius);
          const x = distToWaveFront / (60 * dpr);
          proximity = x < 1 ? Math.pow(1 - x * x, 2) : 0;
        }

        const baseSpeed = 110 * dpr;
        const maxSpeed = 380 * dpr;
        wave1Ref.current.speed = baseSpeed + proximity * (maxSpeed - baseSpeed);

        // Update radius smoothly over time
        wave1Ref.current.radius += wave1Ref.current.speed * (dt / 1000);

        // Update strength
        wave1Ref.current.strength = Math.min(1.0, baseStrength + proximity * 0.45);

        // Expire check (only when stopped drawing)
        if (!isMovingRef.current && wave1Ref.current.stopTime && (now - wave1Ref.current.stopTime > wave1Ref.current.lifetime)) {
          wave1Ref.current = null;
        }
      }

      // 2. Update Previous Wave (Wave 2 - Fading out organically at base speed)
      if (wave2Ref.current && wave2Ref.current.stopTime) {
        wave2Ref.current.radius += wave2Ref.current.speed * (dt / 1000);
        const elapsedSinceStop = now - wave2Ref.current.stopTime;
        const progress = elapsedSinceStop / wave2Ref.current.lifetime;
        wave2Ref.current.strength = Math.max(0, 1 - progress);

        if (elapsedSinceStop > wave2Ref.current.lifetime) {
          wave2Ref.current = null;
        }
      }

      // --- Bind WebGL Uniforms ---
      const w1Starts = new Float32Array(16); // 8 vec2s
      const w1Ends = new Float32Array(16); // 8 vec2s
      let w1Count = 0;
      let w1Radius = 0;
      let w1Strength = 0;

      if (wave1Ref.current) {
        w1Count = Math.min(wave1Ref.current.segments.length, 8);
        w1Radius = wave1Ref.current.radius;
        w1Strength = wave1Ref.current.strength;
        for (let i = 0; i < w1Count; i++) {
          const s = wave1Ref.current.segments[i];
          w1Starts[i * 2] = s.startX;
          w1Starts[i * 2 + 1] = s.startY;
          w1Ends[i * 2] = s.endX;
          w1Ends[i * 2 + 1] = s.endY;
        }
      }

      const w2Starts = new Float32Array(16); // 8 vec2s
      const w2Ends = new Float32Array(16); // 8 vec2s
      let w2Count = 0;
      let w2Radius = 0;
      let w2Strength = 0;

      if (wave2Ref.current) {
        w2Count = Math.min(wave2Ref.current.segments.length, 8);
        w2Radius = wave2Ref.current.radius;
        w2Strength = wave2Ref.current.strength;
        for (let i = 0; i < w2Count; i++) {
          const s = wave2Ref.current.segments[i];
          w2Starts[i * 2] = s.startX;
          w2Starts[i * 2 + 1] = s.startY;
          w2Ends[i * 2] = s.endX;
          w2Ends[i * 2 + 1] = s.endY;
        }
      }

      // Update uniforms
      gl.uniform2f(resolutionLoc, canvas.width, canvas.height);
      gl.uniform2f(mouseLoc, mouseRef.current.x, mouseRef.current.y);
      gl.uniform1f(timeLoc, (now - startTime) / 1000);
      gl.uniform1f(dprLoc, dpr);

      // Wave 1
      gl.uniform2fv(wave1StartsLoc, w1Starts);
      gl.uniform2fv(wave1EndsLoc, w1Ends);
      gl.uniform1i(wave1CountLoc, w1Count);
      gl.uniform1f(wave1RadiusLoc, w1Radius);
      gl.uniform1f(wave1StrengthLoc, w1Strength);

      // Wave 2
      gl.uniform2fv(wave2StartsLoc, w2Starts);
      gl.uniform2fv(wave2EndsLoc, w2Ends);
      gl.uniform1i(wave2CountLoc, w2Count);
      gl.uniform1f(wave2RadiusLoc, w2Radius);
      gl.uniform1f(wave2StrengthLoc, w2Strength);

      // Draw quad
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('blur', handleWindowBlur);
      if (parentSection) {
        parentSection.removeEventListener('mousemove', handleMouseMove);
        parentSection.removeEventListener('mouseleave', handleMouseLeave);
      }
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteProgram(program);
      gl.deleteBuffer(buffer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-100"
    />
  );
}
