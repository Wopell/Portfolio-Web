import fs from 'fs';
import sharp from 'sharp';

// CONFIG adhering strictly to specifications
const CONFIG = {
  canvasWidth: 860,
  canvasHeight: 740,
  radius: 350,
  points: 12000,
  axisTilt: 23.5, // Grados
  spinPeriod: 40, // Segundos por vuelta
  initialSpinDeg: -20, // Centrar África y Europa
  maxDeltaTime: 0.05,
  light: [-0.6, -0.7, 0.5],
  shadowContrast: 1.6,
  shadowWeight: 0.55,
  landWeight: 0.65,
  contrast: 1.3,
  minDotRadius: 0.5,
  maxDotRadius: 4.8,
  backOpacity: 0.0,
  jitter: 0.015,
  dotColor: '#111111',
};

function normalize(x, y, z) {
  const len = Math.hypot(x, y, z) || 1;
  return [x / len, y / len, z / len];
}

const [lx, ly, lz] = normalize(...CONFIG.light);

function pseudoRandom(seed) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// Cargar máscara
const maskImage = sharp('public/earth-mask.png');
const { data: maskData, info: maskInfo } = await maskImage
  .raw()
  .toBuffer({ resolveWithObject: true });

function sampleLandMask(lonDeg, latDeg) {
  let u = (lonDeg + 180) / 360;
  u = (u % 1 + 1) % 1;
  const v = Math.max(0, Math.min(1, (90 - latDeg) / 180));
  const px = Math.min(maskInfo.width - 1, Math.floor(u * maskInfo.width));
  const py = Math.min(maskInfo.height - 1, Math.floor(v * maskInfo.height));
  const idx = (py * maskInfo.width + px) * maskInfo.channels;
  return maskData[idx] / 255;
}

// Precomputar posiciones fijas con jitter determinista e isLand
const phiGolden = Math.PI * (3 - Math.sqrt(5));
const basePoints = new Float32Array(CONFIG.points * 3);
const isLandArray = new Float32Array(CONFIG.points);
const rJitterArray = new Float32Array(CONFIG.points);
const skipRandArray = new Float32Array(CONFIG.points);

for (let i = 0; i < CONFIG.points; i++) {
  const y = 1 - (i / (CONFIG.points - 1)) * 2;
  const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = phiGolden * i;
  const x = Math.cos(theta) * radiusAtY;
  const z = Math.sin(theta) * radiusAtY;

  const latDeg = (Math.asin(Math.max(-1, Math.min(1, y))) * 180) / Math.PI;
  const lonDeg = (Math.atan2(x, z) * 180) / Math.PI;

  isLandArray[i] = sampleLandMask(lonDeg, latDeg);

  const rand1 = pseudoRandom(i * 1.618);
  const rand2 = pseudoRandom(i * 3.141);
  const rand3 = pseudoRandom(i * 2.718);

  const radialJitter = 1 + (rand1 - 0.5) * CONFIG.jitter;
  basePoints[i * 3] = x * radialJitter;
  basePoints[i * 3 + 1] = y * radialJitter;
  basePoints[i * 3 + 2] = z * radialJitter;

  rJitterArray[i] = 1 + (rand3 - 0.5) * 0.1;
  skipRandArray[i] = rand2;
}

// Matriz de inclinación fija R_tilt = R_Z(-axisTilt) * R_X(8°)
const tiltZRad = (-CONFIG.axisTilt * Math.PI) / 180;
const cZ = Math.cos(tiltZRad);
const sZ = Math.sin(tiltZRad);

const tiltXRad = (8 * Math.PI) / 180;
const cX = Math.cos(tiltXRad);
const sX = Math.sin(tiltXRad);

// R_tilt 3x3 entries:
const R00 = cZ;
const R01 = -sZ * cX;
const R02 = sZ * sX;

const R10 = sZ;
const R11 = cZ * cX;
const R12 = -cZ * sX;

const R20 = 0;
const R21 = sX;
const R22 = cX;

const spinSpeed = (2 * Math.PI) / CONFIG.spinPeriod;
const cx = CONFIG.canvasWidth / 2;
const cy = CONFIG.canvasHeight / 2;

// Función para renderizar un frame a un tiempo t dado
async function renderFrameAtTime(tSeconds, outputPath) {
  const spinAngle = (CONFIG.initialSpinDeg * Math.PI) / 180 + spinSpeed * tSeconds;
  const cT = Math.cos(spinAngle);
  const sT = Math.sin(spinAngle);

  // M = R_tilt * R_spin
  const M00 = R00 * cT - R02 * sT;
  const M01 = R01;
  const M02 = R00 * sT + R02 * cT;

  const M10 = R10 * cT - R12 * sT;
  const M11 = R11;
  const M12 = R10 * sT + R12 * cT;

  const M20 = R20 * cT - R22 * sT;
  const M21 = R21;
  const M22 = R20 * sT + R22 * cT;

  const dots = [];

  for (let i = 0; i < CONFIG.points; i++) {
    const x0 = basePoints[i * 3];
    const y0 = basePoints[i * 3 + 1];
    const z0 = basePoints[i * 3 + 2];

    const rx = M00 * x0 + M01 * y0 + M02 * z0;
    const ry = M10 * x0 + M11 * y0 + M12 * z0;
    const rz = M20 * x0 + M21 * y0 + M22 * z0;

    if (rz < -0.01) continue; // Hemisferio trasero

    const nDotL = rx * lx + ry * ly + rz * lz;
    const lightFactor = Math.max(0, Math.min(1, nDotL * 0.5 + 0.5));
    const shade = Math.pow(1 - lightFactor, CONFIG.shadowContrast);

    const isLand = isLandArray[i];
    const tone = Math.max(0, Math.min(1, shade * CONFIG.shadowWeight + isLand * CONFIG.landWeight));

    const rTone = Math.pow(tone, CONFIG.contrast);
    let r = (CONFIG.minDotRadius + (CONFIG.maxDotRadius - CONFIG.minDotRadius) * rTone) * rJitterArray[i];

    if (rz < 0.12) {
      r = Math.min(r, CONFIG.maxDotRadius * 0.72);
    }

    if (isLand < 0.1 && lightFactor > 0.88 && skipRandArray[i] < 0.52) {
      continue;
    }

    dots.push({
      x: cx + rx * CONFIG.radius,
      y: cy + ry * CONFIG.radius,
      r: Math.max(0.35, r),
      z: rz,
    });
  }

  dots.sort((a, b) => a.z - b.z);

  const svgElements = dots.map(d => 
    `<circle cx="${d.x.toFixed(1)}" cy="${d.y.toFixed(1)}" r="${d.r.toFixed(2)}" fill="#111111" />`
  ).join('\n');

  const svg = `<svg width="${CONFIG.canvasWidth}" height="${CONFIG.canvasHeight}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#F1EEE6"/>
    ${svgElements}
  </svg>`;

  await sharp(Buffer.from(svg)).png().toFile(outputPath);
  console.log(`Rendered frame at t=${tSeconds}s to: ${outputPath}`);
}

const outDir = 'C:/Users/Tomyp/.gemini/antigravity/brain/863dbce5-1730-4fcc-83dc-6561cdd72ad6';
await renderFrameAtTime(0, `${outDir}/phase2_test_t0.png`);
await renderFrameAtTime(2, `${outDir}/phase2_test_t2.png`);
await renderFrameAtTime(4, `${outDir}/phase2_test_t4.png`);
