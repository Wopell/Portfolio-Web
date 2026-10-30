import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import * as topojson from 'topojson-client';
import { geoEquirectangular, geoPath } from 'd3-geo';
import landTopology from 'world-atlas/land-110m.json';
import { WORKS } from '../data/works.js';

/**
 * =========================================================================
 * CONFIGURACIÓN CENTRALIZADA: PLANET HERO (FASE 6 - PULIDO FINAL & ENDURECIDO)
 * =========================================================================
 * Todos los parámetros del sistema agrupados y comentados en español.
 * Incluye rangos recomendados, unidades y explicación de cada variable.
 */
export const CONFIG = {
  // --- 1. PLANETA Y GEOMETRÍA ---
  refRadius: 350,          // Radio de referencia en px para escalado (rango: 250 - 450)
  ratioDesktop: 0.275,     // Proporción del diámetro en desktop (~55% de 1280px)
  ratioMobile: 0.390,      // Proporción del diámetro en mobile (~78% de ancho de pantalla)
  canvasWidthBase: 860,    // Ancho base del canvas en desktop (px)
  canvasHeightBase: 740,   // Alto base del canvas en desktop (px)
  radius: 350,             // Radio por defecto en reposo (px)
  canvasWidth: 860,        // Ancho por defecto (px)
  canvasHeight: 740,       // Alto por defecto (px)

  // --- 2. DIRECCIÓN DE LUZ FIJA ---
  light: [-0.6, -0.7, 0.5], // Vector 3D normalizado de luz (arriba-izquierda-frente)

  // --- 3. PUNTOS FIBONACCI Y SEMITONO ---
  pointsDesktop: 18000,    // Cantidad de puntos en desktop (~9000 en hemisferio visible)
  pointsMobile: 12000,     // Cantidad de puntos en mobile (12000 para definición nítida sin espiral)
  points: 18000,           // Alias retrocompatible
  minDotRadius: 0.55,      // Radio mínimo de punto en océano iluminado (0.3 - 1.0 px)
  maxDotRadius: 4.8,       // Radio máximo de punto en tierra en sombra (3.5 - 6.0 px)
  landMinScale: 0.55,      // Escala de tierra iluminada respecto al máximo (0.4 - 0.7)
  landWeight: 0.70,        // Peso de tierra en el tono para contraste continental (0.6 - 0.8)
  contrast: 1.25,          // Exponente gamma de contraste de tono
  oceanShadowMax: 0.40,    // Techo del mar en sombra respecto al máximo (0.25 - 0.5)
  minOceanRadiusCss: 0.55, // Piso absoluto en CSS px para que el océano nunca desaparezca (0.55px)
  shadowContrast: 1.6,     // Exponente gamma de la curva de sombra (1.2 - 2.2)
  shadowWeight: 0.55,      // Peso global de sombreado
  limbDarken: 0.05,        // Atenuación sutil en el limbo
  jitter: 0.35,            // Jitter tangencial escalado con espaciado medio sqrt(4*PI/N) (aprobado: 0.35)
  backOpacity: 0.0,        // Opacidad del hemisferio trasero (0.0 = descartado)
  dotColor: '#111111',     // Color de los puntos de semitono
  discColor: '#efece1',    // Color crema opaco del disco para oclusión (== --color-paper)
  backgroundColor: 'transparent',

  // --- 4. ROTACIÓN Y TIEMPO ---
  axisTilt: 23.5,          // Inclinación axial terrestre en grados (eje Z de pantalla)
  initialLon: 22,          // Longitud inicial (22°E centrando África y Europa)
  spinPeriod: 40,          // Segundos por vuelta completa en reposo (25 - 60 s)
  maxDeltaTime: 0.05,      // Límite máximo de dt por frame para evitar saltos (s)

  // --- 5. ÓRBITAS DE ETIQUETAS ---
  orbitRadius: 1.4,        // Multiplicador base del radio orbital
  orbitPeriods: [34, 24, 28, 36], // Períodos en segundos para cada etiqueta
  orbitTilts: [
    { tiltX: (62 * Math.PI) / 180, tiltZ: (-22 * Math.PI) / 180 }, // Editorial Design
    { tiltX: (-65 * Math.PI) / 180, tiltZ: (18 * Math.PI) / 180 },  // Social Media
    { tiltX: (-55 * Math.PI) / 180, tiltZ: (-26 * Math.PI) / 180 }, // Branding
    { tiltX: (68 * Math.PI) / 180, tiltZ: (-16 * Math.PI) / 180 },  // Event Graphics
  ],
  labelScaleFront: 1.10,   // Escala de etiqueta al frente (1.05 - 1.25)
  labelScaleBack: 0.75,    // Escala de etiqueta al fondo (0.60 - 0.85)
  labelOpacityBack: 0.55,  // Opacidad mínima al fondo (0.40 - 0.70)
  labelBlurBack: 1.0,      // Desenfoque al fondo en px (0.5 - 2.0)

  // --- 6. ÓRBITAS DE CÍRCULOS (PREVIEWS DE TRABAJOS) ---
  circleSizeDesktop: 90,   // Diámetro de círculo en desktop (70 - 110 px)
  circleSizeTablet: 76,    // Diámetro de círculo en tablet (65 - 85 px)
  circleSizeMobile: 64,    // Diámetro de círculo en mobile (50 - 70 px)
  circleScaleFront: 1.15,  // Escala del círculo al frente (1.05 - 1.30)
  circleScaleBack: 0.70,   // Escala del círculo al fondo (0.60 - 0.80)
  circleOpacityBack: 0.55, // Opacidad mínima del círculo al fondo (0.40 - 0.70)
  circleBlurBack: 1.2,     // Desenfoque máximo al fondo en px (0.5 - 2.5)
  hoverScale: 1.20,        // Escala adicional en hover (1.1 - 1.3)
  hoverSlowdown: 0.3,      // Segundos para desacelerar a velocidad 0 en hover (0.2 - 0.5)
  circleBorderColor: '#2F6F6B', // Borde teal oscuro de 3px
  circleOrbits: [
    {
      id: 'work-1',
      radiusMultiplier: 1.65,
      period: 38,
      initialPhase: 0.75,
      tiltX: (-48 * Math.PI) / 180,
      tiltZ: (32 * Math.PI) / 180,
      direction: 1,
      scaleFront: 1.15,
      scaleBack: 0.70,
      opacityBack: 0.55,
      blurBack: 1.2,
    },
    {
      id: 'work-2',
      radiusMultiplier: 1.38,
      period: 30,
      initialPhase: 3.00,
      tiltX: (52 * Math.PI) / 180,
      tiltZ: (22 * Math.PI) / 180,
      direction: -1,
      scaleFront: 1.15,
      scaleBack: 0.70,
      opacityBack: 0.55,
      blurBack: 1.2,
    },
    {
      id: 'work-3',
      radiusMultiplier: 1.70,
      period: 42,
      initialPhase: 5.50,
      tiltX: (-58 * Math.PI) / 180,
      tiltZ: (-38 * Math.PI) / 180,
      direction: 1,
      scaleFront: 1.15,
      scaleBack: 0.70,
      opacityBack: 0.55,
      blurBack: 1.2,
    },
    {
      id: 'work-4',
      radiusMultiplier: 1.45,
      period: 26,
      initialPhase: 1.00,
      tiltX: (44 * Math.PI) / 180,
      tiltZ: (-28 * Math.PI) / 180,
      direction: -1,
      scaleFront: 1.15,
      scaleBack: 0.70,
      opacityBack: 0.55,
      blurBack: 1.2,
    },
  ],

  // --- 7. FÍSICA REACTIVA DEL CURSOR (CURSORFX) ---
  cursorFx: {
    refRadius: 350,        // Radio de referencia para escalado responsive (px)
    staticRadius: 65.0,    // Radio de influencia del imán estático (50 - 85 px)
    pullStrength: 7.5,     // Fuerza máxima de atracción del imán (4.0 - 12.0 px)
    staticSwell: 0.06,     // Crecimiento relativo sutil en reposo (+6%, ReactiveHalftone)
    swellMax: 0.10,        // Crecimiento máximo permitido en cresta (+10%, ReactiveHalftone)
    baseOpacity: 1.0,      // Opacidad base en reposo (idéntica a fases previas)
    litTone: 0.85,         // Tono máximo al encenderse bajo el cursor (0.75 - 0.95)
    minSegmentDist: 15.0,  // Distancia mínima en px para añadir segmento al trazo (10 - 25 px)
    segmentInterval: 60,   // Intervalo mínimo en ms entre segmentos (40 - 90 ms)
    restThreshold: 180,    // Inactividad en ms para volver a reposo (140 - 220 ms)
    mouseLerp: 0.08,       // Factor de suavizado lerp del cursor (0.05 - 0.15)
    waveSpeed: 110.0,      // Velocidad base de expansión de la onda (80 - 160 px/s)
    waveSpeedMax: 380.0,   // Velocidad máxima con aceleración de proximidad (250 - 500 px/s)
    waveLifetime: 2400,    // Duración de vida de la onda histórica en ms (1800 - 3200 ms)
    waveWidthMin: 6.0,     // Ancho mínimo inicial de cresta de onda (4 - 10 px)
    waveWidthMax: 35.0,    // Ancho máximo expandido de cresta (25 - 50 px)
    centerFade: 12.0,      // Radio de atenuación en el núcleo del trazo (10 - 20 px)
    warpMax: 10.0,         // Límite de deformación en espacio de pantalla (10.0 px aprobado, escalado por R/350)
    radiusOffsetMax: 22.5, // Amplitud del rizado fractal orgánico (15 - 35 px)
    maxSegments: 8,        // Tamaño máximo de la cola FIFO de segmentos (4 - 12)
    turbulenceScale: 0.045,// Frecuencia espacial del ruido fBm (0.02 - 0.08)
    turbulenceSpeed: 0.6,  // Velocidad de evolución temporal del ruido (0.3 - 1.0)
  },

  // --- 8. INTERACCIÓN Y PARALLAX ---
  tiltMax: 10,             // Inclinación máxima por parallax en grados (5 - 15°)
  spinBoostMax: 1.6,       // Multiplicador máximo de giro por cercanía (< 1.3*R)
  dragDamping: 0.95,       // Amortiguación de inercia tras soltar drag (0.90 - 0.98)
  parallaxMax: 12,         // Desplazamiento parallax opuesto en px (8 - 20 px)
  orbitPushMax: 0.15,      // Empuje máximo a la velocidad orbital por swipe (±15%)
  keyboardRotateStep: 0.15,// Rotación en radianes por pulsación de flechas (~8.6°)

  // --- 9. RENDIMIENTO Y AUTO-OPTIMIZACIÓN ---
  targetFPS: 60,           // Objetivo de fotogramas por segundo
  fpsLowThreshold: 50,     // Umbral de FPS para activar auto-reducción
  fpsEvalDuration: 2.0,    // Segundos continuos bajo umbral requeridos para auto-reducción
  pointsReductionRatio: 0.75, // Proporción de puntos activos tras auto-reducción (75%)

  // --- 10. RESPONSIVE Y LÍMITES ---
  breakpointDesktop: 1024, // Breakpoint para modo desktop completo (px)
  breakpointTablet: 640,   // Breakpoint para tablet (640px a 1023px, ej. 768px)
  mobileHorizontalMargin: 16, // Margen horizontal mínimo para órbitas en mobile (px)
};

export interface WorkItem {
  id?: string;
  categoryNumber?: string;
  src: string;
  placeholder?: string;
  title: string;
  url: string;
}

export { WORKS };

export interface OrbitItem {
  id?: string;
  text?: string;
  radiusMultiplier: number;
  period: number;
  initialPhase: number;
  tiltX: number;
  tiltZ: number;
  direction: number;
  scaleFront?: number;
  scaleBack?: number;
  opacityBack?: number;
  blurBack?: number;
}

export interface OrbitProjection {
  x: number;
  y: number;
  z: number;
  zNorm: number;
  scale: number;
  opacity: number;
  blur: number;
}

export const ORBIT_LABELS: OrbitItem[] = [
  {
    id: 'editorial-design',
    text: 'Editorial Design',
    radiusMultiplier: 1.54,
    period: CONFIG.orbitPeriods[0],
    initialPhase: Math.PI,
    tiltX: CONFIG.orbitTilts[0].tiltX,
    tiltZ: CONFIG.orbitTilts[0].tiltZ,
    direction: 1,
  },
  {
    id: 'social-media',
    text: 'Social Media',
    radiusMultiplier: 1.30,
    period: CONFIG.orbitPeriods[1],
    initialPhase: Math.PI * 0.5,
    tiltX: CONFIG.orbitTilts[1].tiltX,
    tiltZ: CONFIG.orbitTilts[1].tiltZ,
    direction: 1,
  },
  {
    id: 'branding',
    text: 'Branding',
    radiusMultiplier: 1.48,
    period: CONFIG.orbitPeriods[2],
    initialPhase: 0,
    tiltX: CONFIG.orbitTilts[2].tiltX,
    tiltZ: CONFIG.orbitTilts[2].tiltZ,
    direction: -1,
  },
  {
    id: 'event-graphics',
    text: 'Event Graphics',
    radiusMultiplier: 1.38,
    period: CONFIG.orbitPeriods[3],
    initialPhase: Math.PI * 1.5,
    tiltX: CONFIG.orbitTilts[3].tiltX,
    tiltZ: CONFIG.orbitTilts[3].tiltZ,
    direction: 1,
  },
];

