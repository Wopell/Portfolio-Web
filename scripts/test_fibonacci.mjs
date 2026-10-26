import sharp from 'sharp';

const CONFIG = {
  canvasWidth: 960,
  canvasHeight: 620,
  pointsCount: 9600,
  radiusX: 370,
  radiusY: 200,
  radiusZ: 270,
  tiltAngle: -25, // degrees
  minDotRadius: 0.65,
  maxDotRadius: 4.6,
  lightDirection: [-0.55, -0.65, 0.75], // Top-left-front light
  dotColor: '#111111',
  backgroundColor: '#f5f2eb',
  jitterAmount: 0.028, // Radial jitter for organic edge
  scatterProbability: 0.045, // Scattered stray dots outside contour
};

// Deterministic pseudo-random based on seed
function pseudoRandom(seed) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// 3D Multi-harmonic organic surface noise
function getSurfaceNoise(x, y, z) {
  const n1 = Math.sin(x * 3.5 + 0.4) * Math.cos(y * 3.2 - 0.6) * Math.sin(z * 3.0);
  const n2 = Math.sin(x * 7.2 - 1.1) * Math.sin(y * 6.8 + 0.5) * Math.cos(z * 7.0);
  const n3 = Math.cos(x * 13.0) * Math.sin(y * 13.0) * Math.sin(z * 13.0);
  return n1 * 0.5 + n2 * 0.35 + n3 * 0.15;
}

// Organic cluster regions (3-4 clusters as in referencia.png)
const CLUSTERS = [
  { x: -0.38, y: -0.22, z: 0.6, radius: 0.35, intensity: 0.95 },  // Upper-left spot
  { x: 0.05, y: 0.22, z: 0.65, radius: 0.38, intensity: 0.75 },   // Mid-lower patch
  { x: 0.45, y: 0.28, z: 0.45, radius: 0.42, intensity: 0.85 },   // Lower-right shadow patch
  { x: -0.15, y: 0.38, z: 0.5, radius: 0.28, intensity: 0.6 },    // Bottom accent
];

const width = CONFIG.canvasWidth;
const height = CONFIG.canvasHeight;
const cx = width / 2;
const cy = height / 2;

const tiltRad = (CONFIG.tiltAngle * Math.PI) / 180;
const cosT = Math.cos(tiltRad);
const sinT = Math.sin(tiltRad);

const [lx, ly, lz] = CONFIG.lightDirection;
const lLen = Math.hypot(lx, ly, lz);
const nLx = lx / lLen;
const nLy = ly / lLen;
const nLz = lz / lLen;

const phiGolden = Math.PI * (3 - Math.sqrt(5)); // Golden angle

const dots = [];

for (let i = 0; i < CONFIG.pointsCount; i++) {
  // Fibonacci sphere point on unit sphere
  const y = 1 - (i / (CONFIG.pointsCount - 1)) * 2; // from 1 to -1
  const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = phiGolden * i;
  const x = Math.cos(theta) * radiusAtY;
  const z = Math.sin(theta) * radiusAtY;

  // Only render front-facing hemisphere (+ small margin for smooth edge)
  if (z < -0.06) continue;

  const rand1 = pseudoRandom(i * 1.618);
  const rand2 = pseudoRandom(i * 3.141);
  const rand3 = pseudoRandom(i * 2.718);

  // Irregular organic contour jitter
  let radialMod = 1 + (rand1 - 0.5) * CONFIG.jitterAmount;
  
  // Stray / scatter dots near the limb
  const isNearLimb = z < 0.22;
  if (isNearLimb && rand2 < CONFIG.scatterProbability) {
    radialMod += 0.06 + rand3 * 0.12; // detach slightly outside contour
  }

  // Scale by ellipsoid dimensions in local space
  const px = x * CONFIG.radiusX * radialMod;
  const py = y * CONFIG.radiusY * radialMod;
  const pz = z * CONFIG.radiusZ;

  // Rotate by tilt angle in screen space
  const sx = px * cosT - py * sinT + (rand2 - 0.5) * 1.5;
  const sy = px * sinT + py * cosT + (rand3 - 0.5) * 1.5;
  const sz = pz;

  // Ellipsoid surface normal
  const nx = x / CONFIG.radiusX;
  const ny = y / CONFIG.radiusY;
  const nz = z / CONFIG.radiusZ;
  const nLen = Math.hypot(nx, ny, nz);
  const normXLocal = nx / nLen;
  const normYLocal = ny / nLen;
  const normZ = nz / nLen;

  // Rotate normal to screen space
  const normX = normXLocal * cosT - normYLocal * sinT;
  const normY = normXLocal * sinT + normYLocal * cosT;

  // Diffuse dot product: light comes from top-left-front
  const diffuse = normX * nLx + normY * nLy + normZ * nLz;

  // Surface multi-frequency noise
  const noiseVal = getSurfaceNoise(x, y, z);

  // Cluster dark spots
  let clusterDarkening = 0;
  for (const c of CLUSTERS) {
    const dist = Math.hypot(x - c.x, y - c.y, z - c.z);
    if (dist < c.radius) {
      const falloff = Math.cos((dist / c.radius) * Math.PI * 0.5);
      clusterDarkening = Math.max(clusterDarkening, falloff * c.intensity);
    }
  }

  // Shading combination:
  // Base light: 0 = full light, 1 = deep shadow
  let shadow = (1 - diffuse) * 0.5;
  shadow += noiseVal * 0.22;
  shadow = Math.max(shadow, clusterDarkening * 0.95);
  shadow = Math.max(0, Math.min(1, shadow));

  // Halftone dot radius with slight organic variation
  const rJitter = 1 + (rand3 - 0.5) * 0.12;
  const r = (CONFIG.minDotRadius + (CONFIG.maxDotRadius - CONFIG.minDotRadius) * shadow) * rJitter;

  dots.push({
    x: cx + sx,
    y: cy + sy,
    r: Math.max(0.4, r),
    z: sz,
  });
}

// Sort by z so deeper points render first (proper layering)
dots.sort((a, b) => a.z - b.z);

const dotsSvg = dots
  .map(
    (d) =>
      `<circle cx="${d.x.toFixed(1)}" cy="${d.y.toFixed(1)}" r="${d.r.toFixed(1)}" fill="${CONFIG.dotColor}"/>`
  )
  .join('\n');

const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${CONFIG.backgroundColor}"/>
  ${dotsSvg}
</svg>`;

await sharp(Buffer.from(svg)).png().toFile('public/test_fibonacci_planet.png');
console.log('Successfully generated test_fibonacci_planet.png with', dots.length, 'dots');
