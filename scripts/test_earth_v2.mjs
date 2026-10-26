import fs from 'fs';
import sharp from 'sharp';
import * as topojson from 'topojson-client';
import { geoEquirectangular, geoPath } from 'd3-geo';

const landTopology = JSON.parse(fs.readFileSync('node_modules/world-atlas/land-110m.json', 'utf8'));

// CONFIG con los 5 ajustes del usuario
const CONFIG = {
  canvasWidth: 860,
  canvasHeight: 740,
  radius: 350,
  points: 18000, // ~9000 puntos en hemisferio frontal para que las costas sean ultra nítidas
  axisTilt: 23.5, // Grados de inclinación Z (roll en pantalla)
  spinPeriod: 40,
  initialLon: 15, // 15° E para África y Europa de frente
  light: [-0.6, -0.7, 0.5], // Arriba-izquierda-frente
  shadowContrast: 1.6,
  shadowWeight: 0.55,
  landWeight: 0.70, // Contraste firme de tierra
  contrast: 1.25,
  oceanShadowMax: 0.40, // Océano en sombra nunca supera 0.40 de sombra
  minDotRadius: 0.45,
  maxDotRadius: 4.8,
  backOpacity: 0.0,
  jitter: 0.010, // Jitter fino
  dotColor: '#111111',
};

// 1. Generar máscara 2048x1024 con blur ~1px
const maskWidth = 2048;
const maskHeight = 1024;
const projection = geoEquirectangular().fitSize([maskWidth, maskHeight], { type: 'Sphere' });
const landFeature = topojson.feature(landTopology, landTopology.objects.land);
const pathGenerator = geoPath(projection);
const svgPath = pathGenerator(landFeature);

const maskSvg = `<svg width="${maskWidth}" height="${maskHeight}" viewBox="0 0 ${maskWidth} ${maskHeight}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${maskWidth}" height="${maskHeight}" fill="#000000" />
  <path d="${svgPath}" fill="#ffffff" stroke="none" />
</svg>`;

console.log('Generating 2048x1024 mask with 1.0px blur...');
const maskBuffer = await sharp(Buffer.from(maskSvg))
  .blur(1.0)
  .raw()
  .toBuffer({ resolveWithObject: true });

const maskData = maskBuffer.data;
console.log('Mask generated successfully.');

function sampleLandMask(lonDeg, latDeg) {
  // lon [-180, 180] -> u [0, 1]
  // lat [-90, 90] -> v [0, 1] donde lat = +90 (North) -> v = 0
  let u = (lonDeg + 180) / 360;
  u = (u % 1 + 1) % 1;
  const v = Math.max(0, Math.min(1, (90 - latDeg) / 180));

  const px = Math.min(maskWidth - 1, Math.floor(u * maskWidth));
  const py = Math.min(maskHeight - 1, Math.floor(v * maskHeight));
  const idx = (py * maskWidth + px) * maskBuffer.info.channels;
  return maskData[idx] / 255;
}

function normalize(x, y, z) {
  const len = Math.hypot(x, y, z) || 1;
  return [x / len, y / len, z / len];
}

const [lx, ly, lz] = normalize(...CONFIG.light);

function pseudoRandom(seed) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// 2. Precomputar puntos Fibonacci en esfera unitaria 3D
// Convención estándar:
// y = +1 -> Polo Norte (ARRIBA)
// y = -1 -> Polo Sur (ABAJO)
// x = cos(lat) * sin(lon), z = cos(lat) * cos(lon)
// Frente (z > 0), lon = 0° es Greenwich
const phiGolden = Math.PI * (3 - Math.sqrt(5));
const totalPoints = CONFIG.points;

const baseLat = new Float32Array(totalPoints);
const baseLon = new Float32Array(totalPoints);
const isLand = new Float32Array(totalPoints);
const baseX = new Float32Array(totalPoints);
const baseY = new Float32Array(totalPoints);
const baseZ = new Float32Array(totalPoints);
const rJitter = new Float32Array(totalPoints);
const skipRand = new Float32Array(totalPoints);