export function projectOrbit(
  orbit: OrbitItem,
  time: number,
  planetRadius: number = CONFIG.radius,
  out?: OrbitProjection
): OrbitProjection {
  const orbitRadius = orbit.radiusMultiplier * planetRadius;
  const angularSpeed = ((2 * Math.PI) / orbit.period) * orbit.direction;
  const angle = orbit.initialPhase + angularSpeed * time;

  const x0 = orbitRadius * Math.cos(angle);
  const y0 = orbitRadius * Math.sin(angle);

  const cosX = Math.cos(orbit.tiltX);
  const sinX = Math.sin(orbit.tiltX);
  const x1 = x0;
  const y1 = y0 * cosX;
  const z1 = -y0 * sinX;

  const cosZ = Math.cos(orbit.tiltZ);
  const sinZ = Math.sin(orbit.tiltZ);
  const x2 = x1 * cosZ - y1 * sinZ;
  const y2 = x1 * sinZ + y1 * cosZ;
  const z2 = z1;

  const zNorm = Math.max(-1, Math.min(1, z2 / orbitRadius));

  const scaleFront = orbit.scaleFront ?? CONFIG.labelScaleFront;
  const scaleBack = orbit.scaleBack ?? CONFIG.labelScaleBack;
  const opacityBack = orbit.opacityBack ?? CONFIG.labelOpacityBack;
  const blurBack = orbit.blurBack ?? CONFIG.labelBlurBack;

  let scale: number;
  let opacity: number;
  let blur: number;

  if (zNorm >= 0) {
    const t = zNorm;
    const s = t * t * (3 - 2 * t);
    scale = 1.0 + (scaleFront - 1.0) * s;
    opacity = 1.0;
    blur = 0;
  } else {
    const t = -zNorm;
    const s = t * t * (3 - 2 * t);
    scale = 1.0 - (1.0 - scaleBack) * s;
    opacity = 1.0 - (1.0 - opacityBack) * s;
    blur = blurBack * s;
  }

  if (out) {
    out.x = x2;
    out.y = y2;
    out.z = z2;
    out.zNorm = zNorm;
    out.scale = scale;
    out.opacity = opacity;
    out.blur = blur;
    return out;
  }

  return { x: x2, y: y2, z: z2, zNorm, scale, opacity, blur };
}

// Generador pseudo-aleatorio determinista con dispersión de bits (SplitMix32)
// Evita resonancias armónicas con la razón áurea que causan bandas diagonales en Fibonacci.
function hashInt(n: number, seed: number = 0): number {
  let h = (n ^ seed) + 0x9e3779b9 | 0;
  h = Math.imul(h ^ (h >>> 16), 0x21f0aaad);
  h = Math.imul(h ^ (h >>> 15), 0x735a2d97);
  return ((h = h ^ (h >>> 15)) >>> 0) / 4294967296;
}

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// Singleton de caché para la máscara de tierra 2048x1024
let cachedMaskData: Uint8ClampedArray | null = null;

function getLandMaskData2048(): Uint8ClampedArray | null {
  if (cachedMaskData) return cachedMaskData;
  if (typeof document === 'undefined') return null;

  const width = 2048;
  const height = 1024;
  const offscreen = document.createElement('canvas');
  offscreen.width = width;
  offscreen.height = height;
  const ctx = offscreen.getContext('2d');
  if (!ctx) return null;

  const projection = geoEquirectangular()
    .translate([width / 2, height / 2])
    .scale(width / (2 * Math.PI));

  const pathGenerator = geoPath(projection, ctx);
  const geojson = topojson.feature(
    landTopology as unknown as Parameters<typeof topojson.feature>[0],
    landTopology.objects.land as unknown as Parameters<typeof topojson.feature>[1]
  );

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  pathGenerator(geojson);
  ctx.fill();

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const blurred = new Uint8ClampedArray(data.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let count = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const nx = (x + dx + width) % width;
          sum += data[(ny * width + nx) * 4];
          count++;
        }
      }
      const val = sum / count;
      const idx = (y * width + x) * 4;
      blurred[idx] = val;
      blurred[idx + 1] = val;
      blurred[idx + 2] = val;
      blurred[idx + 3] = 255;
    }
  }

  cachedMaskData = blurred;
  return blurred;
}

function sampleLand2048(maskData: Uint8ClampedArray, lonDeg: number, latDeg: number): number {
  const width = 2048;
  const height = 1024;

  let u = (lonDeg + 180) / 360;
  u = (u % 1 + 1) % 1;
  const v = Math.max(0, Math.min(1, (90 - latDeg) / 180));

  const x = u * (width - 1);
  const y = v * (height - 1);

  const x0 = Math.floor(x);
  const x1 = (x0 + 1) % width;
  const y0 = Math.floor(y);
  const y1 = Math.min(height - 1, y0 + 1);

  const fx = x - x0;
  const fy = y - y0;

  const idx00 = (y0 * width + x0) * 4;
  const idx10 = (y0 * width + x1) * 4;
  const idx01 = (y1 * width + x0) * 4;
  const idx11 = (y1 * width + x1) * 4;

  const v00 = maskData[idx00] / 255;
  const v10 = maskData[idx10] / 255;
  const v01 = maskData[idx01] / 255;
  const v11 = maskData[idx11] / 255;

  const top = (1 - fx) * v00 + fx * v10;
  const bot = (1 - fx) * v01 + fx * v11;
  return (1 - fy) * top + fy * bot;
}

// Generador de distribución esférica de Fibonacci con jitter tangencial determinista
// y muestreo bilineal de geografía terrestre para cualquier cantidad N de puntos.
function buildSpherePoints(N: number, maskData: Uint8ClampedArray) {
  const phiGolden = Math.PI * (3 - Math.sqrt(5));
  const positions3D = new Float32Array(N * 3);
  const isLand = new Float32Array(N);
  const rJitter = new Float32Array(N);
  const baseX = new Float32Array(N);
  const baseY = new Float32Array(N);
  const baseZ = new Float32Array(N);

  // Espaciado medio en la esfera unitaria: sqrt(4*PI / N)
  // En pantalla: jitterPx = CONFIG.jitter * espaciadoMedioPx
  const meanSpacing = Math.sqrt((4 * Math.PI) / N);
  const jitterMag = CONFIG.jitter * meanSpacing;

  for (let i = 0; i < N; i++) {
    // Fórmula esférica de Fibonacci: y = 1 - 2*(i + 0.5)/N, theta = i * phiGolden
    const y0 = 1 - (2 * (i + 0.5)) / N;
    const radiusAtY = Math.sqrt(Math.max(0, 1 - y0 * y0));
    const theta0 = phiGolden * i;

    const x0 = Math.sin(theta0) * radiusAtY;
    const z0 = Math.cos(theta0) * radiusAtY;

    // Base ortonormal tangente (t1, t2) para dispersión tangencial sobre la esfera
    let upX = 0, upY = 1, upZ = 0;
    if (Math.abs(y0) > 0.99) {
      upX = 1; upY = 0; upZ = 0;
    }
    // t1 = normalize(up x v0)
    let t1x = upY * z0 - upZ * y0;
    let t1y = upZ * x0 - upX * z0;
    let t1z = upX * y0 - upY * x0;
    const lenT1 = Math.hypot(t1x, t1y, t1z);
    t1x /= lenT1; t1y /= lenT1; t1z /= lenT1;

    // t2 = v0 x t1
    const t2x = y0 * t1z - z0 * t1y;
    const t2y = z0 * t1x - x0 * t1z;
    const t2z = x0 * t1y - y0 * t1x;

    const rand1 = hashInt(i, 1013);
    const rand2 = hashInt(i, 2027);
    const rand3 = hashInt(i, 3037);

    const j1 = (rand1 - 0.5) * jitterMag;
    const j2 = (rand2 - 0.5) * jitterMag;

    let px = x0 + j1 * t1x + j2 * t2x;
    let py = y0 + j1 * t1y + j2 * t2y;
    let pz = z0 + j1 * t1z + j2 * t2z;
    const lenP = Math.hypot(px, py, pz);
    px /= lenP; py /= lenP; pz /= lenP;

    baseX[i] = px;
    baseY[i] = py;
    baseZ[i] = pz;

    positions3D[i * 3] = px;
    positions3D[i * 3 + 1] = py;
    positions3D[i * 3 + 2] = pz;

    const latRad = Math.asin(Math.max(-1, Math.min(1, py)));
    const latDeg = (latRad * 180) / Math.PI;
    const lonRad = Math.atan2(px, pz);
    const lonDeg = (lonRad * 180) / Math.PI;

    isLand[i] = sampleLand2048(maskData, lonDeg, latDeg);
    rJitter[i] = 1 + (rand3 - 0.5) * 0.08;
  }

  return { positions3D, isLand, rJitter, baseX, baseY, baseZ };
}

