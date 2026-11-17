import React, { useEffect, useRef, useState } from 'react';

/**
 * SplatCanvas — dibuja una imagen como una nube de splats gaussianos (WebGL2).
 *
 * Cada celda de una grilla toma el color promedio de la imagen (mipmap) y se
 * vuelve un punto gaussiano con profundidad según su luminancia. Así la foto
 * se lee entera de frente y, al inclinarla con el mouse, se ve que es volumen.
 *  - Cambio de pieza: ola de izquierda a derecha; los splats se estiran en
 *    estelas, se desarman y se rearman con la imagen nueva.
 *  - `assembleRef` (0..1): 0 = polvo disperso en profundidad, 1 = imagen armada.
 *  - Puntero: la nube gira levemente y los splats bajo el cursor se levantan.
 * Sin WebGL2 cae a un <img> normal.
 */

export interface SplatSource {
  src: string;
  /** punto focal horizontal para el recorte cover (0..1) */
  focusX?: number;
}

interface SplatCanvasProps {
  sources: SplatSource[];
  index: number;
  /** 0..1 leído cada cuadro; por defecto 1 */
  assembleRef?: React.MutableRefObject<number>;
  /** cantidad aproximada de splats en desktop */
  density?: number;
  depth?: number;
  interactive?: boolean;
  /** duración del cambio de pieza en segundos */
  transition?: number;
  className?: string;
  alt?: string;
}

const VS = `#version 300 es
precision highp float;
in vec2 aCell;
in vec4 aSeed;
uniform sampler2D uTexA;
uniform sampler2D uTexB;
uniform vec4 uCoverA;
uniform vec4 uCoverB;
uniform float uLodA;
uniform float uLodB;
uniform float uT;
uniform float uDir;
uniform float uAssemble;
uniform float uTime;
uniform vec2 uRot;
uniform vec3 uMouse;
uniform float uAspect;
uniform float uCellPx;
uniform float uCellW;
uniform float uDepth;
out vec3 vCol;
out float vAlpha;
out vec2 vDir;
out float vStretch;

const float PI = 3.14159265;

void main() {
  vec2 uv = aCell;

  // ola de transición: barre en la dirección del cambio
  float lead = uDir > 0.0 ? uv.x : 1.0 - uv.x;
  float delay = lead * 0.85 + aSeed.w * 0.35;
  float local = clamp(uT * 2.2 - delay, 0.0, 1.0);
  float kT = sin(local * PI);

  vec3 colA = textureLod(uTexA, uv * uCoverA.xy + uCoverA.zw, uLodA).rgb;
  vec3 colB = textureLod(uTexB, uv * uCoverB.xy + uCoverB.zw, uLodB).rgb;
  vec3 col = mix(colA, colB, smoothstep(0.38, 0.62, local));
  float lum = dot(col, vec3(0.299, 0.587, 0.114));

  // 6% más grande que el cuadro: al girar no se ven los bordes
  vec3 p = vec3((uv.x * 2.0 - 1.0) * uAspect * 1.06, (uv.y * 2.0 - 1.0) * 1.06, (lum - 0.5) * uDepth);
  p.xy += (aSeed.xy - 0.5) * uCellW * 0.6;

  // armado desde polvo
  float kA = 1.0 - clamp(uAssemble * 1.6 - aSeed.z * 0.6, 0.0, 1.0);
  kA = kA * kA * (3.0 - 2.0 * kA);
  vec3 rnd = aSeed.xyz * 2.0 - 1.0;
  p += vec3(rnd.x * 1.4, rnd.y * 1.1, rnd.z * 2.6 + 0.6) * kA;

  // estela de la transición
  p += vec3(uDir * (0.15 + aSeed.x * 0.6), (aSeed.y - 0.5) * 0.25, (aSeed.z - 0.35) * 1.2) * kT * kT;

  // respiración
  p.z += sin(uTime * 1.3 + aSeed.w * 31.0) * 0.012;

  // puntero: levanta los splats cercanos
  vec2 d = p.xy - uMouse.xy;
  float m = exp(-dot(d, d) / 0.035) * uMouse.z;
  p.z += m * 0.55;
  p.xy += normalize(d + 1e-4) * m * 0.05;

  // giro (yaw / pitch)
  float cy = cos(uRot.x), sy = sin(uRot.x);
  p = vec3(p.x * cy + p.z * sy, p.y, -p.x * sy + p.z * cy);
  float cp = cos(uRot.y), sp = sin(uRot.y);
  p = vec3(p.x, p.y * cp - p.z * sp, p.y * sp + p.z * cp);

  float D = 3.2;
  float s = D / max(D - p.z, 0.35);
  gl_Position = vec4(p.x / uAspect * s, p.y * s, 0.0, 1.0);

  // en reposo cada splat es una elipse con orientación propia (look de splat
  // gaussiano); en movimiento se alinea con la estela y se alarga
  float rest = 1.0 + aSeed.w * 0.9;
  float moving = clamp(kT * 1.4 + kA, 0.0, 1.0);
  float stretch = mix(rest, 1.0 + kT * 3.2 + kA * 1.5, moving);
  vStretch = stretch;
  float ang = aSeed.z * 6.2831;
  vec2 restDir = vec2(cos(ang), sin(ang));
  vec2 moveDir = normalize(vec2(uDir * (1.0 - kA) + rnd.x * kA, (aSeed.y - 0.5) * 0.4 + rnd.y * kA));
  vDir = normalize(mix(restDir, moveDir, moving));
  gl_PointSize = min(uCellPx * 2.9 * s * stretch, 256.0);
  vCol = col;
  vAlpha = 1.0 - kA * 0.55;
}
`;

