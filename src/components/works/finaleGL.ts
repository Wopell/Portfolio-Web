/**
 * finaleGL — el fondo de la placa de contacto: un loop de video a pantalla completa,
 * con su color, grano fino y viñeta suave (sin tubo curvo ni líneas de barrido).
 * Detrás del bloque de contacto lo desenfoca el vidrio del bloque (CSS), no el shader.
 *
 * - Cursor: un mapa de flujo (dos texturas que se alternan) guarda la velocidad del
 *   mouse y se va disipando; la imagen se muestrea corrida por ese flujo, así el
 *   video se arrastra detrás del cursor como un líquido; donde el arrastre es fuerte
 *   se rompe en bloques y se separa el color.
 * - Scroll: una ondulación horizontal en la parte de abajo, que sube con la
 *   velocidad del scroll y se calma sola.
 * - Cambio de pieza: la imagen entra en bloques grandes que se resuelven.
 * - Entrada (atada al scroll, `reveal`): el papel de la página se desarma en los
 *   cuadritos de su cuadrícula; cada uno pasa a tinta, a un píxel con el color de la
 *   pieza y a la pieza. Lo que sigue siendo papel queda transparente.
 *
 * WebGL1 puro, sin dependencias. Si no hay WebGL, `createFinaleGL` devuelve null.
 */

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