export interface WaveSegment {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface WaveState {
  segments: WaveSegment[];
  radius: number;
  speed: number;
  strength: number;
  startTime: number;
  stopTime?: number;
  lifetime: number;
}

export interface PlanetHeroHandle {
  getSpinAngle: () => number;
  setSpinMultiplier: (multiplier: number) => void;
  getPlanetMetrics: () => { cx: number; cy: number; radius: number };
}

// Posiciones fijas armónicas para prefers-reduced-motion (Bloque 5)
const REDUCED_MOTION_LABELS = [
  { xNorm: -1.45, yNorm: 0.15, zNorm: 0.5 },  // Editorial Design (izq)
  { xNorm: 0.00,  yNorm: 1.35, zNorm: 0.8 },  // Social Media (arr)
  { xNorm: 1.45,  yNorm: -0.15, zNorm: 0.5 }, // Branding (der)
  { xNorm: 0.00,  yNorm: -1.35, zNorm: 0.8 }, // Event Graphics (abj)
];

const REDUCED_MOTION_CIRCLES = [
  { xNorm: 1.25,  yNorm: 0.90, zNorm: 0.6 },  // 001 Animation (arr-der)
  { xNorm: -1.25, yNorm: -0.90, zNorm: 0.6 }, // 002 3D Art (abj-izq)
  { xNorm: 1.20,  yNorm: -0.85, zNorm: 0.6 }, // 003 IA (abj-der)
  { xNorm: -1.20, yNorm: 0.85, zNorm: 0.6 },  // 004 Post Production (arr-izq)
];

const getEffectiveDpr = (isMobile: boolean): number => {
  if (typeof window === 'undefined') return 1;
  const rawDpr = window.devicePixelRatio || 1;
  return Math.min(rawDpr, isMobile ? 2.0 : 1.5);
};

export const PlanetHero = forwardRef<PlanetHeroHandle, object>(function PlanetHero(_, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const debugCanvasRef = useRef<HTMLCanvasElement>(null);
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const circleRefs = useRef<(HTMLElement | null)[]>([]);

  // Estados responsivos dinámicos
  const currentRadiusRef = useRef<number>(CONFIG.radius);
  const canvasWidthRef = useRef<number>(CONFIG.canvasWidth);
  const canvasHeightRef = useRef<number>(CONFIG.canvasHeight);
  const activePointsCountRef = useRef<number>(CONFIG.pointsDesktop);
  const circleSizeRef = useRef<number>(CONFIG.circleSizeDesktop);
  const isMobileRef = useRef<boolean>(false);

  // Estados de Ondas Dinámicas (Fase 5B)
  const wave1Ref = useRef<WaveState | null>(null);
  const wave2Ref = useRef<WaveState | null>(null);
  const isMovingRef = useRef<boolean>(false);
  const lastMoveTimeRef = useRef<number>(0);
  const lastSpawnTimeRef = useRef<number>(0);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: -9999, y: -9999 });
  const smoothMouseRef = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: -9999,
    y: -9999,
    targetX: -9999,
    targetY: -9999,
  });

  // Proyecciones pre-asignadas (cero GC)
  const labelProjections = useRef<OrbitProjection[]>(
    ORBIT_LABELS.map(() => ({ x: 0, y: 0, z: 0, zNorm: 0, scale: 1, opacity: 1, blur: 0 }))
  );
  const circleProjections = useRef<OrbitProjection[]>(
    CONFIG.circleOrbits.map(() => ({ x: 0, y: 0, z: 0, zNorm: 0, scale: 1, opacity: 1, blur: 0 }))
  );

  const getInitialOrbitTime = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return parseFloat(params.get('time') || '0');
    }
    return 0;
  };

  const orbitTimeRef = useRef<number>(getInitialOrbitTime());
  const circleTimesRef = useRef<number[]>(CONFIG.circleOrbits.map(() => getInitialOrbitTime()));
  const circleSpeedsRef = useRef<number[]>(CONFIG.circleOrbits.map(() => 1.0));

  const [hoveredCircle, setHoveredCircle] = useState<number | null>(() => {
    if (typeof window !== 'undefined') {
      const h = new URLSearchParams(window.location.search).get('hover');
      if (h !== null && !isNaN(parseInt(h, 10))) {
        return parseInt(h, 10);
      }
    }
    return null;
  });
  const hoveredCircleIndexRef = useRef<number>(hoveredCircle !== null ? hoveredCircle : -1);

  const handleCircleMouseEnter = (idx: number) => {
    if (circleProjections.current[idx].zNorm >= -0.2) {
      hoveredCircleIndexRef.current = idx;
      setHoveredCircle(idx);
    }
  };

  const handleCircleMouseLeave = (idx: number) => {
    if (hoveredCircleIndexRef.current === idx) {
      hoveredCircleIndexRef.current = -1;
      setHoveredCircle(null);
    }
  };

  const getInitialSpinAngle = () => {
    const baseSpeed = (2 * Math.PI) / CONFIG.spinPeriod;
    const initialAngleRad = (-CONFIG.initialLon * Math.PI) / 180;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const timeOffset = parseFloat(params.get('time') || '0');
      return initialAngleRad + baseSpeed * timeOffset;
    }
    return initialAngleRad;
  };

  const spinAngleRef = useRef<number>(getInitialSpinAngle());
  const spinMultiplierRef = useRef<number>(1.0);

  // Estados de cursor e interacción
  const cursorScreenXRef = useRef<number>(0);
  const cursorScreenYRef = useRef<number>(0);
  const cursorCanvasXRef = useRef<number>(0);
  const cursorCanvasYRef = useRef<number>(0);
  const isCursorInHeroRef = useRef<boolean>(false);
  const isCursorActiveRef = useRef<boolean>(false);

  const targetNormXRef = useRef<number>(0);
  const targetNormYRef = useRef<number>(0);
  const currentNormXRef = useRef<number>(0);
  const currentNormYRef = useRef<number>(0);

  const cursorVelocityXRef = useRef<number>(0);
  const cursorVelocityYRef = useRef<number>(0);

  const tiltCurrentXRef = useRef<number>(0);
  const tiltCurrentYRef = useRef<number>(0);

  const orbitVelocityPushRef = useRef<number>(0);

  // Drag con inercia
  const isDraggingRef = useRef<boolean>(false);
  const dragVelocityXRef = useRef<number>(0);
  const dragVelocityYRef = useRef<number>(0);
  const dragAxisTiltDegRef = useRef<number>(0);
  const lastDragPointerXRef = useRef<number>(0);
  const lastDragPointerYRef = useRef<number>(0);
  const lastDragTimeRef = useRef<number>(0);

  const isTouchDeviceRef = useRef<boolean>(false);
  const fpsRef = useRef<number>(60);
  const cpuTimeRef = useRef<number>(0.15);
  const drawTimeRef = useRef<number>(0.35);
  const domTimeRef = useRef<number>(0.25);
  const containerWidthRef = useRef<number>(1440);

  useImperativeHandle(ref, () => ({
    getSpinAngle: () => spinAngleRef.current,
    setSpinMultiplier: (n: number) => {
      spinMultiplierRef.current = n;
    },
    getPlanetMetrics: () => ({
      cx: canvasWidthRef.current / 2,
      cy: canvasHeightRef.current / 2,
      radius: currentRadiusRef.current,
    }),
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const debugCanvas = debugCanvasRef.current;
    const container = containerRef.current;
    if (!container) return;

    // Asegurar ángulo inicial limpio
    spinAngleRef.current = getInitialSpinAngle();
    orbitTimeRef.current = getInitialOrbitTime();
    circleTimesRef.current = CONFIG.circleOrbits.map(() => getInitialOrbitTime());
    circleSpeedsRef.current = CONFIG.circleOrbits.map(() => 1.0);

    const maskData = getLandMaskData2048();
    if (!maskData) return;

    // Matriz de inclinación axial fija (-23.5° en Z de pantalla)
    const tiltRad = (-CONFIG.axisTilt * Math.PI) / 180;
    const cosTilt = Math.cos(tiltRad);
    const sinTilt = Math.sin(tiltRad);

    const R00 = cosTilt;
    const R01 = -sinTilt;
    const R02 = 0;

    const R10 = sinTilt;
    const R11 = cosTilt;
    const R12 = 0;

    // Vector de luz fijo
    const lHypot = Math.hypot(-0.6, 0.7, 0.5);
    const lx = -0.6 / lHypot;
    const ly = 0.7 / lHypot;
    const lz = 0.5 / lHypot;

    const baseSpinSpeed = (2 * Math.PI) / CONFIG.spinPeriod;

    // Soporte para URL params de prueba y forzado de renderer (?renderer=2d o ?renderer=webgl)
    let isDebug = false;
    let simulatedDrag = false;
    let forceRenderer: 'webgl' | '2d' | null = null;
    let urlPointsOverride: number | null = null;
    let urlWarpOverride: number | null = null;
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const debugParam = searchParams.get('debug');
      isDebug = debugParam === '1';
      simulatedDrag = searchParams.get('drag') === '1';

      const rParam = searchParams.get('renderer');
      if (rParam === '2d' || searchParams.get('canvas2d') === '1' || searchParams.get('webgl') === '0') {
        forceRenderer = '2d';
      } else if (rParam === 'webgl' || rParam === 'webgl2') {
        forceRenderer = 'webgl';
      }

      const pParam = searchParams.get('points');
      if (pParam) {
        const parsed = parseInt(pParam, 10);
        if (!isNaN(parsed) && parsed > 0) {
          urlPointsOverride = parsed;
        }
      }

      const wParam = searchParams.get('warp');
      if (wParam) {
        const parsedWarp = parseFloat(wParam);
        if (!isNaN(parsedWarp) && parsedWarp >= 0) {
          urlWarpOverride = parsedWarp;
        }
      }
    }

    // Inicialización de WebGL2 con fallback a Canvas 2D
    let gl: WebGL2RenderingContext | null = null;
    if (forceRenderer !== '2d') {
      try {
        gl = canvas.getContext('webgl2', {
          antialias: true,
          alpha: true,
          premultipliedAlpha: false,
          powerPreference: 'high-performance',
        });
      } catch (e) {
        console.warn('[PlanetHero] Fallo al inicializar contexto WebGL2:', e);
        gl = null;
      }
    }

    const use2DFallback = !gl;
    const ctx2d = use2DFallback ? canvas.getContext('2d') : null;
    const activeRendererLabel = gl ? 'WebGL2' : (forceRenderer === '2d' ? 'Canvas 2D' : 'Canvas 2D (fallback)');

    let discProgram: WebGLProgram | null = null;
    let pointsProgram: WebGLProgram | null = null;
    let quadVAO: WebGLVertexArrayObject | null = null;
    let quadBuffer: WebGLBuffer | null = null;
    let pointsVAO: WebGLVertexArrayObject | null = null;
    let posBuffer: WebGLBuffer | null = null;
    let landBuffer: WebGLBuffer | null = null;
    let jitterBuffer: WebGLBuffer | null = null;
    let isContextLost = false;

    // Almacén reactivo de distribución Fibonacci y pre-cálculo de máscara bilineal
    let activeSphere = {
      positions3D: new Float32Array(0),
      isLand: new Float32Array(0),
      rJitter: new Float32Array(0),
      baseX: new Float32Array(0),
      baseY: new Float32Array(0),
      baseZ: new Float32Array(0),
      count: 0,
    };

    const updateSphereForPoints = (pts: number) => {
      if (activeSphere.count === pts && activeSphere.positions3D.length > 0) return;
      activeSphere = {
        ...buildSpherePoints(pts, maskData),
        count: pts,
      };
      if (gl && !isContextLost && posBuffer && landBuffer && jitterBuffer) {
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, activeSphere.positions3D, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, landBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, activeSphere.isLand, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, jitterBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, activeSphere.rJitter, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
      }
    };

    // Sistema Responsive con cálculo dinámico del radio del planeta
    const updateDimensions = () => {
      const containerW = container.getBoundingClientRect().width || window.innerWidth;

      let rad = CONFIG.radius;
      let w = CONFIG.canvasWidthBase;
      let h = CONFIG.canvasHeightBase;
      let pts = CONFIG.pointsDesktop;
      let cSize = CONFIG.circleSizeDesktop;
      let isMob = false;

      if (containerW >= CONFIG.breakpointDesktop) {
        rad = CONFIG.radius; // 350px
        w = CONFIG.canvasWidthBase;
        h = CONFIG.canvasHeightBase;
        pts = CONFIG.pointsDesktop;
        cSize = CONFIG.circleSizeDesktop;
        isMob = false;
      } else if (containerW >= CONFIG.breakpointTablet) {
        rad = Math.round(containerW * CONFIG.ratioDesktop);
        w = Math.round(rad * 2.45);
        h = Math.round(rad * 2.10);
        pts = 14000;
        cSize = CONFIG.circleSizeTablet;
        isMob = false;
      } else {
        rad = Math.round(Math.min(containerW * CONFIG.ratioMobile, 160));
        w = Math.round(rad * 2.40);
        h = Math.round(rad * 2.15);
        pts = CONFIG.pointsMobile; // 12000
        cSize = CONFIG.circleSizeMobile; // 64px
        isMob = true;
      }

      const dpr = getEffectiveDpr(isMob);

      if (urlPointsOverride !== null) {
        pts = urlPointsOverride;
      }

      currentRadiusRef.current = rad;
      canvasWidthRef.current = w;
      canvasHeightRef.current = h;
      activePointsCountRef.current = pts;
      circleSizeRef.current = cSize;
      isMobileRef.current = isMob;
      containerWidthRef.current = containerW;

      updateSphereForPoints(pts);

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = '100%';
      canvas.style.maxWidth = `${w}px`;
      canvas.style.height = 'auto';

      if (debugCanvas) {
        debugCanvas.width = w * dpr;
        debugCanvas.height = h * dpr;
        debugCanvas.style.width = '100%';
        debugCanvas.style.maxWidth = `${w}px`;
        debugCanvas.style.height = 'auto';
      }
    };
    updateDimensions();

    let uMatrixLoc: WebGLUniformLocation | null = null;
    let uCenterLoc: WebGLUniformLocation | null = null;
    let uRadiusLoc: WebGLUniformLocation | null = null;
    let uViewportLoc: WebGLUniformLocation | null = null;
    let uLightLoc: WebGLUniformLocation | null = null;
    let uTimeLoc: WebGLUniformLocation | null = null;
    let uScaleLoc: WebGLUniformLocation | null = null;
    let uScaleFactorLoc: WebGLUniformLocation | null = null;
    let uDprLoc: WebGLUniformLocation | null = null;
    let uDotColorLoc: WebGLUniformLocation | null = null;
    let uMouseLoc: WebGLUniformLocation | null = null;
    let uStaticRadiusLoc: WebGLUniformLocation | null = null;
    let uPullStrengthLoc: WebGLUniformLocation | null = null;
    let uStaticSwellLoc: WebGLUniformLocation | null = null;
    let uSwellMaxLoc: WebGLUniformLocation | null = null;
    let uBaseOpacityLoc: WebGLUniformLocation | null = null;
    let uLitToneLoc: WebGLUniformLocation | null = null;
    let uWarpMaxLoc: WebGLUniformLocation | null = null;
    let uCursorActiveLoc: WebGLUniformLocation | null = null;
    let uShadowContrastLoc: WebGLUniformLocation | null = null;
    let uOceanShadowMaxLoc: WebGLUniformLocation | null = null;
    let uShadowWeightLoc: WebGLUniformLocation | null = null;
    let uLandWeightLoc: WebGLUniformLocation | null = null;
    let uContrastLoc: WebGLUniformLocation | null = null;
    let uMinDotRadiusLoc: WebGLUniformLocation | null = null;
    let uMaxDotRadiusLoc: WebGLUniformLocation | null = null;
    let uMinOceanRadiusCssLoc: WebGLUniformLocation | null = null;
    let uWave1StartsLoc: WebGLUniformLocation | null = null;
    let uWave1EndsLoc: WebGLUniformLocation | null = null;
    let uWave1CountLoc: WebGLUniformLocation | null = null;
    let uWave1RadiusLoc: WebGLUniformLocation | null = null;
    let uWave1StrengthLoc: WebGLUniformLocation | null = null;
    let uWave2StartsLoc: WebGLUniformLocation | null = null;
    let uWave2EndsLoc: WebGLUniformLocation | null = null;
    let uWave2CountLoc: WebGLUniformLocation | null = null;
    let uWave2RadiusLoc: WebGLUniformLocation | null = null;
    let uWave2StrengthLoc: WebGLUniformLocation | null = null;

    let uDiscCenterLoc: WebGLUniformLocation | null = null;
    let uDiscRadiusLoc: WebGLUniformLocation | null = null;
    let uDiscColorLoc: WebGLUniformLocation | null = null;
    let uDiscViewportLoc: WebGLUniformLocation | null = null;

    const initWebGL = () => {
      if (!gl) return;

      const compileShader = (src: string, type: number): WebGLShader | null => {
        if (!gl) return null;
        const shader = gl.createShader(type);
        if (!shader) return null;
        gl.shaderSource(shader, src);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          console.error('[PlanetHero WebGL2] Compile error:', gl.getShaderInfoLog(shader));
          gl.deleteShader(shader);
          return null;
        }
        return shader;
      };

      const discVS = `#version 300 es
        in vec2 a_quadPos;
        void main() {
          gl_Position = vec4(a_quadPos, 0.0, 1.0);
        }
      `;

      const discFS = `#version 300 es
        precision mediump float;
        uniform vec2 u_center;
        uniform float u_radius;
        uniform vec3 u_discColor;
        uniform vec2 u_viewport;
        out vec4 fragColor;

        void main() {
          vec2 screenPixel = vec2(gl_FragCoord.x, u_viewport.y - gl_FragCoord.y);
          float dist = length(screenPixel - u_center);
          if (dist > u_radius + 0.5) {
            discard;
          }
          float delta = fwidth(dist);
          float alpha = 1.0 - smoothstep(u_radius - max(delta, 0.5), u_radius + 0.5, dist);
          fragColor = vec4(u_discColor, alpha);
        }
      `;

      const dvs = compileShader(discVS, gl.VERTEX_SHADER);
      const dfs = compileShader(discFS, gl.FRAGMENT_SHADER);
      if (dvs && dfs) {
        discProgram = gl.createProgram();
        if (discProgram) {
          gl.attachShader(discProgram, dvs);
          gl.attachShader(discProgram, dfs);
          gl.linkProgram(discProgram);
          uDiscCenterLoc = gl.getUniformLocation(discProgram, 'u_center');
          uDiscRadiusLoc = gl.getUniformLocation(discProgram, 'u_radius');
          uDiscColorLoc = gl.getUniformLocation(discProgram, 'u_discColor');
          uDiscViewportLoc = gl.getUniformLocation(discProgram, 'u_viewport');

          quadVAO = gl.createVertexArray();
          gl.bindVertexArray(quadVAO);
          quadBuffer = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
          const qLoc = gl.getAttribLocation(discProgram, 'a_quadPos');
          gl.enableVertexAttribArray(qLoc);
          gl.vertexAttribPointer(qLoc, 2, gl.FLOAT, false, 0, 0);
          gl.bindVertexArray(null);
        }
      }

      const pointsVS = `#version 300 es
        precision highp float;

        in vec3 a_basePos;
        in float a_isLand;
        in float a_rJitter;

        uniform mat3 u_matrix;
        uniform vec2 u_center;
        uniform float u_radius;
        uniform vec2 u_viewport;
        uniform vec3 u_light;
        uniform float u_time;
        uniform float u_scale;
        uniform float u_scaleFactor;
        uniform float u_dpr;

        uniform int u_cursorActive;
        uniform float u_shadowContrast;
        uniform float u_oceanShadowMax;
        uniform float u_shadowWeight;
        uniform float u_landWeight;
        uniform float u_contrast;
        uniform float u_minDotRadius;
        uniform float u_maxDotRadius;
        uniform float u_minOceanRadiusCss;

        uniform vec2 u_mouse;
        uniform float u_staticRadius;
        uniform float u_pullStrength;
        uniform float u_staticSwell;
        uniform float u_swellMax;
        uniform float u_baseOpacity;
        uniform float u_litTone;
        uniform float u_warpMax;

        uniform vec2 u_wave1_starts[8];
        uniform vec2 u_wave1_ends[8];
        uniform int u_wave1_count;
        uniform float u_wave1_radius;
        uniform float u_wave1_strength;

        uniform vec2 u_wave2_starts[8];
        uniform vec2 u_wave2_ends[8];
        uniform int u_wave2_count;
        uniform float u_wave2_radius;
        uniform float u_wave2_strength;

        out float v_opacity;
        out float v_radiusCss;
        out float v_pointSize;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
            mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
            u.y
          );
        }

        float fbm(vec2 p, float time) {
          float val = 0.0;
          float amp = 0.5;
          float freq = 1.0;
          val += amp * noise(p * freq + vec2(0.0, -time * 0.8));
          amp *= 0.5; freq *= 2.0;
          val += amp * noise(p * freq + vec2(-time * 0.5, time * 0.7));
          amp *= 0.5; freq *= 2.0;
          val += amp * noise(p * freq + vec2(time * 0.9, -time * 0.4));
          return val;
        }

        void main() {
          vec3 rotPos = u_matrix * a_basePos;

          // Hemisferio trasero estricto (z <= 0.005 descartado)
          if (rotPos.z <= 0.005) {
            gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
            gl_PointSize = 0.0;
            v_opacity = 0.0;
            v_radiusCss = 0.0;
            v_pointSize = 0.0;
            return;
          }

          vec2 screenPos = vec2(
            u_center.x + rotPos.x * u_radius,
            u_center.y - rotPos.y * u_radius
          );

          float nDotL = rotPos.x * u_light.x + rotPos.y * u_light.y + rotPos.z * u_light.z;
          float lightFactor = clamp(nDotL * 0.5 + 0.5, 0.0, 1.0);
          float rawShade = pow(1.0 - lightFactor, u_shadowContrast);

          float maxOceanShade = u_oceanShadowMax;
          float allowedShade = a_isLand > 0.3 ? rawShade : min(rawShade, maxOceanShade + (1.0 - maxOceanShade) * (a_isLand / 0.3));

          float tone = clamp(allowedShade * u_shadowWeight + a_isLand * u_landWeight, 0.0, 1.0);
          float rTone = pow(tone, u_contrast);
          float rRef = (u_minDotRadius + (u_maxDotRadius - u_minDotRadius) * rTone) * a_rJitter;

          float rho = length(rotPos.xy);
          if (rho > 0.92) {
            float edgeDist = clamp((1.0 - rho) / 0.08, 0.0, 1.0);
            float maxAllowed = u_maxDotRadius * (0.35 + 0.65 * edgeDist);
            rRef = min(rRef, maxAllowed);
          }

          float rScaled = rRef * u_scaleFactor;
          float baseRCss = max(u_minOceanRadiusCss, rScaled);

          float finalRadiusCss = baseRCss;
          vec2 displacedPos = screenPos;
          float v_opacity_val = u_baseOpacity;

          // Optimización de rendimiento: omitir cálculo de ondas e imán si el cursor está inactivo
          if (u_cursorActive > 0) {
          vec2 cellId = screenPos / (16.0 * u_scale);

          // Imán estático
          float staticDist = distance(screenPos, u_mouse);
          float staticRadScaled = u_staticRadius * u_scale;
          vec2 pullDir = (staticDist > 0.1) ? normalize(u_mouse - screenPos) : vec2(0.0);
          float staticFalloff = 1.0 - smoothstep(0.0, staticRadScaled, staticDist);
          float pullStrength = staticFalloff * (u_pullStrength * u_scale);
          vec2 pullOffset = (staticDist > 0.1) ? (pullDir * pullStrength) : vec2(0.0);

          float staticSwell = staticFalloff * u_staticSwell;
          float staticOpacity = staticFalloff;

          // Onda activa (Wave 1)
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
              vec2 pa = screenPos - start;
              float lenSq = dot(ba, ba);
              float h = lenSq > 0.0001 ? clamp(dot(pa, ba) / lenSq, 0.0, 1.0) : 0.0;
              vec2 pt = start + ba * h;
              float d = length(screenPos - pt);
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

            vec2 toCell1 = screenPos - closestPoint1;
            vec2 dirNorm1 = minDist1 > 0.1 ? toCell1 / minDist1 : vec2(0.0);
            float proj1 = dot(dirNorm1, velDir1);

            float waveNoise1 = fbm(cellId * 0.045, u_time * 0.6);
            float radiusOffset1 = (waveNoise1 - 0.5) * (45.0 * u_scale);

            float waveDist1 = abs(minDist1 - (u_wave1_radius + radiusOffset1));
            float maxWaveWidth = 35.0 * u_scale;
            float waveWidth = min(maxWaveWidth, u_wave1_radius * 0.8 + 6.0 * u_scale);

            float x1 = clamp(waveDist1 / waveWidth, 0.0, 1.0);
            float waveIntensityFactor1 = 1.0 - x1 * x1;
            waveIntensityFactor1 = waveIntensityFactor1 * waveIntensityFactor1 * waveIntensityFactor1;

            float directionScale1 = smoothstep(-0.3, 0.3, proj1) * 0.93 + 0.07;
            wave1Intensity = waveIntensityFactor1 * u_wave1_strength * directionScale1;
            wave1Intensity *= smoothstep(0.0, 12.0 * u_scale, minDist1);

            if (minDist1 > 0.1) {
              vec2 warpDir = normalize(toCell1);
              float waveOsc = sin(minDist1 * 0.08 - u_wave1_radius * 0.15);
              warp1 = warpDir * waveOsc * wave1Intensity * (u_warpMax * u_scale);
            }
          }

          // Onda histórica (Wave 2)
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
              vec2 pa = screenPos - start;
              float lenSq = dot(ba, ba);
              float h = lenSq > 0.0001 ? clamp(dot(pa, ba) / lenSq, 0.0, 1.0) : 0.0;
              vec2 pt = start + ba * h;
              float d = length(screenPos - pt);
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

            vec2 toCell2 = screenPos - closestPoint2;
            vec2 dirNorm2 = minDist2 > 0.1 ? toCell2 / minDist2 : vec2(0.0);
            float proj2 = dot(dirNorm2, velDir2);

            float waveNoise2 = fbm(cellId * 0.045, u_time * 0.6);
            float radiusOffset2 = (waveNoise2 - 0.5) * (45.0 * u_scale);

            float waveDist2 = abs(minDist2 - (u_wave2_radius + radiusOffset2));
            float maxWaveWidth2 = 35.0 * u_scale;
            float waveWidth2 = min(maxWaveWidth2, u_wave2_radius * 0.8 + 6.0 * u_scale);

            float x2 = clamp(waveDist2 / waveWidth2, 0.0, 1.0);
            float waveIntensityFactor2 = 1.0 - x2 * x2;
            waveIntensityFactor2 = waveIntensityFactor2 * waveIntensityFactor2 * waveIntensityFactor2;

            float directionScale2 = smoothstep(-0.3, 0.3, proj2) * 0.93 + 0.07;
            wave2Intensity = waveIntensityFactor2 * u_wave2_strength * directionScale2;
            wave2Intensity *= smoothstep(0.0, 12.0 * u_scale, minDist2);

            if (minDist2 > 0.1) {
              vec2 warpDir = normalize(toCell2);
              float waveOsc = sin(minDist2 * 0.08 - u_wave2_radius * 0.15);
              warp2 = warpDir * waveOsc * wave2Intensity * (u_warpMax * u_scale);
            }
          }

          float totalWave = max(wave1Intensity, wave2Intensity);
          vec2 totalWarp = warp1 + warp2;

          float warpLen = length(totalWarp);
          float scaledWarpMax = u_warpMax * u_scale;
          if (warpLen > scaledWarpMax && warpLen > 0.0001) {
            totalWarp = (totalWarp / warpLen) * scaledWarpMax;
          }

          float swell = clamp(max(staticSwell, totalWave * u_swellMax), 0.0, u_swellMax);
          finalRadiusCss = baseRCss * (1.0 + swell);

          displacedPos = screenPos + pullOffset + totalWarp;

          vec2 fromPlanetCenter = displacedPos - u_center;
          float distCenter = length(fromPlanetCenter);
          float dotRadiusPx = finalRadiusCss * u_dpr;
          float maxAllowedSil = max(0.0, u_radius - dotRadiusPx);
          if (distCenter > maxAllowedSil && distCenter > 0.001) {
            displacedPos = u_center + (fromPlanetCenter / distCenter) * maxAllowedSil;
          }

          // Sin encendido de tono bajo cursor (apariencia idéntica a reposo)
          v_opacity_val = u_baseOpacity;
          }

          vec2 clipPos = vec2(
            (displacedPos.x / u_viewport.x) * 2.0 - 1.0,
            1.0 - (displacedPos.y / u_viewport.y) * 2.0
          );

          gl_Position = vec4(clipPos, 0.0, 1.0);
          gl_PointSize = 2.0 * finalRadiusCss * u_dpr + 0.6;
          v_pointSize = gl_PointSize;
          v_opacity = v_opacity_val;
        }
      `;

      const pointsFS = `#version 300 es
        precision mediump float;

        in float v_opacity;
        in float v_pointSize;
        uniform vec3 u_dotColor;

        out vec4 fragColor;

        void main() {
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          if (dist > 0.5) {
            discard;
          }
          float pixelWidth = 1.0 / max(v_pointSize, 1.0);
          float alpha = clamp((0.5 - dist) / (0.75 * pixelWidth), 0.0, 1.0);
          fragColor = vec4(u_dotColor, alpha * v_opacity);
        }
      `;

      const pvs = compileShader(pointsVS, gl.VERTEX_SHADER);
      const pfs = compileShader(pointsFS, gl.FRAGMENT_SHADER);
      if (pvs && pfs) {
        pointsProgram = gl.createProgram();
        if (pointsProgram) {
          gl.attachShader(pointsProgram, pvs);
          gl.attachShader(pointsProgram, pfs);
          gl.linkProgram(pointsProgram);

          uMatrixLoc = gl.getUniformLocation(pointsProgram, 'u_matrix');
          uCenterLoc = gl.getUniformLocation(pointsProgram, 'u_center');
          uRadiusLoc = gl.getUniformLocation(pointsProgram, 'u_radius');
          uViewportLoc = gl.getUniformLocation(pointsProgram, 'u_viewport');
          uLightLoc = gl.getUniformLocation(pointsProgram, 'u_light');
          uTimeLoc = gl.getUniformLocation(pointsProgram, 'u_time');
          uScaleLoc = gl.getUniformLocation(pointsProgram, 'u_scale');
          uScaleFactorLoc = gl.getUniformLocation(pointsProgram, 'u_scaleFactor');
          uDprLoc = gl.getUniformLocation(pointsProgram, 'u_dpr');
          uDotColorLoc = gl.getUniformLocation(pointsProgram, 'u_dotColor');
          uMouseLoc = gl.getUniformLocation(pointsProgram, 'u_mouse');
          uStaticRadiusLoc = gl.getUniformLocation(pointsProgram, 'u_staticRadius');
          uPullStrengthLoc = gl.getUniformLocation(pointsProgram, 'u_pullStrength');
          uStaticSwellLoc = gl.getUniformLocation(pointsProgram, 'u_staticSwell');
          uSwellMaxLoc = gl.getUniformLocation(pointsProgram, 'u_swellMax');
          uBaseOpacityLoc = gl.getUniformLocation(pointsProgram, 'u_baseOpacity');
          uLitToneLoc = gl.getUniformLocation(pointsProgram, 'u_litTone');
          uWarpMaxLoc = gl.getUniformLocation(pointsProgram, 'u_warpMax');

          uCursorActiveLoc = gl.getUniformLocation(pointsProgram, 'u_cursorActive');
          uShadowContrastLoc = gl.getUniformLocation(pointsProgram, 'u_shadowContrast');
          uOceanShadowMaxLoc = gl.getUniformLocation(pointsProgram, 'u_oceanShadowMax');
          uShadowWeightLoc = gl.getUniformLocation(pointsProgram, 'u_shadowWeight');
          uLandWeightLoc = gl.getUniformLocation(pointsProgram, 'u_landWeight');
          uContrastLoc = gl.getUniformLocation(pointsProgram, 'u_contrast');
          uMinDotRadiusLoc = gl.getUniformLocation(pointsProgram, 'u_minDotRadius');
          uMaxDotRadiusLoc = gl.getUniformLocation(pointsProgram, 'u_maxDotRadius');
          uMinOceanRadiusCssLoc = gl.getUniformLocation(pointsProgram, 'u_minOceanRadiusCss');

          uWave1StartsLoc = gl.getUniformLocation(pointsProgram, 'u_wave1_starts');
          uWave1EndsLoc = gl.getUniformLocation(pointsProgram, 'u_wave1_ends');
          uWave1CountLoc = gl.getUniformLocation(pointsProgram, 'u_wave1_count');
          uWave1RadiusLoc = gl.getUniformLocation(pointsProgram, 'u_wave1_radius');
          uWave1StrengthLoc = gl.getUniformLocation(pointsProgram, 'u_wave1_strength');

          uWave2StartsLoc = gl.getUniformLocation(pointsProgram, 'u_wave2_starts');
          uWave2EndsLoc = gl.getUniformLocation(pointsProgram, 'u_wave2_ends');
          uWave2CountLoc = gl.getUniformLocation(pointsProgram, 'u_wave2_count');
          uWave2RadiusLoc = gl.getUniformLocation(pointsProgram, 'u_wave2_radius');
          uWave2StrengthLoc = gl.getUniformLocation(pointsProgram, 'u_wave2_strength');

          pointsVAO = gl.createVertexArray();
          gl.bindVertexArray(pointsVAO);

          posBuffer = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
          gl.bufferData(gl.ARRAY_BUFFER, activeSphere.positions3D, gl.STATIC_DRAW);
          const posAttrLoc = gl.getAttribLocation(pointsProgram, 'a_basePos');
          gl.enableVertexAttribArray(posAttrLoc);
          gl.vertexAttribPointer(posAttrLoc, 3, gl.FLOAT, false, 0, 0);

          landBuffer = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, landBuffer);
          gl.bufferData(gl.ARRAY_BUFFER, activeSphere.isLand, gl.STATIC_DRAW);
          const landAttrLoc = gl.getAttribLocation(pointsProgram, 'a_isLand');
          gl.enableVertexAttribArray(landAttrLoc);
          gl.vertexAttribPointer(landAttrLoc, 1, gl.FLOAT, false, 0, 0);

          jitterBuffer = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, jitterBuffer);
          gl.bufferData(gl.ARRAY_BUFFER, activeSphere.rJitter, gl.STATIC_DRAW);
          const jitterAttrLoc = gl.getAttribLocation(pointsProgram, 'a_rJitter');
          gl.enableVertexAttribArray(jitterAttrLoc);
          gl.vertexAttribPointer(jitterAttrLoc, 1, gl.FLOAT, false, 0, 0);

          gl.bindVertexArray(null);
        }
      }
    };

    initWebGL();

    // Manejo de pérdida y restauración de contexto WebGL2 (Bloque 4)
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      isContextLost = true;
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      console.warn('[PlanetHero WebGL2] Contexto WebGL perdido. Animación pausada temporalmente.');
    };

    const handleContextRestored = () => {
      isContextLost = false;
      initWebGL();
      lastTime = performance.now();
      if (isVisible && isPageVisible && !prefersReducedMotion && animationFrameId === null) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    canvas.addEventListener('webglcontextlost', handleContextLost, false);
    canvas.addEventListener('webglcontextrestored', handleContextRestored, false);

    // Arrays pre-asignados para uniformes
    const w1Starts = new Float32Array(16);
    const w1Ends = new Float32Array(16);
    const w2Starts = new Float32Array(16);
    const w2Ends = new Float32Array(16);
    const mat3Array = new Float32Array(9);

    // Detección reactiva de prefers-reduced-motion en vivo (Bloque 5)
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let prefersReducedMotion = motionQuery.matches;

    const handleMotionChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion = e.matches;
      if (prefersReducedMotion) {
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
        renderFrame(0, 0);
      } else if (isVisible && isPageVisible && animationFrameId === null) {
        lastTime = performance.now();
        animationFrameId = requestAnimationFrame(animate);
      }
    };
    motionQuery.addEventListener('change', handleMotionChange);

    // Soporte para pruebas deterministas (?debug=1, ?cursor=X,Y, ?wave=1, ?state=magnet)
    let animationFrameId: number | null = null;
    let lastTime = performance.now();
    let isVisible = true;
    let isPageVisible = !document.hidden;

    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const curParam = searchParams.get('cursor');
      const waveParam = searchParams.get('wave') === '1';
      const stateParam = searchParams.get('state');

      if (curParam) {
        const parts = curParam.split(',').map(Number);
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          const sX = parts[0];
          const sY = parts[1];
          const rad = currentRadiusRef.current;
          const cX = canvasWidthRef.current / 2 + sX * rad;
          const cY = canvasHeightRef.current / 2 + sY * rad;

          cursorCanvasXRef.current = cX;
          cursorCanvasYRef.current = cY;
          isCursorInHeroRef.current = true;
          isCursorActiveRef.current = true;

          const dpr = getEffectiveDpr(isMobileRef.current);
          smoothMouseRef.current.x = cX * dpr;
          smoothMouseRef.current.y = cY * dpr;
          smoothMouseRef.current.targetX = cX * dpr;
          smoothMouseRef.current.targetY = cY * dpr;
        }
      }

      if (stateParam === 'magnet') {
        isMovingRef.current = false;
        wave1Ref.current = null;
        wave2Ref.current = null;
      }

      if (waveParam) {
        const dpr = getEffectiveDpr(isMobileRef.current);
        const cX = canvasWidthRef.current / 2;
        const cY = canvasHeightRef.current / 2;
        isMovingRef.current = true;
        isCursorInHeroRef.current = true;
        isCursorActiveRef.current = true;
        cursorCanvasXRef.current = cX + 120;
        cursorCanvasYRef.current = cY + 25;
        cursorVelocityXRef.current = 450;
        cursorVelocityYRef.current = 120;
        lastMoveTimeRef.current = performance.now() + 1000000;
        wave1Ref.current = {
          segments: [
            { startX: (cX - 120) * dpr, startY: (cY - 60) * dpr, endX: (cX - 40) * dpr, endY: (cY - 30) * dpr },
            { startX: (cX - 40) * dpr, startY: (cY - 30) * dpr, endX: (cX + 40) * dpr, endY: (cY - 5) * dpr },
            { startX: (cX + 40) * dpr, startY: (cY - 5) * dpr, endX: (cX + 120) * dpr, endY: (cY + 25) * dpr },
          ],
          radius: 70 * dpr,
          speed: 110 * dpr,
          strength: 1.0,
          startTime: performance.now(),
          lifetime: 2400,
        };
      }

      if (simulatedDrag) {
        isDraggingRef.current = true;
        dragAxisTiltDegRef.current = 14;
        spinAngleRef.current += 0.25;
        container.style.cursor = 'grabbing';
      }
    }

    // FPS tracking y auto-reducción suave (Bloque 3)
    let frameCount = 0;
    let fpsAccumTime = 0;
    let lowFpsAccumTime = 0;
    let hasAutoReducedPoints = false;

    const applyCursorToOrbits = (dt: number) => {
      const targetNormX = (isCursorInHeroRef.current && !isTouchDeviceRef.current) ? targetNormXRef.current : 0;
      const targetNormY = (isCursorInHeroRef.current && !isTouchDeviceRef.current) ? targetNormYRef.current : 0;

      const lerpFactor = Math.min(1, dt * 6);
      currentNormXRef.current += (targetNormX - currentNormXRef.current) * lerpFactor;
      currentNormYRef.current += (targetNormY - currentNormYRef.current) * lerpFactor;

      const maxTiltRad = (CONFIG.tiltMax * Math.PI) / 180;
      const targetTiltX = -currentNormYRef.current * maxTiltRad;
      const targetTiltY = currentNormXRef.current * maxTiltRad;
      tiltCurrentXRef.current += (targetTiltX - tiltCurrentXRef.current) * lerpFactor;
      tiltCurrentYRef.current += (targetTiltY - tiltCurrentYRef.current) * lerpFactor;

      if (!isTouchDeviceRef.current && isCursorInHeroRef.current) {
        const distNorm = Math.hypot(targetNormXRef.current, targetNormYRef.current);
        if (distNorm < 1.3) {
          const factor = 1 - distNorm / 1.3;
          const targetMultiplier = 1.0 + (CONFIG.spinBoostMax - 1.0) * factor;
          spinMultiplierRef.current += (targetMultiplier - spinMultiplierRef.current) * Math.min(1, dt * 5);
        } else {
          spinMultiplierRef.current += (1.0 - spinMultiplierRef.current) * Math.min(1, dt * 3.5);
        }
      } else {
        spinMultiplierRef.current += (1.0 - spinMultiplierRef.current) * Math.min(1, dt * 3.5);
      }

      const pushDecay = Math.pow(0.92, dt * 60);
      orbitVelocityPushRef.current *= pushDecay;
      if (Math.abs(orbitVelocityPushRef.current) < 0.001) {
        orbitVelocityPushRef.current = 0;
      }

      if (!isDraggingRef.current) {
        const dragDecay = Math.pow(CONFIG.dragDamping, dt * 60);
        dragVelocityXRef.current *= dragDecay;
        dragVelocityYRef.current *= dragDecay;
        if (Math.abs(dragVelocityXRef.current) < 0.002) dragVelocityXRef.current = 0;
        if (Math.abs(dragVelocityYRef.current) < 0.002) dragVelocityYRef.current = 0;

        dragAxisTiltDegRef.current += (0 - dragAxisTiltDegRef.current) * Math.min(1, dt * 4);
        if (Math.abs(dragAxisTiltDegRef.current) < 0.01) dragAxisTiltDegRef.current = 0;
      }
    };

    const renderFrame = (dt: number, totalTimeSec: number) => {
      const tStart = performance.now();
      const dpr = getEffectiveDpr(isMobileRef.current);
      const rad = currentRadiusRef.current;
      const cX = canvasWidthRef.current / 2;
      const cY = canvasHeightRef.current / 2;
      const scaleResponsive = (rad / CONFIG.cursorFx.refRadius) * dpr;

      // u_cursorActive: 1 si hay ondas activas, si el cursor está en movimiento,
      // o si está quieto DENTRO del radio de influencia del imán respecto al planeta.
      // 0 si está quieto fuera del radio del imán (incluso dentro del hero) o si está fuera del hero.
      const hasWaves = (wave1Ref.current !== null && wave1Ref.current.strength > 0.01) ||
                       (wave2Ref.current !== null && wave2Ref.current.strength > 0.01);
      let cursorActive = 0;
      if (hasWaves) {
        cursorActive = 1;
      } else if (isCursorInHeroRef.current && isCursorActiveRef.current) {
        if (isMovingRef.current) {
          cursorActive = 1;
        } else {
          const magnetRad = CONFIG.cursorFx.staticRadius * (rad / 350);
          const distFromPlanetCenter = Math.hypot(cursorCanvasXRef.current - cX, cursorCanvasYRef.current - cY);
          if (distFromPlanetCenter <= rad + magnetRad) {
            cursorActive = 1;
          } else {
            cursorActive = 0;
          }
        }
      }

      // 1. Matriz de rotación combinada
      const currentAngle = spinAngleRef.current;
      const cT = Math.cos(currentAngle);
      const sT = Math.sin(currentAngle);

      const B00 = R00 * cT;
      const B01 = R01;
      const B02 = R00 * sT;

      const B10 = R10 * cT;
      const B11 = R11;
      const B12 = R10 * sT;

      const B20 = -sT;
      const B21 = 0;
      const B22 = cT;

      const pitch = prefersReducedMotion ? 0 : (tiltCurrentXRef.current + (dragAxisTiltDegRef.current * Math.PI) / 180);
      const yaw = prefersReducedMotion ? 0 : tiltCurrentYRef.current;

      const cosP = Math.cos(pitch);
      const sinP = Math.sin(pitch);
      const cosY = Math.cos(yaw);
      const sinY = Math.sin(yaw);

      const P00 = cosY;
      const P01 = 0;
      const P02 = sinY;

      const P10 = -sinP * sinY;
      const P11 = cosP;
      const P12 = sinP * cosY;

      const P20 = -cosP * sinY;
      const P21 = -sinP;
      const P22 = cosP * cosY;

      const M00 = P00 * B00 + P02 * B20;
      const M01 = P00 * B01;
      const M02 = P00 * B02 + P02 * B22;

      const M10 = P10 * B00 + P11 * B10 + P12 * B20;
      const M11 = P10 * B01 + P11 * B11;
      const M12 = P10 * B02 + P11 * B12 + P12 * B22;

      const M20 = P20 * B00 + P21 * B10 + P22 * B20;
      const M21 = P20 * B01 + P21 * B11;
      const M22 = P20 * B02 + P21 * B12 + P22 * B22;

      mat3Array[0] = M00; mat3Array[1] = M10; mat3Array[2] = M20;
      mat3Array[3] = M01; mat3Array[4] = M11; mat3Array[5] = M21;
      mat3Array[6] = M02; mat3Array[7] = M12; mat3Array[8] = M22;

      applyCursorToOrbits(dt);

      // Render WebGL2 Primario
      if (gl && !isContextLost && discProgram && pointsProgram && quadVAO && pointsVAO) {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // Paso 1: Disco crema (Capa B para oclusión)
        gl.useProgram(discProgram);
        gl.uniform2f(uDiscCenterLoc, cX * dpr, cY * dpr);
        gl.uniform1f(uDiscRadiusLoc, rad * dpr);
        gl.uniform3f(uDiscColorLoc, 245 / 255, 242 / 255, 235 / 255);
        gl.uniform2f(uDiscViewportLoc, canvas.width, canvas.height);

        gl.bindVertexArray(quadVAO);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.bindVertexArray(null);

        // Paso 2: Puntos de semitono
        gl.useProgram(pointsProgram);

        const ptsCount = activePointsCountRef.current;
        const scaleFactor = (rad / 350.0) * Math.sqrt(18000.0 / ptsCount);

        gl.uniformMatrix3fv(uMatrixLoc, false, mat3Array);
        gl.uniform2f(uCenterLoc, cX * dpr, cY * dpr);
        gl.uniform1f(uRadiusLoc, rad * dpr);
        gl.uniform2f(uViewportLoc, canvas.width, canvas.height);
        gl.uniform3f(uLightLoc, lx, ly, lz);
        gl.uniform1f(uTimeLoc, totalTimeSec);
        gl.uniform1f(uScaleLoc, scaleResponsive);
        gl.uniform1f(uScaleFactorLoc, scaleFactor);
        gl.uniform1f(uDprLoc, dpr);
        gl.uniform3f(uDotColorLoc, 17 / 255, 17 / 255, 17 / 255);

        gl.uniform1i(uCursorActiveLoc, cursorActive);
        gl.uniform1f(uShadowContrastLoc, CONFIG.shadowContrast);
        gl.uniform1f(uOceanShadowMaxLoc, CONFIG.oceanShadowMax);
        gl.uniform1f(uShadowWeightLoc, CONFIG.shadowWeight);
        gl.uniform1f(uLandWeightLoc, CONFIG.landWeight);
        gl.uniform1f(uContrastLoc, CONFIG.contrast);
        gl.uniform1f(uMinDotRadiusLoc, CONFIG.minDotRadius);
        gl.uniform1f(uMaxDotRadiusLoc, CONFIG.maxDotRadius);
        gl.uniform1f(uMinOceanRadiusCssLoc, CONFIG.minOceanRadiusCss);

        const mX = smoothMouseRef.current.x;
        const mY = smoothMouseRef.current.y;
        gl.uniform2f(uMouseLoc, mX, mY);

        gl.uniform1f(uStaticRadiusLoc, CONFIG.cursorFx.staticRadius);
        gl.uniform1f(uPullStrengthLoc, CONFIG.cursorFx.pullStrength);
        gl.uniform1f(uStaticSwellLoc, CONFIG.cursorFx.staticSwell);
        gl.uniform1f(uSwellMaxLoc, CONFIG.cursorFx.swellMax);
        gl.uniform1f(uBaseOpacityLoc, CONFIG.cursorFx.baseOpacity);
        gl.uniform1f(uLitToneLoc, CONFIG.cursorFx.litTone);
        const activeWarpMax = urlWarpOverride !== null ? urlWarpOverride : CONFIG.cursorFx.warpMax;
        gl.uniform1f(uWarpMaxLoc, activeWarpMax);

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
        gl.uniform2fv(uWave1StartsLoc, w1Starts);
        gl.uniform2fv(uWave1EndsLoc, w1Ends);
        gl.uniform1i(uWave1CountLoc, w1Count);
        gl.uniform1f(uWave1RadiusLoc, w1Radius);
        gl.uniform1f(uWave1StrengthLoc, w1Strength);

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
        gl.uniform2fv(uWave2StartsLoc, w2Starts);
        gl.uniform2fv(uWave2EndsLoc, w2Ends);
        gl.uniform1i(uWave2CountLoc, w2Count);
        gl.uniform1f(uWave2RadiusLoc, w2Radius);
        gl.uniform1f(uWave2StrengthLoc, w2Strength);

        gl.bindVertexArray(pointsVAO);
        const tDraw0 = performance.now();
        gl.drawArrays(gl.POINTS, 0, ptsCount);
        const tDraw1 = performance.now();
        drawTimeRef.current = drawTimeRef.current * 0.95 + (tDraw1 - tDraw0) * 0.05;
        gl.bindVertexArray(null);
      } else if (ctx2d) {
        // Fallback robusto a Canvas 2D
        const tDraw0 = performance.now();
        ctx2d.save();
        ctx2d.scale(dpr, dpr);
        ctx2d.clearRect(0, 0, canvasWidthRef.current, canvasHeightRef.current);

        ctx2d.fillStyle = CONFIG.discColor;
        ctx2d.beginPath();
        ctx2d.arc(cX, cY, rad, 0, Math.PI * 2);
        ctx2d.fill();

        ctx2d.fillStyle = CONFIG.dotColor;
        ctx2d.beginPath();
        const { baseX, baseY, baseZ, isLand, rJitter } = activeSphere;
        const ptsCount = activePointsCountRef.current;
        const scaleFactor = (rad / 350.0) * Math.sqrt(18000.0 / ptsCount);
        for (let i = 0; i < ptsCount; i++) {
          const x0 = baseX[i];
          const y0 = baseY[i];
          const z0 = baseZ[i];

          const rx = M00 * x0 + M01 * y0 + M02 * z0;
          const ry = M10 * x0 + M11 * y0 + M12 * z0;
          const rz = M20 * x0 + M21 * y0 + M22 * z0;

          if (rz <= 0.005) continue;

          const sx = cX + rx * rad;
          const sy = cY - ry * rad;

          const nDotL = rx * lx + ry * ly + rz * lz;
          const lightFactor = Math.max(0, Math.min(1, nDotL * 0.5 + 0.5));
          const rawShade = Math.pow(1 - lightFactor, CONFIG.shadowContrast);

          const isL = isLand[i];
          const maxOceanShade = CONFIG.oceanShadowMax;
          const allowedShade = isL > 0.3 ? rawShade : Math.min(rawShade, maxOceanShade + (1.0 - maxOceanShade) * (isL / 0.3));

          const tone = Math.max(0, Math.min(1, allowedShade * CONFIG.shadowWeight + isL * CONFIG.landWeight));
          const rTone = Math.pow(tone, CONFIG.contrast);
          let rRef = (CONFIG.minDotRadius + (CONFIG.maxDotRadius - CONFIG.minDotRadius) * rTone) * rJitter[i];

          const rho = Math.hypot(rx, ry);
          if (rho > 0.92) {
            const edgeDist = Math.max(0, Math.min(1, (1.0 - rho) / 0.08));
            const maxAllowed = CONFIG.maxDotRadius * (0.35 + 0.65 * edgeDist);
            rRef = Math.min(rRef, maxAllowed);
          }

          const rScaled = rRef * scaleFactor;
          const r = Math.max(CONFIG.minOceanRadiusCss, rScaled);

          ctx2d.moveTo(sx + r, sy);
          ctx2d.arc(sx, sy, r, 0, Math.PI * 2);
        }
        ctx2d.fill();
        ctx2d.restore();
        const tDraw1 = performance.now();
        drawTimeRef.current = drawTimeRef.current * 0.95 + (tDraw1 - tDraw0) * 0.05;
      }

      // Debug HUD (?debug=1)
      if (debugCanvas && isDebug) {
        const dctx = debugCanvas.getContext('2d');
        if (dctx) {
          dctx.clearRect(0, 0, debugCanvas.width, debugCanvas.height);
          debugCanvas.style.display = 'block';
          dctx.save();
          dctx.scale(dpr, dpr);

          // Dibujar segmentos activos y frentes de onda sobre el planeta
          if (wave1Ref.current && wave1Ref.current.segments.length > 0) {
            const w1 = wave1Ref.current;
            dctx.strokeStyle = '#2F6F6B';
            dctx.lineWidth = 2.5;
            dctx.setLineDash([]);
            for (const seg of w1.segments) {
              dctx.beginPath();
              dctx.moveTo(seg.startX / dpr, seg.startY / dpr);
              dctx.lineTo(seg.endX / dpr, seg.endY / dpr);
              dctx.stroke();

              dctx.fillStyle = '#2F6F6B';
              dctx.beginPath();
              dctx.arc(seg.endX / dpr, seg.endY / dpr, 3.5, 0, Math.PI * 2);
              dctx.fill();
            }

            // Frente de onda activa W1
            dctx.strokeStyle = 'rgba(47, 111, 107, 0.45)';
            dctx.lineWidth = 1.5;
            dctx.setLineDash([5, 4]);
            for (const seg of w1.segments) {
              dctx.beginPath();
              dctx.arc(seg.endX / dpr, seg.endY / dpr, w1.radius / dpr, 0, Math.PI * 2);
              dctx.stroke();
            }
            dctx.setLineDash([]);
          }

          if (wave2Ref.current && wave2Ref.current.segments.length > 0) {
            const w2 = wave2Ref.current;
            const w2Alpha = Math.max(0.1, w2.strength * 0.4);
            dctx.strokeStyle = `rgba(47, 111, 107, ${w2Alpha.toFixed(2)})`;
            dctx.lineWidth = 1.5;
            dctx.setLineDash([]);
            for (const seg of w2.segments) {
              dctx.beginPath();
              dctx.moveTo(seg.startX / dpr, seg.startY / dpr);
              dctx.lineTo(seg.endX / dpr, seg.endY / dpr);
              dctx.stroke();
            }

            // Frente de onda histórica W2
            dctx.strokeStyle = `rgba(47, 111, 107, ${(w2Alpha * 0.7).toFixed(2)})`;
            dctx.lineWidth = 1.0;
            dctx.setLineDash([3, 4]);
            for (const seg of w2.segments) {
              dctx.beginPath();
              dctx.arc(seg.endX / dpr, seg.endY / dpr, w2.radius / dpr, 0, Math.PI * 2);
              dctx.stroke();
            }
            dctx.setLineDash([]);
          }

          // Imán estático bajo el cursor
          if (isCursorInHeroRef.current) {
            const curX = cursorCanvasXRef.current;
            const curY = cursorCanvasYRef.current;
            dctx.strokeStyle = '#2F6F6B';
            dctx.lineWidth = 1.5;
            dctx.setLineDash([4, 4]);
            dctx.beginPath();
            dctx.arc(curX, curY, CONFIG.cursorFx.staticRadius * (rad / 350), 0, Math.PI * 2);
            dctx.stroke();

            dctx.setLineDash([]);
            dctx.fillStyle = '#2F6F6B';
            dctx.beginPath();
            dctx.arc(curX, curY, 3, 0, Math.PI * 2);
            dctx.fill();
          }

          // Panel de métricas e inspección HUD
          const meanSpacing = Math.sqrt((4 * Math.PI) / activePointsCountRef.current);
          const effectiveJitterPx = CONFIG.jitter * meanSpacing * rad;
          const minFloor = containerWidthRef.current >= CONFIG.breakpointDesktop ? 12000 : 9000;
          const cursorSpeed = Math.round(Math.hypot(cursorVelocityXRef.current, cursorVelocityYRef.current));
          const w1Segs = wave1Ref.current ? wave1Ref.current.segments.length : 0;
          const w2Segs = wave2Ref.current ? wave2Ref.current.segments.length : 0;
          const motionState = isMovingRef.current ? 'MOVIMIENTO' : 'REPOSO';

          dctx.fillStyle = 'rgba(251, 250, 246, 0.95)';
          dctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
          dctx.lineWidth = 1;
          dctx.fillRect(16, 16, 330, 112);
          dctx.strokeRect(16, 16, 330, 112);

          dctx.fillStyle = '#111111';
          dctx.font = '600 12px monospace';
          dctx.fillText(`FPS: ${fpsRef.current.toFixed(1)} | ${activeRendererLabel} | DPR: ${dpr.toFixed(2)}`, 26, 34);
          dctx.font = '500 11px monospace';
          dctx.fillText(`Points: ${activePointsCountRef.current} (CONFIG: ${CONFIG.pointsDesktop}) | Jitter: ${effectiveJitterPx.toFixed(2)}px`, 26, 50);
          const activeWarpMax = urlWarpOverride !== null ? urlWarpOverride : CONFIG.cursorFx.warpMax;
          dctx.fillText(`Auto-red: ${hasAutoReducedPoints ? 'SI' : 'NO'} (Piso: ${minFloor}) | Warp: ${activeWarpMax.toFixed(1)}px`, 26, 66);
          dctx.fillText(`u_cursorActive: ${cursorActive} | ${motionState} | W1=${w1Segs}, W2=${w2Segs} | Vel: ${cursorSpeed}px/s`, 26, 82);
          dctx.fillText(`JS CPU: ${cpuTimeRef.current.toFixed(2)}ms | Draw: ${drawTimeRef.current.toFixed(2)}ms | DOM: ${domTimeRef.current.toFixed(2)}ms`, 26, 98);

          dctx.restore();

          if (typeof window !== 'undefined') {
            (window as any).__PLANET_HERO_PERF__ = {
              fps: Number(fpsRef.current.toFixed(1)),
              renderer: activeRendererLabel,
              dpr: Number(dpr.toFixed(2)),
              canvasW: canvas.width,
              canvasH: canvas.height,
              cpuMs: Number(cpuTimeRef.current.toFixed(2)),
              drawMs: Number(drawTimeRef.current.toFixed(2)),
              domMs: Number(domTimeRef.current.toFixed(2)),
              points: activePointsCountRef.current,
              effectiveJitterPx: Number(effectiveJitterPx.toFixed(2)),
              autoReduced: hasAutoReducedPoints,
              motionState,
              w1Segs,
              w2Segs,
              cursorSpeed,
            };
          }
        }
      } else if (debugCanvas && !isDebug) {
        debugCanvas.style.display = 'none';
      }

      // Restricción horizontal adaptativa para mobile (evita overflow horizontal y cortes)
      // Usar containerWidthRef en vez de getBoundingClientRect para evitar layout thrashing
      const tBeforeDom = performance.now();
      cpuTimeRef.current = cpuTimeRef.current * 0.95 + Math.max(0, tBeforeDom - tStart - drawTimeRef.current) * 0.05;

      const containerW = containerWidthRef.current || 390;
      const maxAllowedLabelHoriz = isMobileRef.current
        ? Math.max(rad * 0.85, (containerW / 2) - 68)
        : (containerW / 2) - 16;
      const maxAllowedCircleHoriz = isMobileRef.current
        ? Math.max(rad * 0.90, (containerW / 2) - 40)
        : (containerW / 2) - 16;

      const horizClampFactorLabel = isMobileRef.current
        ? Math.min(1.0, maxAllowedLabelHoriz / (rad * 1.45))
        : 1.0;
      const horizClampFactorCircle = isMobileRef.current
        ? Math.min(1.0, maxAllowedCircleHoriz / (rad * 1.70))
        : 1.0;

      // Proyección de Etiquetas Orbitales
      for (let i = 0; i < ORBIT_LABELS.length; i++) {
        const el = labelRefs.current[i];
        if (!el) continue;

        let projX = 0;
        let projY = 0;
        let projZ = 0;
        let projZNorm = 0;
        let projScale = 1.0;
        let projOpacity = 1.0;
        let projBlur = 0;

        if (prefersReducedMotion) {
          const rm = REDUCED_MOTION_LABELS[i];
          projX = rm.xNorm * rad * horizClampFactorLabel;
          projY = rm.yNorm * rad;
          projZ = rm.zNorm * rad;
          projZNorm = rm.zNorm;
          projScale = 1.0;
          projOpacity = 1.0;
          projBlur = 0;
        } else {
          const proj = projectOrbit(
            ORBIT_LABELS[i],
            orbitTimeRef.current,
            rad,
            labelProjections.current[i]
          );
          projX = proj.x * horizClampFactorLabel;
          projY = proj.y;
          projZ = proj.z;
          projZNorm = proj.zNorm;
          projScale = proj.scale;
          projOpacity = proj.opacity;
          projBlur = proj.blur;
        }

        if (isMobileRef.current) {
          const halfCardW = 68;
          const maxCenter = Math.max(20, (containerW / 2) - halfCardW - 12);
          projX = Math.max(-maxCenter, Math.min(maxCenter, projX));
        }

        const depthFactor = (projZNorm + 1) * 0.5;
        const parallaxScale = 0.3 + 0.7 * depthFactor;
        const paraX = prefersReducedMotion ? 0 : -currentNormXRef.current * CONFIG.parallaxMax * parallaxScale;
        const paraY = prefersReducedMotion ? 0 : -currentNormYRef.current * CONFIG.parallaxMax * parallaxScale;

        el.style.transform = `translate3d(${(projX + paraX).toFixed(1)}px, ${(-projY + paraY).toFixed(1)}px, 0) translate(-50%, -50%) scale(${projScale.toFixed(3)})`;
        el.style.opacity = projOpacity.toFixed(2);
        el.style.filter = projBlur > 0.05 ? `blur(${projBlur.toFixed(1)}px)` : 'none';

        const zIdx = projZ >= 0 ? 20 + Math.round(((projZNorm + 1) / 2) * 20) : 1 + Math.round(((projZNorm + 1) / 2) * 8);
        el.style.zIndex = String(zIdx);
      }

      // Proyección de Círculos de Previews de Trabajos
      for (let i = 0; i < WORKS.length; i++) {
        const el = circleRefs.current[i];
        if (!el) continue;

        let projX = 0;
        let projY = 0;
        let projZ = 0;
        let projZNorm = 0;
        let projScale = 1.0;
        let projOpacity = 1.0;
        let projBlur = 0;

        if (prefersReducedMotion) {
          const rm = REDUCED_MOTION_CIRCLES[i];
          projX = rm.xNorm * rad * horizClampFactorCircle;
          projY = rm.yNorm * rad;
          projZ = rm.zNorm * rad;
          projZNorm = rm.zNorm;
          projScale = 1.0;
          projOpacity = 1.0;
          projBlur = 0;
        } else {
          const proj = projectOrbit(
            CONFIG.circleOrbits[i],
            circleTimesRef.current[i],
            rad,
            circleProjections.current[i]
          );
          projX = proj.x * horizClampFactorCircle;
          projY = proj.y;
          projZ = proj.z;
          projZNorm = proj.zNorm;
          projScale = proj.scale;
          projOpacity = proj.opacity;
          projBlur = proj.blur;
        }

        if (isMobileRef.current) {
          const halfCircleW = 36;
          const maxCenter = Math.max(20, (containerW / 2) - halfCircleW - 8);
          projX = Math.max(-maxCenter, Math.min(maxCenter, projX));
        }

        const depthFactor = (projZNorm + 1) * 0.5;
        const parallaxScale = 0.3 + 0.7 * depthFactor;
        const paraX = prefersReducedMotion ? 0 : -currentNormXRef.current * CONFIG.parallaxMax * parallaxScale;
        const paraY = prefersReducedMotion ? 0 : -currentNormYRef.current * CONFIG.parallaxMax * parallaxScale;

        el.style.transform = `translate3d(${(projX + paraX).toFixed(1)}px, ${(-projY + paraY).toFixed(1)}px, 0) translate(-50%, -50%) scale(${projScale.toFixed(3)})`;
        el.style.opacity = projOpacity.toFixed(2);
        el.style.filter = projBlur > 0.05 ? `blur(${projBlur.toFixed(1)}px)` : 'none';

        const zIdx = projZ >= 0 ? 20 + Math.round(((projZNorm + 1) / 2) * 20) : 1 + Math.round(((projZNorm + 1) / 2) * 8);
        el.style.zIndex = String(zIdx);

        const isBehind = projZNorm < -0.2;
        el.style.pointerEvents = isBehind ? 'none' : 'auto';
        el.setAttribute('tabindex', isBehind ? '-1' : '0');

        if (isBehind && hoveredCircleIndexRef.current === i) {
          hoveredCircleIndexRef.current = -1;
          setHoveredCircle(null);
        }
      }

      const tAfterDom = performance.now();
      domTimeRef.current = domTimeRef.current * 0.95 + (tAfterDom - tBeforeDom) * 0.05;
    };

    const startTimeGlobal = performance.now();
    const animate = (currentTime: number) => {
      const rawDt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      const dt = Math.min(rawDt, CONFIG.maxDeltaTime);

      frameCount++;
      fpsAccumTime += rawDt;
      if (fpsAccumTime >= 0.5) {
        const currentFps = frameCount / fpsAccumTime;
        fpsRef.current = currentFps;
        frameCount = 0;
        fpsAccumTime = 0;

        // Auto-reducción adaptativa con piso estricto (12000 en desktop, 9000 en mobile)
        if (isPageVisible && isVisible && !document.hidden && document.visibilityState === 'visible') {
          const isDesktop = containerWidthRef.current >= CONFIG.breakpointDesktop;
          const minFloor = isDesktop ? 12000 : 9000;
          if (!hasAutoReducedPoints && currentFps < CONFIG.fpsLowThreshold) {
            lowFpsAccumTime += 0.5;
            if (lowFpsAccumTime >= CONFIG.fpsEvalDuration) {
              const candidatePts = Math.floor(activePointsCountRef.current * CONFIG.pointsReductionRatio);
              const newPts = Math.max(minFloor, candidatePts);
              if (newPts < activePointsCountRef.current) {
                hasAutoReducedPoints = true;
                activePointsCountRef.current = newPts;
                updateSphereForPoints(newPts);
              } else {
                lowFpsAccumTime = 0;
              }
            }
          } else if (currentFps >= CONFIG.fpsLowThreshold) {
            lowFpsAccumTime = 0;
          }
        } else {
          lowFpsAccumTime = 0;
        }
      }

      const freeze = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('freeze') === '1';
      const dpr = getEffectiveDpr(isMobileRef.current);
      const rad = currentRadiusRef.current;
      const currentScale = (rad / CONFIG.cursorFx.refRadius) * dpr;

      // Lerp del cursor
      if (smoothMouseRef.current.targetX === -9999) {
        smoothMouseRef.current.x = -9999;
        smoothMouseRef.current.y = -9999;
      } else {
        if (smoothMouseRef.current.x === -9999) {
          smoothMouseRef.current.x = smoothMouseRef.current.targetX;
          smoothMouseRef.current.y = smoothMouseRef.current.targetY;
        } else {
          smoothMouseRef.current.x += (smoothMouseRef.current.targetX - smoothMouseRef.current.x) * CONFIG.cursorFx.mouseLerp;
          smoothMouseRef.current.y += (smoothMouseRef.current.targetY - smoothMouseRef.current.y) * CONFIG.cursorFx.mouseLerp;
        }
      }

      const now = performance.now();
      if (!freeze && isMovingRef.current && now - lastMoveTimeRef.current > CONFIG.cursorFx.restThreshold) {
        isMovingRef.current = false;
        if (wave1Ref.current) {
          if (wave1Ref.current.segments.length > 0) {
            wave1Ref.current.stopTime = now;
            wave2Ref.current = { ...wave1Ref.current };
          }
          wave1Ref.current = null;
        }
      }

      // Actualización de Wave 1 (Activa)
      if (wave1Ref.current && !freeze) {
        const mx = smoothMouseRef.current.targetX;
        const my = smoothMouseRef.current.targetY;
        let baseStrength = 1.0;
        if (!isMovingRef.current && wave1Ref.current.stopTime) {
          const elapsed = now - wave1Ref.current.stopTime;
          baseStrength = Math.max(0, 1 - elapsed / wave1Ref.current.lifetime);
        }

        let proximity = 0;
        const scaledMaxRadius = 150 * currentScale;
        if (baseStrength >= 0.22 && mx !== -9999 && wave1Ref.current.segments.length > 0 && wave1Ref.current.radius < scaledMaxRadius) {
          let minDist = 99999;
          for (const seg of wave1Ref.current.segments) {
            const dx = seg.endX - seg.startX;
            const dy = seg.endY - seg.startY;
            const lenSq = dx * dx + dy * dy;
            let t = lenSq > 0.0001 ? ((mx - seg.startX) * dx + (my - seg.startY) * dy) / lenSq : 0;
            t = Math.max(0, Math.min(1, t));
            const px = seg.startX + t * dx;
            const py = seg.startY + t * dy;
            const d = Math.hypot(mx - px, my - py);
            if (d < minDist) minDist = d;
          }
          const distToWaveFront = Math.abs(minDist - wave1Ref.current.radius);
          const x = distToWaveFront / (60 * currentScale);
          proximity = x < 1 ? Math.pow(1 - x * x, 2) : 0;
        }

        const bSpeed = CONFIG.cursorFx.waveSpeed * currentScale;
        const mSpeed = CONFIG.cursorFx.waveSpeedMax * currentScale;
        wave1Ref.current.speed = bSpeed + proximity * (mSpeed - bSpeed);
        wave1Ref.current.radius += wave1Ref.current.speed * dt;
        wave1Ref.current.strength = Math.min(1.0, baseStrength + proximity * 0.45);

        if (!isMovingRef.current && wave1Ref.current.stopTime && (now - wave1Ref.current.stopTime > wave1Ref.current.lifetime)) {
          wave1Ref.current = null;
        }
      }

      // Actualización de Wave 2 (Histórica)
      if (wave2Ref.current && wave2Ref.current.stopTime && !freeze) {
        wave2Ref.current.radius += wave2Ref.current.speed * dt;
        const elapsed = now - wave2Ref.current.stopTime;
        wave2Ref.current.strength = Math.max(0, 1 - elapsed / wave2Ref.current.lifetime);
        if (elapsed > wave2Ref.current.lifetime) {
          wave2Ref.current = null;
        }
      }

      // Rotación y órbitas
      if (!prefersReducedMotion && !freeze) {
        const dragSpinSpeed = dragVelocityXRef.current;
        spinAngleRef.current += (baseSpinSpeed * spinMultiplierRef.current + dragSpinSpeed) * dt;

        const orbitSpeedMultiplier = 1.0 + orbitVelocityPushRef.current;
        orbitTimeRef.current += orbitSpeedMultiplier * dt;

        for (let i = 0; i < WORKS.length; i++) {
          const isHovered = hoveredCircleIndexRef.current === i;
          const targetSpeed = isHovered ? 0.0 : 1.0;
          const factor = Math.min(1, dt / CONFIG.hoverSlowdown);
          circleSpeedsRef.current[i] += (targetSpeed - circleSpeedsRef.current[i]) * factor;
          circleTimesRef.current[i] += circleSpeedsRef.current[i] * orbitSpeedMultiplier * dt;
        }
      }

      const totalTimeSec = (currentTime - startTimeGlobal) / 1000;
      renderFrame(dt, totalTimeSec);

      if (isVisible && isPageVisible && !prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    renderFrame(0, 0);

    if (!prefersReducedMotion) {
      lastTime = performance.now();
      animationFrameId = requestAnimationFrame(animate);
    }

    // Pointer events en el contenedor
    let lastCanvasX = canvasWidthRef.current / 2;
    let lastCanvasY = canvasHeightRef.current / 2;
    let lastPointerTime = performance.now();

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') {
        isTouchDeviceRef.current = true;
      }

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvasWidthRef.current / rect.width;
      const scaleY = canvasHeightRef.current / rect.height;
      const dpr = getEffectiveDpr(isMobileRef.current);
      const rad = currentRadiusRef.current;
      const currentScale = (rad / CONFIG.cursorFx.refRadius) * dpr;

      const canvasX = (e.clientX - rect.left) * scaleX;
      const canvasY = (e.clientY - rect.top) * scaleY;
      const cX = canvasWidthRef.current / 2;
      const cY = canvasHeightRef.current / 2;

      cursorScreenXRef.current = e.clientX;
      cursorScreenYRef.current = e.clientY;
      cursorCanvasXRef.current = canvasX;
      cursorCanvasYRef.current = canvasY;
      isCursorInHeroRef.current = true;
      isCursorActiveRef.current = !isTouchDeviceRef.current;

      const physX = canvasX * dpr;
      const physY = canvasY * dpr;

      if (!isTouchDeviceRef.current) {
        smoothMouseRef.current.targetX = physX;
        smoothMouseRef.current.targetY = physY;

        const now = performance.now();
        const timeSinceLast = now - lastMoveTimeRef.current;

        if (!isMovingRef.current || timeSinceLast > CONFIG.cursorFx.restThreshold) {
          isMovingRef.current = true;

          if (wave1Ref.current && wave1Ref.current.segments.length > 0) {
            wave1Ref.current.stopTime = now;
            wave2Ref.current = { ...wave1Ref.current };
          }

          wave1Ref.current = {
            segments: [],
            radius: 0,
            speed: CONFIG.cursorFx.waveSpeed * currentScale,
            strength: 1.0,
            startTime: now,
            lifetime: CONFIG.cursorFx.waveLifetime,
          };

          lastMousePosRef.current = { x: physX, y: physY };
          lastSpawnTimeRef.current = now;
        }

        const lastPos = lastMousePosRef.current;
        const dist = Math.hypot(physX - lastPos.x, physY - lastPos.y);
        const minDist = CONFIG.cursorFx.minSegmentDist * currentScale;

        if (
          wave1Ref.current &&
          (dist > minDist || (wave1Ref.current.segments.length === 0 && dist > 4 * currentScale)) &&
          now - lastSpawnTimeRef.current > CONFIG.cursorFx.segmentInterval
        ) {
          wave1Ref.current.segments.push({
            startX: lastPos.x,
            startY: lastPos.y,
            endX: physX,
            endY: physY,
          });

          if (wave1Ref.current.segments.length > CONFIG.cursorFx.maxSegments) {
            wave1Ref.current.segments.shift();
          }

          lastMousePosRef.current = { x: physX, y: physY };
          lastSpawnTimeRef.current = now;
        }
        lastMoveTimeRef.current = now;
      }

      const dx = canvasX - cX;
      const dy = canvasY - cY;
      const normX = Math.max(-1.5, Math.min(1.5, dx / rad));
      const normY = Math.max(-1.5, Math.min(1.5, dy / rad));
      targetNormXRef.current = normX;
      targetNormYRef.current = normY;

      const now = performance.now();
      const dtPointer = Math.max(0.001, (now - lastPointerTime) / 1000);
      lastPointerTime = now;
      const vx = (canvasX - lastCanvasX) / dtPointer;
      const vy = (canvasY - lastCanvasY) / dtPointer;
      lastCanvasX = canvasX;
      lastCanvasY = canvasY;

      cursorVelocityXRef.current = vx;
      cursorVelocityYRef.current = vy;

      if (!isTouchDeviceRef.current && Math.abs(vx) > 80) {
        const pushDelta = Math.max(-CONFIG.orbitPushMax, Math.min(CONFIG.orbitPushMax, (vx / 1500) * CONFIG.orbitPushMax));
        orbitVelocityPushRef.current = Math.max(-CONFIG.orbitPushMax, Math.min(CONFIG.orbitPushMax, orbitVelocityPushRef.current + pushDelta * 0.25));
      }

      if (isDraggingRef.current) {
        const dragDx = e.clientX - lastDragPointerXRef.current;
        const dragDy = e.clientY - lastDragPointerYRef.current;
        const dtDrag = Math.max(0.001, (now - lastDragTimeRef.current) / 1000);

        lastDragPointerXRef.current = e.clientX;
        lastDragPointerYRef.current = e.clientY;
        lastDragTimeRef.current = now;

        const deltaAngle = (dragDx / rad) * 1.2;
        spinAngleRef.current += deltaAngle;

        if (!prefersReducedMotion) {
          dragAxisTiltDegRef.current = Math.max(-20, Math.min(20, dragAxisTiltDegRef.current - (dragDy / rad) * 20));
        }

        dragVelocityXRef.current = (dragDx / dtDrag) / rad * 1.2;
        dragVelocityYRef.current = (-dragDy / dtDrag) / rad * 20;
      } else {
        const distFromCenter = Math.hypot(dx, dy);
        const isOverDisc = distFromCenter <= rad;
        container.style.cursor = isOverDisc ? 'grab' : 'default';
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.closest('button, a, [role="button"]')) {
        return;
      }

      if (e.pointerType === 'touch') {
        isTouchDeviceRef.current = true;
      }

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvasWidthRef.current / rect.width;
      const scaleY = canvasHeightRef.current / rect.height;
      const canvasX = (e.clientX - rect.left) * scaleX;
      const canvasY = (e.clientY - rect.top) * scaleY;
      const cX = canvasWidthRef.current / 2;
      const cY = canvasHeightRef.current / 2;
      const distFromCenter = Math.hypot(canvasX - cX, canvasY - cY);

      if (distFromCenter <= currentRadiusRef.current) {
        isDraggingRef.current = true;
        dragVelocityXRef.current = 0;
        dragVelocityYRef.current = 0;
        lastDragPointerXRef.current = e.clientX;
        lastDragPointerYRef.current = e.clientY;
        lastDragTimeRef.current = performance.now();

        try {
          container.setPointerCapture(e.pointerId);
        } catch {
          // ignore
        }
        container.style.cursor = 'grabbing';
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        try {
          container.releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvasWidthRef.current / rect.width;
        const scaleY = canvasHeightRef.current / rect.height;
        const canvasX = (e.clientX - rect.left) * scaleX;
        const canvasY = (e.clientY - rect.top) * scaleY;
        const cX = canvasWidthRef.current / 2;
        const cY = canvasHeightRef.current / 2;
        const isOverDisc = Math.hypot(canvasX - cX, canvasY - cY) <= currentRadiusRef.current;
        container.style.cursor = isOverDisc ? 'grab' : 'default';
      }
    };

    const handlePointerLeave = () => {
      isCursorInHeroRef.current = false;
      isCursorActiveRef.current = false;
      targetNormXRef.current = 0;
      targetNormYRef.current = 0;
      smoothMouseRef.current.targetX = -9999;
      smoothMouseRef.current.targetY = -9999;
      lastMousePosRef.current = { x: -9999, y: -9999 };

      if (isMovingRef.current && wave1Ref.current) {
        if (wave1Ref.current.segments.length > 0) {
          wave1Ref.current.stopTime = performance.now();
          wave2Ref.current = { ...wave1Ref.current };
        }
        wave1Ref.current = null;
      }
      isMovingRef.current = false;

      if (!isDraggingRef.current) {
        container.style.cursor = 'default';
      }
    };

    const handleWindowBlur = () => {
      smoothMouseRef.current.targetX = -9999;
      smoothMouseRef.current.targetY = -9999;
      smoothMouseRef.current.x = -9999;
      smoothMouseRef.current.y = -9999;
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

    container.addEventListener('pointermove', handlePointerMove, { passive: true });
    container.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('pointerup', handlePointerUp);
    container.addEventListener('pointercancel', handlePointerUp);
    container.addEventListener('pointerleave', handlePointerLeave);
    window.addEventListener('blur', handleWindowBlur);

    // Soporte para cambios de orientación en dispositivos móviles
    const handleOrientationChange = () => {
      window.setTimeout(() => {
        updateDimensions();
        renderFrame(0, (performance.now() - startTimeGlobal) / 1000);
      }, 100);
    };
    window.addEventListener('orientationchange', handleOrientationChange);

    // ResizeObserver con debounce (Bloque 2)
    let resizeTimer: number | null = null;
    const ro = new ResizeObserver(() => {
      if (resizeTimer !== null) clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        updateDimensions();
        renderFrame(0, (performance.now() - startTimeGlobal) / 1000);
      }, 50);
    });
    ro.observe(container);

    // Pausa por IntersectionObserver y VisibilityChange (Bloque 3)
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isVisible = entry.isIntersecting;
        if (isVisible && isPageVisible && !prefersReducedMotion && animationFrameId === null) {
          lastTime = performance.now();
          animationFrameId = requestAnimationFrame(animate);
        } else if (!isVisible && animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    const handleVisibilityChange = () => {
      isPageVisible = !document.hidden;
      if (isPageVisible && isVisible && !prefersReducedMotion && animationFrameId === null) {
        lastTime = performance.now();
        animationFrameId = requestAnimationFrame(animate);
      } else if (!isPageVisible && animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Limpieza completa al desmontar (Bloque 4)
    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      if (resizeTimer !== null) clearTimeout(resizeTimer);

      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('pointerup', handlePointerUp);
      container.removeEventListener('pointercancel', handlePointerUp);
      container.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('orientationchange', handleOrientationChange);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
      motionQuery.removeEventListener('change', handleMotionChange);

      ro.disconnect();
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      if (gl) {
        if (discProgram) gl.deleteProgram(discProgram);
        if (pointsProgram) gl.deleteProgram(pointsProgram);
        if (quadBuffer) gl.deleteBuffer(quadBuffer);
        if (posBuffer) gl.deleteBuffer(posBuffer);
        if (landBuffer) gl.deleteBuffer(landBuffer);
        if (jitterBuffer) gl.deleteBuffer(jitterBuffer);
        if (quadVAO) gl.deleteVertexArray(quadVAO);
        if (pointsVAO) gl.deleteVertexArray(pointsVAO);
        // Note: No forzamos loseContext() en unmount para permitir que React StrictMode monte sin invalidar el contexto WebGL2 del canvas
      }
    };
  }, []);

  // Navegación por teclado alternativa para rotación del globo (Bloque 7)
  const handleContainerKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== containerRef.current) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      spinAngleRef.current -= CONFIG.keyboardRotateStep;
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      spinAngleRef.current += CONFIG.keyboardRotateStep;
    }
  };

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Presentación interactiva del portafolio"
      tabIndex={0}
      onKeyDown={handleContainerKeyDown}
      className="relative w-full max-w-[1280px] mx-auto flex items-center justify-center select-none overflow-x-clip overflow-y-visible mt-6 sm:mt-8 md:mt-4 lg:mt-10 mb-20 md:mb-28 min-h-[380px] sm:min-h-[460px] md:min-h-[480px] lg:min-h-[740px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black/10 rounded-xl"
      style={{
        isolation: 'isolate',
        zIndex: 'var(--z-planet, 10)',
        touchAction: 'pan-y',
      }}
    >
      {/* Capa A / C: 4 Etiquetas Orbitando en DOM (aria-hidden decorativo) */}
      {ORBIT_LABELS.map((orbit, idx) => (
        <div
          ref={(el) => {
            labelRefs.current[idx] = el;
          }}
          key={orbit.id}
          className="absolute will-change-transform select-none pointer-events-none transition-none"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate3d(0, 0, 0) translate(-50%, -50%)',
            zIndex: 'var(--z-orbit-front, 20)',
          }}
          aria-hidden="true"
        >
          {/* Tarjeta de papel con pin granate (#7A2E4D) */}
          <div
            className="relative flex items-center justify-center rounded-[4px] border border-black/15 shadow-[0_6px_14px_rgba(0,0,0,0.12)]"
            style={{
              backgroundColor: '#FBFAF6',
              padding: '8px 14px',
            }}
          >
            <span
              className="absolute -top-[5px] -left-[5px] w-[10px] h-[10px] rounded-[1px] shadow-xs pointer-events-none"
              style={{ backgroundColor: '#7A2E4D' }}
            />
            <span className="font-sans text-[14px] md:text-[16px] font-medium text-[#1a1a1a] leading-none whitespace-nowrap tracking-tight">
              {orbit.text}
            </span>
          </div>
        </div>
      ))}

      {/* Capa A / C: 4 Círculos de Previews de Trabajos en Órbita */}
      {WORKS.map((work, idx) => {
        const isHovered = hoveredCircle === idx;
        const hasUrl = Boolean(work.url && work.url.trim().length > 0);
        const isHash = hasUrl && work.url.startsWith('#');

        const commonProps = {
          ref: (el: HTMLElement | null) => {
            circleRefs.current[idx] = el;
          },
          'aria-label': `Ver trabajo: ${work.title}`,
          onMouseEnter: () => handleCircleMouseEnter(idx),
          onMouseLeave: () => handleCircleMouseLeave(idx),
          onFocus: () => handleCircleMouseEnter(idx),
          onBlur: () => handleCircleMouseLeave(idx),
          onKeyDown: (e: React.KeyboardEvent) => {
            if (e.key === 'Escape') {
              handleCircleMouseLeave(idx);
              (e.currentTarget as HTMLElement).blur();
            }
          },
          className: "absolute will-change-transform block select-none cursor-pointer group focus-visible:outline-2 focus-visible:outline-[#2F6F6B] focus-visible:outline-offset-4 rounded-full",
          style: {
            left: '50%',
            top: '50%',
            transform: 'translate3d(0, 0, 0) translate(-50%, -50%)',
            zIndex: 'var(--z-orbit-front, 20)',
          },
        };

        const innerContent = (
          <>
            <div
              className="relative rounded-full overflow-hidden transition-transform duration-200 ease-out will-change-transform flex items-center justify-center w-[64px] h-[64px] md:w-[90px] md:h-[90px]"
              style={{
                border: `3px solid ${CONFIG.circleBorderColor}`,
                boxShadow: '0 6px 16px rgba(0,0,0,0.18)',
                backgroundColor: '#FBFAF6',
                transform: isHovered ? `scale(${CONFIG.hoverScale})` : 'scale(1)',
              }}
            >
              <img
                src={work.src}
                alt={work.title}
                onError={(e) => {
                  const target = e.currentTarget;
                  const fallback = work.placeholder || `/previews/placeholder-${idx + 1}.svg`;
                  if (target.src !== fallback) {
                    target.src = fallback;
                  }
                }}
                className="w-full h-full object-cover pointer-events-none select-none"
                loading="eager"
              />
            </div>

            {/* Tooltip accesible con título del proyecto */}
            <div
              className={`absolute bottom-[calc(100%+10px)] left-1/2 -translate-x-1/2 pointer-events-none transition-all duration-200 ease-out ${
                isHovered
                  ? 'opacity-100 scale-100 translate-y-0'
                  : 'opacity-0 scale-95 translate-y-1 group-focus-visible:opacity-100 group-focus-visible:scale-100 group-focus-visible:translate-y-0'
              }`}
              style={{ zIndex: 100 }}
              role="tooltip"
            >
              <div
                className="relative flex items-center justify-center rounded-[3px] border border-black/15 shadow-[0_4px_12px_rgba(0,0,0,0.12)] whitespace-nowrap"
                style={{
                  backgroundColor: '#FBFAF6',
                  padding: '4px 8px',
                }}
              >
                <span
                  className="absolute -top-[3px] -left-[3px] w-[7px] h-[7px] rounded-[1px] shadow-xs pointer-events-none"
                  style={{ backgroundColor: '#7A2E4D' }}
                />
                <span className="font-sans text-[12px] sm:text-[13px] font-medium text-[#1a1a1a] leading-none tracking-tight">
                  {work.title}
                </span>
              </div>
            </div>
          </>
        );

        if (!hasUrl) {
          return (
            <button
              key={work.src}
              type="button"
              {...commonProps}
            >
              {innerContent}
            </button>
          );
        }

        if (isHash) {
          return (
            <a
              key={work.src}
              href={work.url}
              onClick={(e) => {
                e.preventDefault();
                const target = document.querySelector(work.url);
                if (target) {
                  target.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              {...commonProps}
            >
              {innerContent}
            </a>
          );
        }

        return (
          <a
            key={work.src}
            href={work.url}
            target="_blank"
            rel="noopener noreferrer"
            {...commonProps}
          >
            {innerContent}
          </a>
        );
      })}

      {/* Capa B: Canvas del Planeta (WebGL2 / Fallback 2D) */}
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Planeta Tierra interactivo hecho de puntos de semitono"
        className="block mx-auto pointer-events-none drop-shadow-sm relative"
        style={{ zIndex: 'var(--z-planet, 10)' }}
      />

      {/* Canvas Overlay de Debug (?debug=1) */}
      <canvas
        ref={debugCanvasRef}
        className="absolute inset-0 mx-auto pointer-events-none"
        style={{
          zIndex: 'calc(var(--z-planet, 10) + 1)',
          display: 'none',
        }}
      />
    </div>
  );
});