const FS = `#version 300 es
precision highp float;
in vec3 vCol;
in float vAlpha;
in vec2 vDir;
in float vStretch;
out vec4 o;
void main() {
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float a = dot(q, vDir);
  float b = dot(q, vec2(-vDir.y, vDir.x));
  float r2 = a * a + b * b * vStretch * vStretch;
  float alpha = exp(-r2 * 3.4) * vAlpha;
  if (alpha < 0.012) discard;
  o = vec4(vCol * alpha, alpha);
}
`;

type Tex = { tex: WebGLTexture; w: number; h: number };

const compile = (gl: WebGL2RenderingContext, type: number, src: string) => {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) || 'shader');
  return sh;
};

const reduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const SplatCanvas: React.FC<SplatCanvasProps> = ({
  sources,
  index,
  assembleRef,
  density = 42000,
  depth = 0.38,
  interactive = true,
  transition = 1.6,
  className = '',
  alt = '',
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fallback, setFallback] = useState(false);

  /* estado compartido con el loop (no re-renderiza React) */
  const live = useRef({
    from: index,
    to: index,
    t: 1,
    dir: 1,
    want: index,
    sources,
  });
  live.current.sources = sources;

  useEffect(() => {
    const L = live.current;
    if (index === L.want) return;
    const n = L.sources.length;
    const fwd = (index - L.want + n) % n;
    L.dir = fwd <= n / 2 ? 1 : -1;
    L.from = L.t > 0.5 ? L.to : L.from;
    L.to = index;
    L.want = index;
    L.t = reduced() ? 1 : 0;
  }, [index]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const gl = canvas.getContext('webgl2', { premultipliedAlpha: true, antialias: false, alpha: true });
    if (!gl) {
      setFallback(true);
      return;
    }

    let prog: WebGLProgram;
    try {
      prog = gl.createProgram()!;
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VS));
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) || 'link');
    } catch (e) {
      console.error('[SplatCanvas]', e);
      setFallback(true);
      return;
    }
    gl.useProgram(prog);
    const U = (n: string) => gl.getUniformLocation(prog, n);
    const u = {
      texA: U('uTexA'),
      texB: U('uTexB'),
      coverA: U('uCoverA'),
      coverB: U('uCoverB'),
      lodA: U('uLodA'),
      lodB: U('uLodB'),
      t: U('uT'),
      dir: U('uDir'),
      assemble: U('uAssemble'),
      time: U('uTime'),
      rot: U('uRot'),
      mouse: U('uMouse'),
      aspect: U('uAspect'),
      cellPx: U('uCellPx'),
      cellW: U('uCellW'),
      depth: U('uDepth'),
    };
    gl.uniform1i(u.texA, 0);
    gl.uniform1i(u.texB, 1);

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const cellBuf = gl.createBuffer();
    const seedBuf = gl.createBuffer();
    const aCell = gl.getAttribLocation(prog, 'aCell');
    const aSeed = gl.getAttribLocation(prog, 'aSeed');

    let count = 0;
    let gw = 1;
    let gh = 1;
    const buildGrid = (aspect: number) => {
      const n = window.innerWidth < 640 ? density * 0.5 : density;
      gw = Math.max(8, Math.round(Math.sqrt(n * aspect)));
      gh = Math.max(8, Math.round(gw / aspect));
      count = gw * gh;
      const cells = new Float32Array(count * 2);
      const seeds = new Float32Array(count * 4);
      let k = 0;
      for (let y = 0; y < gh; y++)
        for (let x = 0; x < gw; x++, k++) {
          cells[k * 2] = (x + 0.5) / gw;
          cells[k * 2 + 1] = (y + 0.5) / gh;
          seeds[k * 4] = Math.random();
          seeds[k * 4 + 1] = Math.random();
          seeds[k * 4 + 2] = Math.random();
          seeds[k * 4 + 3] = Math.random();
        }
      gl.bindBuffer(gl.ARRAY_BUFFER, cellBuf);
      gl.bufferData(gl.ARRAY_BUFFER, cells, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(aCell);
      gl.vertexAttribPointer(aCell, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, seedBuf);
      gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(aSeed);
      gl.vertexAttribPointer(aSeed, 4, gl.FLOAT, false, 0, 0);
    };

    /* texturas: se cargan a demanda y quedan en caché */
    const texCache = new Map<string, Tex | 'loading'>();
    const blank = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, blank);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([11, 10, 8, 255]));
    const getTex = (src: string): Tex | null => {
      const c = texCache.get(src);
      if (c && c !== 'loading') return c;
      if (!c) {
        texCache.set(src, 'loading');
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => {
          if (disposed) return;
          const tex = gl.createTexture()!;
          gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
          gl.generateMipmap(gl.TEXTURE_2D);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          texCache.set(src, { tex, w: img.naturalWidth, h: img.naturalHeight });
        };
        img.onerror = () => texCache.delete(src);
        img.src = src;
      }
      return null;
    };

    const bindSlot = (slot: number, i: number, coverLoc: WebGLUniformLocation | null, lodLoc: WebGLUniformLocation | null, aspect: number) => {
      const s = live.current.sources[i];
      const t = s ? getTex(s.src) : null;
      gl.activeTexture(slot === 0 ? gl.TEXTURE0 : gl.TEXTURE1);
      if (!t) {
        gl.bindTexture(gl.TEXTURE_2D, blank);
        gl.uniform4f(coverLoc, 1, 1, 0, 0);
        gl.uniform1f(lodLoc, 0);
        return false;
      }
      gl.bindTexture(gl.TEXTURE_2D, t.tex);
      const ia = t.w / t.h;
      let sx = 1;
      let sy = 1;
      if (ia > aspect) sx = aspect / ia;
      else sy = ia / aspect;
      const fx = s.focusX ?? 0.5;
      gl.uniform4f(coverLoc, sx, sy, (1 - sx) * fx, (1 - sy) * 0.5);
      gl.uniform1f(lodLoc, Math.max(0, Math.log2((t.w * sx) / gw) - 0.4));
      return true;
    };

    /* tamaño */
    let W = 0;
    let H = 0;
    let aspect = 16 / 9;
    const resize = () => {
      const r = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(1, Math.round(r.width * dpr));
      H = Math.max(1, Math.round(r.height * dpr));
      canvas.width = W;
      canvas.height = H;
      const a = r.width / Math.max(1, r.height);
      if (Math.abs(a - aspect) > 0.01 || count === 0) {
        aspect = a;
        buildGrid(aspect);
      }
      gl.viewport(0, 0, W, H);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    /* puntero */
    const ptr = { x: 0, y: 0, in: 0, tx: 0, ty: 0, strength: 0, yaw: 0, pitch: 0 };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const r = canvas.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
      const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
      ptr.tx = nx;
      ptr.ty = ny;
      ptr.in = 1;
    };
    const onLeave = () => {
      ptr.in = 0;
      ptr.tx = 0;
      ptr.ty = 0;
    };
    // se escucha en el padre: los overlays (HUD, botón) son hermanos del canvas
    const host = wrap.parentElement ?? wrap;
    if (interactive) {
      host.addEventListener('pointermove', onMove);
      host.addEventListener('pointerleave', onLeave);
    }

    /* visibilidad */
    let visible = true;
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(frame);
    });
    io.observe(wrap);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    let disposed = false;
    let raf = 0;
    let last = performance.now();
    const still = reduced();
    const frame = (now: number) => {
      raf = 0;
      if (disposed || !visible) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const L = live.current;
      if (L.t < 1) L.t = Math.min(1, L.t + dt / transition);

      const k = 1 - Math.pow(0.0015, dt);
      ptr.x += (ptr.tx - ptr.x) * k;
      ptr.y += (ptr.ty - ptr.y) * k;
      ptr.strength += (ptr.in - ptr.strength) * k;
      const sway = still ? 0 : Math.sin(now * 0.00028) * 0.05;
      ptr.yaw = still ? 0 : ptr.x * 0.24 + sway * (1 - ptr.strength);
      ptr.pitch = still ? 0 : ptr.y * 0.16;

      const okA = bindSlot(0, L.from, u.coverA, u.lodA, aspect);
      const okB = bindSlot(1, L.to, u.coverB, u.lodB, aspect);
      // si la imagen destino todavía no cargó, la transición espera
      if (!okB && L.t > 0.3) L.t = 0.3;

      gl.uniform1f(u.t, okA || L.t > 0 ? L.t : 1);
      gl.uniform1f(u.dir, L.dir);
      const asm = assembleRef ? assembleRef.current : 1;
      gl.uniform1f(u.assemble, okB || okA ? (still ? 1 : asm) : 0);
      gl.uniform1f(u.time, still ? 0 : now / 1000);
      gl.uniform2f(u.rot, ptr.yaw, ptr.pitch);
      gl.uniform3f(u.mouse, ptr.x * aspect, -ptr.y, still ? 0 : ptr.strength);
      gl.uniform1f(u.aspect, aspect);
      gl.uniform1f(u.cellPx, H / gh);
      gl.uniform1f(u.cellW, 2 / gh);
      gl.uniform1f(u.depth, depth);

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.POINTS, 0, count);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    // precarga de todas las fuentes en segundo plano
    const pre = window.setTimeout(() => live.current.sources.forEach((s) => getTex(s.src)), 600);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(pre);
      ro.disconnect();
      io.disconnect();
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerleave', onLeave);
      texCache.forEach((t) => t !== 'loading' && gl.deleteTexture(t.tex));
      gl.deleteTexture(blank);
      gl.deleteBuffer(cellBuf);
      gl.deleteBuffer(seedBuf);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(prog);
    };
    // la grilla y el programa se arman una vez; las fuentes viajan por `live`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [density, depth, interactive, transition]);

  const current = sources[index];
  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      {fallback ? (
        <img src={current?.src} alt={alt} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <>
          <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />
          {alt && <span className="sr-only">{alt}</span>}
        </>
      )}
    </div>
  );
};
