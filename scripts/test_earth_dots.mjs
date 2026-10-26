import fs from 'fs';
import sharp from 'sharp';

// CONFIG strictly adhering to user request
const CONFIG = {
  canvasWidth: 920,
  canvasHeight: 700,
  radius: 350, // ~42% del ancho del contenedor (max-w-[860px] -> ~360px)
  points: 12000, // Total puntos esfera (~6000 visibles en hemisferio frontal)
  axisTilt: 23.5, // Inclinación del eje en grados
  spinAngle: -20, // Ángulo de giro estático para centrar África y Europa
  light: [-0.6, -0.7, 0.5], // Luz fija: arriba-izquierda-frente
  shadowContrast: 1.6, // Exponente de curva de sombra
  shadowWeight: 0.55, // Peso de la sombra en el tono
  landWeight: 0.65, // Peso de la tierra en el tono (para que los continentes resalten siempre)
  contrast: 1.3, // Exponente de contraste del tono final
  minDotRadius: 0.5, // Radio en océano iluminado (muy chico / casi vacío)
  maxDotRadius: 4.8, // Radio máximo en tierra y sombra profunda
  backOpacity: 0.0, // Opacidad hemisferio trasero (0.0 = no dibujar)
  jitter: 0.015, // Jitter radial fijo por punto
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

// Cargar máscara de tierra (1024x512)
const maskImage = sharp('public/earth-mask.png');
const { data: maskData, info: maskInfo } = await maskImage
  .raw()
  .toBuffer({ resolveWithObject: true });

console.log('Mask info:', maskInfo.width, maskInfo.height, maskInfo.channels);

function sampleLandMask(lonDeg, latDeg) {
  // Lon [-180, 180] -> u [0, 1]
  // Lat [-90, 90] -> v [0, 1] (0 = North, 1 = South)
  let u = (lonDeg + 180) / 360;
  u = (u % 1 + 1) % 1; // Wrap around [0, 1]
  const v = Math.max(0, Math.min(1, (90 - latDeg) / 180));

  const px = Math.min(maskInfo.width - 1, Math.floor(u * maskInfo.width));
  const py = Math.min(maskInfo.height - 1, Math.floor(v * maskInfo.height));
  const idx = (py * maskInfo.width + px) * maskInfo.channels;
  // White = land (255), Black = ocean (0)
  return maskData[idx] / 255;
}

// Precalcular puntos base y su máscara isLand
const phiGolden = Math.PI * (3 - Math.sqrt(5));
const basePoints = [];
const isLandArray = new Float32Array(CONFIG.points);

for (let i = 0; i < CONFIG.points; i++) {
  const y = 1 - (i / (CONFIG.points - 1)) * 2;
  const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = phiGolden * i;
  const x = Math.cos(theta) * radiusAtY;
  const z = Math.sin(theta) * radiusAtY;

  // Latitud y longitud geográficas originales
  const latRad = Math.asin(Math.max(-1, Math.min(1, y)));
  const latDeg = (latRad * 180) / Math.PI;
  const lonRad = Math.atan2(x, z);
  const lonDeg = (lonRad * 180) / Math.PI;

  const landVal = sampleLandMask(lonDeg, latDeg);
  isLandArray[i] = landVal;

  basePoints.push({ x, y, z, latDeg, lonDeg });
}

console.log('Sampled all points. Precalculated isLand array.');

// Matrices de rotación
// 1. Giro alrededor del eje Y (spin)
const spinRad = (CONFIG.spinAngle * Math.PI) / 180;
const cosSpin = Math.cos(spinRad);
const sinSpin = Math.sin(spinRad);

// 2. Inclinación del eje (axisTilt ~ 23.5°)
// Inclinamos el eje en el plano de pantalla (roll Z) y leve inclinación hacia el frente (X) para favorecer Europa/África
const tiltZRad = (-CONFIG.axisTilt * Math.PI) / 180;
const cosTiltZ = Math.cos(tiltZRad);
const sinTiltZ = Math.sin(tiltZRad);

const tiltXRad = (8 * Math.PI) / 180; // Inclinación sutil de 8° hacia el frente
const cosTiltX = Math.cos(tiltXRad);
const sinTiltX = Math.sin(tiltXRad);

const dots = [];
const cx = CONFIG.canvasWidth / 2;
const cy = CONFIG.canvasHeight / 2;

for (let i = 0; i < CONFIG.points; i++) {
  const p = basePoints[i];
  const isLand = isLandArray[i];

  // 1. Giro sobre el eje polar Y
  const x1 = p.x * cosSpin + p.z * sinSpin;
  const y1 = p.y;
  const z1 = -p.x * sinSpin + p.z * cosSpin;

  // 2. Inclinación leve frontal (X)
  const x2 = x1;
  const y2 = y1 * cosTiltX - z1 * sinTiltX;
  const z2 = y1 * sinTiltX + z1 * cosTiltX;

  // 3. Inclinación axial en pantalla (Z roll de 23.5°)
  const rx = x2 * cosTiltZ - y2 * sinTiltZ;
  const ry = x2 * sinTiltZ + y2 * cosTiltZ;
  const rz = z2;

  // Filtrar hemisferio de atrás (CONFIG.backOpacity = 0)
  if (rz < -0.01) continue;

  const rand1 = pseudoRandom(i * 1.618);
  const rand2 = pseudoRandom(i * 3.141);
  const rand3 = pseudoRandom(i * 2.718);

  // Jitter determinista
  const radialJitter = 1 + (rand1 - 0.5) * CONFIG.jitter;

  // Posición proyectada ortográficamente
  const px = rx * CONFIG.radius * radialJitter;
  const py = ry * CONFIG.radius * radialJitter;
  const pz = rz * CONFIG.radius;

  // Vector normal en la esfera proyectada (superficie esférica: normal = (rx, ry, rz))
  const normX = rx;
  const normY = ry;
  const normZ = rz;

  // dot(normal, light)
  const nDotL = normX * lx + normY * ly + normZ * lz;

  // 3. COMBINACIÓN DE TONO EXACTA DE LA ESPECIFICACIÓN:
  // shade = (1 - dot(normal, luz)) ** CONFIG.shadowContrast
  // Mapeamos (1 - nDotL) * 0.5 a [0, 1] o directamente dot(normal, luz) en [0, 1]
  const lightFactor = Math.max(0, Math.min(1, nDotL * 0.5 + 0.5));
  const shade = Math.pow(1 - lightFactor, CONFIG.shadowContrast);

  // tone = clamp(shade * CONFIG.shadowWeight + isLand * CONFIG.landWeight, 0, 1)
  const rawTone = shade * CONFIG.shadowWeight + isLand * CONFIG.landWeight;
  const tone = Math.max(0, Math.min(1, rawTone));

  // radio = minDotRadius + (maxDotRadius - minDotRadius) * tone ** CONFIG.contrast
  const rTone = Math.pow(tone, CONFIG.contrast);
  const rJitter = 1 + (rand3 - 0.5) * 0.1;
  let r = (CONFIG.minDotRadius + (CONFIG.maxDotRadius - CONFIG.minDotRadius) * rTone) * rJitter;

  // En el limbo extremo (rz < 0.12), limitar para que la compresión no haga una franja sólida
  if (rz < 0.12) {
    r = Math.min(r, CONFIG.maxDotRadius * 0.7);
  }

  // Si está en el océano hiper-iluminado, puntos casi invisibles o ausentes
  if (isLand < 0.1 && lightFactor > 0.85 && rand2 < 0.5) {
    continue;
  }

  dots.push({
    x: cx + px,
    y: cy + py,
    r: Math.max(0.35, r),
    z: pz,
    isLand,
  });
}

// Ordenar por Z
dots.sort((a, b) => a.z - b.z);

console.log('Visible dots rendered:', dots.length);

const svgElements = dots.map(d => 
  `<circle cx="${d.x.toFixed(1)}" cy="${d.y.toFixed(1)}" r="${d.r.toFixed(2)}" fill="#111111" />`
).join('\n');

const svg = `<svg width="${CONFIG.canvasWidth}" height="${CONFIG.canvasHeight}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#F1EEE6"/>
  ${svgElements}
</svg>`;

const outPath = 'C:/Users/Tomyp/.gemini/antigravity/brain/863dbce5-1730-4fcc-83dc-6561cdd72ad6/test_earth_dots.png';
await sharp(Buffer.from(svg)).png().toFile(outPath);
console.log('Saved test to:', outPath);