for (let i = 0; i < totalPoints; i++) {
  // y va de +1 (Polo Norte) a -1 (Polo Sur)
  const y = 1 - (i / (totalPoints - 1)) * 2;
  const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = phiGolden * i;

  // En latitud/longitud:
  // lat = asin(y) [-PI/2, +PI/2]
  // lon = theta mod 2PI [-PI, +PI]
  const latRad = Math.asin(Math.max(-1, Math.min(1, y)));
  const latDeg = (latRad * 180) / Math.PI;

  // Posición esférica base donde Greenwich (lon = 0) está en (x=0, z=1)
  const x = Math.sin(theta) * radiusAtY;
  const z = Math.cos(theta) * radiusAtY;

  const lonRad = Math.atan2(x, z);
  const lonDeg = (lonRad * 180) / Math.PI;

  baseLat[i] = latRad;
  baseLon[i] = lonRad;
  isLand[i] = sampleLandMask(lonDeg, latDeg);

  const rand1 = pseudoRandom(i * 1.618);
  const rand2 = pseudoRandom(i * 3.141);
  const rand3 = pseudoRandom(i * 2.718);

  // Amortiguar jitter cerca de los polos para evitar arcos sueltos
  const polarDamping = Math.min(1, Math.sqrt(Math.max(0, 1 - y * y)) * 2.0);
  const jVal = 1 + (rand1 - 0.5) * CONFIG.jitter * polarDamping;

  baseX[i] = x * jVal;
  baseY[i] = y * jVal;
  baseZ[i] = z * jVal;

  rJitter[i] = 1 + (rand3 - 0.5) * 0.08;
  skipRand[i] = rand2;
}

console.log('Precalculated all Fibonacci points.');

// 3. Matriz de inclinación axial fija
// SOLO rotación Z de pantalla (sin cabeceo X), para que el norte quede ARRIBA inclinado a 23.5°
// En pantalla 2D donde North es UP:
// Si tilt es -23.5° (inclinación estándar hacia la derecha del norte):
const tiltRad = (-CONFIG.axisTilt * Math.PI) / 180;
const cosTilt = Math.cos(tiltRad);
const sinTilt = Math.sin(tiltRad);

// Matriz R_tilt (rotación alrededor de Z):
// [ cosTilt  -sinTilt   0 ]
// [ sinTilt   cosTilt   0 ]
// [    0         0      1 ]
const R00 = cosTilt;
const R01 = -sinTilt;
const R02 = 0;

const R10 = sinTilt;
const R11 = cosTilt;
const R12 = 0;

const R20 = 0;
const R21 = 0;
const R22 = 1;

const spinSpeed = (2 * Math.PI) / CONFIG.spinPeriod;
const initialAngle = (-CONFIG.initialLon * Math.PI) / 180; // 15° E al centro

const cx = CONFIG.canvasWidth / 2;
const cy = CONFIG.canvasHeight / 2;
const radius = CONFIG.radius;

