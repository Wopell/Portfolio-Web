import sharp from 'sharp';

// CONFIG conforming strictly to user specification
const CONFIG = {
  canvasWidth: 920,
  canvasHeight: 580,
  baseRadius: 360,
  squash: 0.65, // Relación alto/ancho ~0.65 (óvalo grueso)
  tilt: -20, // Inclinación en grados
  light: [-0.6, -0.7, 0.5], // Arriba-izquierda-frente
  limbDarken: 0.3, // Peso del oscurecimiento por limbo (reducido para no hacer marco)
  shadowContrast: 1.8, // Curva de contraste del brillo
  minDotRadius: 0.6, // Radio mínimo en zonas iluminadas (muy chicos o ausentes)
  maxDotRadius: 5.0, // Radio máximo en sombra profunda
  noiseScale: 2.2, // Escala de frecuencia del ruido
  noiseStrength: 0.45, // Fuerza de los parches oscuros
  totalPoints: 10000,
  jitterAmount: 0.018,
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

// 3D low frequency noise with distinct patch lobes
function getOrganicPatches(x, y, z, scale) {
  const s = scale;
  const n1 = Math.sin(x * s * 1.2 + 0.8) * Math.cos(y * s * 1.1 - 0.4) * Math.sin(z * s * 1.3 + 0.2);
  const n2 = Math.cos(x * s * 2.3 - 1.2) * Math.sin(y * s * 2.1 + 0.9) * Math.cos(z * s * 2.0);
  const n3 = Math.sin(x * s * 3.5 + 1.5) * Math.cos(y * s * 3.2);
  const raw = n1 * 0.55 + n2 * 0.32 + n3 * 0.13; // [-1, 1]
  const val = (raw + 1) * 0.5; // [0, 1]
  // Create distinct patch islands
  return Math.pow(Math.max(0, val - 0.35) / 0.65, 1.6);
}

const radiusX = CONFIG.baseRadius;
const radiusY = CONFIG.baseRadius * CONFIG.squash;
const radiusZ = CONFIG.baseRadius * 0.75;
const tiltRad = (CONFIG.tilt * Math.PI) / 180;
const cosT = Math.cos(tiltRad);
const sinT = Math.sin(tiltRad);

const width = CONFIG.canvasWidth;
const height = CONFIG.canvasHeight;
const cx = width / 2;
const cy = height / 2;
const phiGolden = Math.PI * (3 - Math.sqrt(5));

const dots = [];

for (let i = 0; i < CONFIG.totalPoints; i++) {
  const y = 1 - (i / (CONFIG.totalPoints - 1)) * 2;
  const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = phiGolden * i;
  const x = Math.cos(theta) * radiusAtY;
  const z = Math.sin(theta) * radiusAtY;

  // Hemisferio frontal visible
  if (z < -0.02) continue;

  const rand1 = pseudoRandom(i * 1.618);
  const rand2 = pseudoRandom(i * 3.141);
  const rand3 = pseudoRandom(i * 2.718);

  // Jitter radial fijo (borde orgánico, sin parpadeo)
  const radialMod = 1 + (rand1 - 0.5) * CONFIG.jitterAmount;

  // Deformación elipsoide local
  const px = x * radiusX * radialMod;
  const py = y * radiusY * radialMod;
  const pz = z * radiusZ;

  // Proyección de pantalla con inclinación diagonal (~-20°)
  const sx = px * cosT - py * sinT + (rand2 - 0.5) * 1.0;
  const sy = px * sinT + py * cosT + (rand3 - 0.5) * 1.0;

  // Normal en superficie del elipsoide
  const nx = x / radiusX;
  const ny = y / radiusY;
  const nz = z / radiusZ;
  const [normXLocal, normYLocal, normZ] = normalize(nx, ny, nz);

  // Normal rotada al espacio pantalla
  const normX = normXLocal * cosT - normYLocal * sinT;
  const normY = normXLocal * sinT + normYLocal * cosT;

  // Producto escalar dot(normal, luz): luz arriba-izq-frente
  const nDotL = normX * lx + normY * ly + normZ * lz;

  // Brillo base normalizado [0, 1]
  let rawBrightness = (nDotL * 0.5 + 0.5);
  rawBrightness = Math.max(0, Math.min(1, rawBrightness));

  // Peso de sombra (0 en zona iluminada, 1 en zona de sombra)
  const shadowWeight = Math.pow(1 - rawBrightness, 1.3);

  // 3 o 4 parches oscuros generados con noise de baja frecuencia, concentrados en el lado de sombra
  const patchNoise = getOrganicPatches(x, y, z, CONFIG.noiseScale);
  const patchDarkening = patchNoise * CONFIG.noiseStrength * shadowWeight;

  // Oscurecimiento de limbo sutil (CONFIG.limbDarken ~0.3)
  // Se modula con shadowWeight para no oscurecer el limbo iluminado
  const limbFactor = (1 - Math.max(0, z)) * CONFIG.limbDarken * shadowWeight * 0.6;

  // Brillo final
  let brightness = rawBrightness - patchDarkening - limbFactor;
  brightness = Math.max(0, Math.min(1, brightness));

  // Curva de contraste: shade = (1 - brightness) ** CONFIG.shadowContrast
  const shade = Math.pow(1 - brightness, CONFIG.shadowContrast);

  // Zona hiper-iluminada (arriba-izq): puntos casi ausentes / muy sutiles
  if (brightness > 0.88 && rand1 < (brightness - 0.88) * 4.2) {
    continue;
  }

  // Radio variable de semitono
  const rJitter = 1 + (rand3 - 0.5) * 0.1;
  let r = (CONFIG.minDotRadius + (CONFIG.maxDotRadius - CONFIG.minDotRadius) * shade) * rJitter;

  // Amortiguar en el limbo extremo
  if (z < 0.16) {
    r = Math.min(r, CONFIG.maxDotRadius * 0.75);
  }

  dots.push({
    x: cx + sx,
    y: cy + sy,
    r: Math.max(0.35, r),
    z: pz,
  });
}

dots.sort((a, b) => a.z - b.z);

const svgElements = dots.map(d => 
  `<circle cx="${d.x.toFixed(1)}" cy="${d.y.toFixed(1)}" r="${d.r.toFixed(2)}" fill="#111111" />`
).join('\n');

const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#F1EEE6"/>
  ${svgElements}
</svg>`;

const outPath = 'C:/Users/Tomyp/.gemini/antigravity/brain/863dbce5-1730-4fcc-83dc-6561cdd72ad6/test_fase1_refine.png';
await sharp(Buffer.from(svg)).png().toFile(outPath);
console.log('Saved test to:', outPath);
