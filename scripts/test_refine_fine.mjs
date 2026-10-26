import fs from 'fs';
import sharp from 'sharp';

const maskBuffer = await sharp('public/earth-mask-2048.png')
  .raw()
  .toBuffer({ resolveWithObject: true });

const maskWidth = 2048;
const maskHeight = 1024;
const maskData = maskBuffer.data;

function sampleLandMask(lonDeg, latDeg) {
  let u = (lonDeg + 180) / 360;
  u = (u % 1 + 1) % 1;
  const v = Math.max(0, Math.min(1, (90 - latDeg) / 180));
  const px = Math.min(maskWidth - 1, Math.floor(u * maskWidth));
  const py = Math.min(maskHeight - 1, Math.floor(v * maskHeight));
  const idx = (py * maskWidth + px) * maskBuffer.info.channels;
  return maskData[idx] / 255;
}

const CONFIG = {
  canvasWidth: 860,
  canvasHeight: 740,
  radius: 350,
  points: 18000,
  axisTilt: 23.5,
  initialLon: 22, // 22° E para África y Europa perfectamente al centro
  spinPeriod: 40,
  light: [-0.6, -0.7, 0.5],
  shadowContrast: 1.6,
  oceanShadowMax: 0.40, // Radio del océano en sombra máx ~40% de maxDotRadius
  landMinScale: 0.55, // Radio de tierra iluminada: 55% de maxDotRadius
  minDotRadius: 0.55, // Radio mínimo en océano iluminado (da cuerpo a la esfera)
  maxDotRadius: 4.8, // Radio máximo en tierra en sombra profunda
  limbDarken: 0.05, // Mínimo oscurecimiento en el limbo (el lado iluminado queda completamente claro)
  backOpacity: 0.0,
  jitter: 0.008,
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

const phiGolden = Math.PI * (3 - Math.sqrt(5));
const totalPoints = CONFIG.points;

const baseLat = new Float32Array(totalPoints);
const baseLon = new Float32Array(totalPoints);
const isLand = new Float32Array(totalPoints);
const baseX = new Float32Array(totalPoints);
const baseY = new Float32Array(totalPoints);
const baseZ = new Float32Array(totalPoints);
const rJitter = new Float32Array(totalPoints);

for (let i = 0; i < totalPoints; i++) {
  const y = 1 - (i / (totalPoints - 1)) * 2;
  const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = phiGolden * i;

  const latRad = Math.asin(Math.max(-1, Math.min(1, y)));
  const latDeg = (latRad * 180) / Math.PI;

  const x = Math.sin(theta) * radiusAtY;
  const z = Math.cos(theta) * radiusAtY;

  const lonRad = Math.atan2(x, z);
  const lonDeg = (lonRad * 180) / Math.PI;

  baseLat[i] = latRad;
  baseLon[i] = lonRad;
  isLand[i] = sampleLandMask(lonDeg, latDeg);

  const rand1 = pseudoRandom(i * 1.618);
  const rand3 = pseudoRandom(i * 2.718);

  const polarDamping = Math.min(1, Math.sqrt(Math.max(0, 1 - y * y)) * 2.5);
  const jVal = 1 + (rand1 - 0.5) * CONFIG.jitter * polarDamping;

  baseX[i] = x * jVal;
  baseY[i] = y * jVal;
  baseZ[i] = z * jVal;

  rJitter[i] = 1 + (rand3 - 0.5) * 0.08;
}

const tiltRad = (-CONFIG.axisTilt * Math.PI) / 180;
const cosTilt = Math.cos(tiltRad);
const sinTilt = Math.sin(tiltRad);

const R00 = cosTilt;
const R01 = -sinTilt;
const R02 = 0;
const R10 = sinTilt;
const R11 = cosTilt;
const R12 = 0;

const initialAngle = (-CONFIG.initialLon * Math.PI) / 180;
const cx = CONFIG.canvasWidth / 2;
const cy = CONFIG.canvasHeight / 2;
const radius = CONFIG.radius;

// Render de prueba a t = 0 (África al centro)
const cT = Math.cos(initialAngle);
const sT = Math.sin(initialAngle);

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

// Luz 3D arriba-izquierda-frente (+Y arriba)
const lHypot = Math.hypot(-0.6, 0.7, 0.5);
const l3x = -0.6 / lHypot;
const l3y = 0.7 / lHypot;
const l3z = 0.5 / lHypot;

for (let i = 0; i < totalPoints; i++) {
  const x0 = baseX[i];
  const y0 = baseY[i];
  const z0 = baseZ[i];

  const rx = M00 * x0 + M01 * y0 + M02 * z0;
  const ry = M10 * x0 + M11 * y0 + M12 * z0;
  const rz = M20 * x0 + M21 * y0 + M22 * z0;

  if (rz <= 0.005) continue; // Hemisferio trasero estricto

  const px = cx + rx * radius;
  const py = cy - ry * radius; // Norte arriba

  // Normal unitaria (rx, ry, rz)
  const nDotL = rx * l3x + ry * l3y + rz * l3z;
  const lightFactor = Math.max(0, Math.min(1, nDotL * 0.5 + 0.5));
  const shade = Math.pow(1 - lightFactor, CONFIG.shadowContrast);

  const isL = isLand[i];

  // 1. GRADIENTE DE LUZ EN LA TIERRA:
  // Lado iluminado: 55% de maxDotRadius. Lado sombra: 100% de maxDotRadius
  const landMinR = CONFIG.maxDotRadius * CONFIG.landMinScale;
  const landMaxR = CONFIG.maxDotRadius;
  const rLand = landMinR + (landMaxR - landMinR) * shade;

  // 2. OCÉANO CON CUERPO:
  // Mínimo = ~0.55px en luz, subiendo hasta oceanShadowMax * maxDotRadius en sombra
  const oceanMinR = CONFIG.minDotRadius;
  const oceanMaxR = CONFIG.maxDotRadius * CONFIG.oceanShadowMax;
  const rOcean = oceanMinR + (oceanMaxR - oceanMinR) * shade;

  // Mezcla continua entre tierra y océano según isL
  let r = (rOcean + (rLand - rOcean) * isL) * rJitter[i];

  // Limbo extremo
  if (rz < 0.08) {
    r = Math.min(r, CONFIG.maxDotRadius * 0.65);
  }

  dots.push({
    x: px,
    y: py,
    r: Math.max(0.4, r),
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

const outPath = 'C:/Users/Tomyp/.gemini/antigravity/brain/863dbce5-1730-4fcc-83dc-6561cdd72ad6/test_refine_fine.png';
await sharp(Buffer.from(svg)).png().toFile(outPath);
console.log('Saved test to:', outPath);