async function renderFrame(timeSec, outPath) {
  // spinAngle acumulado (Oeste a Este: ángulo suma spinSpeed * timeSec)
  const spinAngle = initialAngle + spinSpeed * timeSec;
  const cT = Math.cos(spinAngle);
  const sT = Math.sin(spinAngle);

  // Matriz combinada M = R_tilt * R_spin(Y)
  // R_spin(Y) = [ cT  0  sT ]
  //             [  0  1   0 ]
  //             [-sT  0  cT ]
  const M00 = R00 * cT;
  const M01 = R01;
  const M02 = R00 * sT;

  const M10 = R10 * cT;
  const M11 = R11;
  const M12 = R10 * sT;

  const M20 = -sT;
  const M21 = 0;
  const M22 = cT;

  const dots = [];

  for (let i = 0; i < totalPoints; i++) {
    const x0 = baseX[i];
    const y0 = baseY[i];
    const z0 = baseZ[i];

    // Rotación 3D completa
    const rx = M00 * x0 + M01 * y0 + M02 * z0;
    const ry = M10 * x0 + M11 * y0 + M12 * z0;
    const rz = M20 * x0 + M21 * y0 + M22 * z0;

    // Hemisferio trasero estricto: z <= 0 no se dibuja
    if (rz <= 0.005) continue;

    // Normal unitaria = (rx, ry, rz)
    // Coordenadas de pantalla:
    // rx va a la derecha (+X)
    // ry va ARRIBA en 3D, por lo que en pantalla (donde Y crece hacia abajo):
    // py = cy - ry * radius! (Norte queda ARRIBA!)
    const px = cx + rx * radius;
    const py = cy - ry * radius;

    // Iluminación fija arriba-izquierda-frente:
    // lx < 0 (izquierda), ly < 0 (arriba en pantalla -> +Y en 3D), lz > 0 (frente)
    // En 3D: luz arriba es +Y!
    // Luz = [-0.6, 0.7, 0.5] normalizada
    const l3x = -0.6 / Math.hypot(-0.6, 0.7, 0.5);
    const l3y = 0.7 / Math.hypot(-0.6, 0.7, 0.5); // Arriba en 3D
    const l3z = 0.5 / Math.hypot(-0.6, 0.7, 0.5);

    const nDotL = rx * l3x + ry * l3y + rz * l3z;
    const lightFactor = Math.max(0, Math.min(1, nDotL * 0.5 + 0.5));
    const rawShade = Math.pow(1 - lightFactor, CONFIG.shadowContrast);

    const isL = isLand[i];

    // 3. SEPARAR TIERRA DE SOMBRA:
    // Limitar la contribución de sombra sobre el océano (oceanShadowMax ~ 0.40)
    // para que en el lado oscuro el océano nunca supere ese tono, mientras la tierra llega a 1.0
    const maxOceanShade = CONFIG.oceanShadowMax;
    const allowedShade = isL > 0.3 ? rawShade : Math.min(rawShade, maxOceanShade + (1.0 - maxOceanShade) * (isL / 0.3));

    const tone = Math.max(0, Math.min(1, allowedShade * CONFIG.shadowWeight + isL * CONFIG.landWeight));
    const rTone = Math.pow(tone, CONFIG.contrast);
    let r = (CONFIG.minDotRadius + (CONFIG.maxDotRadius - CONFIG.minDotRadius) * rTone) * rJitter[i];

    // Limbo extremo
    if (rz < 0.10) {
      r = Math.min(r, CONFIG.maxDotRadius * 0.65);
    }

    // Océano hiper-iluminado
    if (isL < 0.05 && lightFactor > 0.88 && skipRand[i] < 0.5) {
      continue;
    }

    dots.push({
      x: px,
      y: py,
      r: Math.max(0.35, r),
      z: rz,
    });
  }

  // Orden de atrás hacia adelante
  dots.sort((a, b) => a.z - b.z);

  const svgElements = dots.map(d => 
    `<circle cx="${d.x.toFixed(1)}" cy="${d.y.toFixed(1)}" r="${d.r.toFixed(2)}" fill="#111111" />`
  ).join('\n');

  const svg = `<svg width="${CONFIG.canvasWidth}" height="${CONFIG.canvasHeight}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#F1EEE6"/>
    ${svgElements}
  </svg>`;

  await sharp(Buffer.from(svg)).png().toFile(outPath);
  console.log(`Rendered frame at t=${timeSec}s to: ${outPath}`);
}

const outDir = 'C:/Users/Tomyp/.gemini/antigravity/brain/863dbce5-1730-4fcc-83dc-6561cdd72ad6';
await renderFrame(0, `${outDir}/test_v2_t0.png`);
await renderFrame(2, `${outDir}/test_v2_t2.png`);
await renderFrame(4, `${outDir}/test_v2_t4.png`);