/* mapa de flujo: velocidad codificada en rg (0.5 = quieto) */
const FLOW_FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uPrev;
uniform vec2 uMouse;
uniform vec2 uVel;
uniform float uAspect;
uniform float uRadius;
uniform float uDissipation;
void main() {
  vec2 v = (texture2D(uPrev, vUv).rg - 0.5) * 2.0 * uDissipation;
  // la textura es de 8 bits: sin este piso, los valores chicos quedan trabados por
  // el redondeo y el video quedaría corrido para siempre
  v = sign(v) * max(abs(v) - 0.006, 0.0);
  vec2 d = vUv - uMouse;
  d.x *= uAspect;
  float f = smoothstep(uRadius, 0.0, length(d));
  v = clamp(v + uVel * f, -1.0, 1.0);
  gl_FragColor = vec4(v * 0.5 + 0.5, 0.0, 1.0);
}`;

const MAIN_FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform sampler2D uFlow;
uniform vec2 uCover;
uniform vec2 uRes;
uniform float uTime;
uniform float uGlitch;
uniform float uRipple;
uniform float uReveal; // entrada: 0 = papel, 1 = la placa entera
uniform float uCell;   // lado de un cuadrito de la cuadrícula, en px del lienzo
uniform vec2 uOff;     // dónde cae el lienzo dentro de la cuadrícula de la página (px, y hacia abajo)

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

vec3 tex(vec2 uv) {
  return texture2D(uTex, (uv - 0.5) * uCover + 0.5).rgb;
}

void main() {
  // entrada: el papel se desarma en sus propios cuadritos (los de la cuadrícula de la
  // página). Cada uno pasa a tinta, después a un píxel grande con el color de la pieza
  // y después a la pieza; primero los del centro, en desorden. Donde todavía es papel,
  // el lienzo es transparente y se ve la página.
  float ph = 1.0;
  vec2 cuv = vUv;
  if (uReveal < 1.0) {
    vec2 pd = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) + uOff;
    vec2 cid = floor(pd / uCell);
    vec2 cc = (cid + 0.5) * uCell - uOff;
    cuv = vec2(cc.x / uRes.x, 1.0 - cc.y / uRes.y);
    float order = 0.55 * hash(cid) + 0.45 * min(1.0, abs(cuv.x - 0.5) * 2.0);
    ph = clamp((uReveal - order * 0.78) / 0.22, 0.0, 1.0);
    if (ph <= 0.0) { gl_FragColor = vec4(0.0); return; }
    if (ph < 0.3) { gl_FragColor = vec4(0.098, 0.082, 0.063, 1.0); return; }
  }
  bool mosaic = ph < 0.65;
  vec2 uv = mosaic ? cuv : vUv;

  // el video arrastrado por el cursor
  vec2 flow = mosaic ? vec2(0.0) : (texture2D(uFlow, vUv).rg - 0.5) * 2.0;
  float fl = length(flow);
  uv -= flow * 0.24;

  // donde el arrastre es fuerte, la imagen se rompe en bloques (video comprimido)
  vec2 cell = uRes / 10.0;
  uv = mix(uv, (floor(uv * cell) + 0.5) / cell, smoothstep(0.12, 0.45, fl));

  // cambio de pieza: bloques grandes que se resuelven en un instante
  float b = floor(1.0 + 44.0 * uGlitch * uGlitch);
  if (b > 1.0) {
    vec2 big = uRes / b;
    uv = (floor(uv * big) + 0.5) / big;
  }

  // ondulación abajo, por el scroll (como un reflejo en el agua)
  float w = smoothstep(0.5, 0.0, vUv.y) * uRipple;
  uv.x += sin(vUv.y * 95.0 + uTime * 7.0) * 0.008 * w;
  uv.y += sin(vUv.x * 38.0 + uTime * 3.0) * 0.004 * w;

  // separación de color: casi nada quieto; fuerte en el arrastre y en el cambio
  vec2 off = (uv - 0.5) * (0.002 + 0.02 * uGlitch) + flow * 0.015;
  vec3 col;
  col.r = tex(uv + off).r;
  col.g = tex(uv).g;
  col.b = tex(uv - off).b;

  // tono: la pieza con su color, un poco más viva
  float l = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(l), col, 1.12);
  col = (col - 0.5) * 1.06 + 0.5;

  // grano fino
  col += (hash(gl_FragCoord.xy + fract(uTime * 7.0) * 91.0) - 0.5) * 0.05;

  // viñeta suave
  vec2 c = vUv - 0.5;
  col *= mix(0.55, 1.0, smoothstep(0.95, 0.3, length(c * vec2(1.0, 1.1))));
  col *= 0.94;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

export interface FinaleGL {
  /** cambia la fuente (video o imagen) y dispara el golpe de señal */
  setSource(el: HTMLVideoElement | HTMLImageElement, glitch?: boolean): void;
  /** posición del puntero en px relativos al canvas; `jump` la mueve sin empujar
   *  (un dedo que se apoya en otro lado no es un arrastre) */
  pointer(x: number, y: number, jump?: boolean): void;
  /** empuje de scroll (px de desplazamiento) */
  scroll(dy: number): void;
  /** entrada: 0 = todo papel (transparente), 1 = la placa entera */
  reveal(p: number): void;
  resize(): void;
  start(): void;
  stop(): void;
  destroy(): void;
}

const compile = (gl: WebGLRenderingContext, type: number, src: string) => {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader');
  return s;
};

const program = (gl: WebGLRenderingContext, frag: string) => {
  const p = gl.createProgram()!;
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, frag));
  gl.bindAttribLocation(p, 0, 'aPos');
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'link');
  return p;
};

const makeTex = (gl: WebGLRenderingContext) => {
  const t = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return t;
};

/** `grid`: el elemento con la cuadrícula de papel (.paper-grid), para que los
 *  cuadritos de la entrada coincidan con los de la página; `cell`: su lado en px CSS */
export function createFinaleGL(canvas: HTMLCanvasElement, grid: Element | null = null, cell = 28): FinaleGL | null {
  // con alfa: mientras entra, lo que todavía es papel es transparente
  const gl = canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: 'low-power' });
  if (!gl) return null;

  let flowProg: WebGLProgram;
  let mainProg: WebGLProgram;
  try {
    flowProg = program(gl, FLOW_FRAG);
    mainProg = program(gl, MAIN_FRAG);
  } catch {
    return null;
  }

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const U = (p: WebGLProgram, n: string) => gl.getUniformLocation(p, n);
  const fu = {
    prev: U(flowProg, 'uPrev'), mouse: U(flowProg, 'uMouse'), vel: U(flowProg, 'uVel'),
    aspect: U(flowProg, 'uAspect'), radius: U(flowProg, 'uRadius'), diss: U(flowProg, 'uDissipation'),
  };
  const mu = {
    tex: U(mainProg, 'uTex'), flow: U(mainProg, 'uFlow'), cover: U(mainProg, 'uCover'),
    res: U(mainProg, 'uRes'), time: U(mainProg, 'uTime'), glitch: U(mainProg, 'uGlitch'), ripple: U(mainProg, 'uRipple'),
    reveal: U(mainProg, 'uReveal'), cell: U(mainProg, 'uCell'), off: U(mainProg, 'uOff'),
  };

  // textura de la pieza (arranca negra de 1px)
  const videoTex = makeTex(gl);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([10, 8, 7]));

  // mapa de flujo: dos texturas + framebuffers que se alternan
  let fw = 160;
  let fh = 90;
  const flowTex = [makeTex(gl), makeTex(gl)];
  const flowFbo = [gl.createFramebuffer()!, gl.createFramebuffer()!];
  const neutral = (w: number, h: number) => {
    const a = new Uint8Array(w * h * 4);
    for (let i = 0; i < a.length; i += 4) { a[i] = 128; a[i + 1] = 128; a[i + 3] = 255; }
    return a;
  };
  const allocFlow = () => {
    const data = neutral(fw, fh);
    for (let i = 0; i < 2; i++) {
      gl.bindTexture(gl.TEXTURE_2D, flowTex[i]);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, fw, fh, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
      gl.bindFramebuffer(gl.FRAMEBUFFER, flowFbo[i]);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, flowTex[i], 0);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  };
  let cur = 0;
  const STEP = 1 / 60;
  let stepAcc = 0;

  let source: HTMLVideoElement | HTMLImageElement | null = null;
  let srcW = 16;
  let srcH = 9;
  let glitch = 0;
  let ripple = 0;
  let reveal = 0;
  let raf = 0;
  let running = false;
  let t0 = performance.now();
  let last = t0;
  // puntero: posición (uv), desplazamiento acumulado desde el último cuadro y
  // velocidad suavizada en uv por segundo (independiente de los fps)
  const mouse = { x: 0.5, y: 0.5, ax: 0, ay: 0, vx: 0, vy: 0, seen: false };

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    const nfh = Math.max(24, Math.round(160 * (h / w)));
    if (nfh !== fh || !flowAllocated) {
      fh = nfh;
      fw = 160;
      allocFlow();
      flowAllocated = true;
    }
  };
  let flowAllocated = false;

  const upload = () => {
    if (!source) return;
    if (source instanceof HTMLVideoElement) {
      if (source.readyState < 2) return; // todavía sin cuadro: queda el anterior
      srcW = source.videoWidth || srcW;
      srcH = source.videoHeight || srcH;
    } else {
      if (!source.complete || !source.naturalWidth) return;
      srcW = source.naturalWidth;
      srcH = source.naturalHeight;
    }
    gl.bindTexture(gl.TEXTURE_2D, videoTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, source);
    } catch {
      /* cuadro no disponible */
    }
  };

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const k = dt * 60; // normalizado a 60 fps

    upload();

    // velocidad del puntero en uv/s, suavizada; el aporte por cuadro escala con dt
    const sec = Math.max(dt, 1 / 240);
    mouse.vx += (mouse.ax / sec - mouse.vx) * Math.min(1, 0.35 * k);
    mouse.vy += (mouse.ay / sec - mouse.vy) * Math.min(1, 0.35 * k);
    mouse.ax = 0;
    mouse.ay = 0;

    // 1. flujo, en pasos fijos de 1/60 s (igual en pantallas de 60, 120 o 240 Hz)
    stepAcc += dt;
    let steps = 0;
    while (stepAcc >= STEP && steps < 3) {
      stepAcc -= STEP;
      steps++;
      const next = 1 - cur;
      gl.bindFramebuffer(gl.FRAMEBUFFER, flowFbo[next]);
      gl.viewport(0, 0, fw, fh);
      gl.useProgram(flowProg);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, flowTex[cur]);
      gl.uniform1i(fu.prev, 0);
      gl.uniform2f(fu.mouse, mouse.x, mouse.y);
      gl.uniform2f(fu.vel, mouse.vx * 0.4, mouse.vy * 0.4);
      gl.uniform1f(fu.aspect, canvas.width / canvas.height);
      gl.uniform1f(fu.radius, 0.2);
      gl.uniform1f(fu.diss, 0.97);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      cur = next;
    }
    if (steps === 3) stepAcc = 0;

    // 2. imagen
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(mainProg);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, videoTex);
    gl.uniform1i(mu.tex, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, flowTex[cur]);
    gl.uniform1i(mu.flow, 1);
    // cubrir el lienzo con la pieza sin deformarla
    const ca = canvas.width / canvas.height;
    const va = srcW / srcH;
    if (ca > va) gl.uniform2f(mu.cover, 1, va / ca);
    else gl.uniform2f(mu.cover, ca / va, 1);
    gl.uniform2f(mu.res, canvas.width, canvas.height);
    // la cuadrícula de la página, vista desde el lienzo (en px del lienzo)
    const k2 = canvas.width / Math.max(1, canvas.clientWidth);
    let ox = 0;
    let oy = 0;
    if (grid && reveal < 1) {
      const a = canvas.getBoundingClientRect();
      const g = grid.getBoundingClientRect();
      ox = a.left - g.left;
      oy = a.top - g.top;
    }
    gl.uniform1f(mu.reveal, reveal);
    gl.uniform1f(mu.cell, cell * k2);
    gl.uniform2f(mu.off, ox * k2, oy * k2);
    gl.uniform1f(mu.time, (now - t0) / 1000);
    gl.uniform1f(mu.glitch, glitch);
    gl.uniform1f(mu.ripple, ripple);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    glitch *= Math.pow(0.92, k);
    if (glitch < 0.01) glitch = 0;
    ripple *= Math.pow(0.95, k);
    if (ripple < 0.01) ripple = 0;
  };

  resize();

  return {
    setSource(el, withGlitch = true) {
      source = el;
      if (withGlitch) glitch = 1;
    },
    pointer(x, y, jump = false) {
      const nx = x / Math.max(1, canvas.clientWidth);
      const ny = 1 - y / Math.max(1, canvas.clientHeight);
      if (mouse.seen && !jump) {
        mouse.ax += nx - mouse.x;
        mouse.ay += ny - mouse.y;
      }
      mouse.x = nx;
      mouse.y = ny;
      mouse.seen = true;
    },
    scroll(dy) {
      ripple = Math.min(1, ripple + Math.abs(dy) / 500);
    },
    reveal(p) {
      reveal = Math.min(1, Math.max(0, p));
    },
    resize,
    start() {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
    destroy() {
      running = false;
      cancelAnimationFrame(raf);
      gl.deleteTexture(videoTex);
      flowTex.forEach((t) => gl.deleteTexture(t));
      flowFbo.forEach((f) => gl.deleteFramebuffer(f));
      gl.deleteBuffer(quad);
      gl.deleteProgram(flowProg);
      gl.deleteProgram(mainProg);
    },
  };
}
