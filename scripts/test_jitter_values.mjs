import fs from 'fs';
import sharp from 'sharp';
import * as topojson from 'topojson-client';
import { geoEquirectangular, geoPath } from 'd3-geo';

const landTopology = JSON.parse(fs.readFileSync('node_modules/world-atlas/land-110m.json', 'utf8'));
const width = 2048, height = 1024;
const svgMask = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#000000" />
  <path d="${geoPath(geoEquirectangular().translate([width/2, height/2]).scale(width / (2 * Math.PI)))(topojson.feature(landTopology, landTopology.objects.land))}" fill="#ffffff" />
</svg>`;
const maskRaw = await sharp(Buffer.from(svgMask)).blur(1.0).raw().toBuffer();

function sampleLandBilinear(lonDeg, latDeg) {
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
  const v00 = maskRaw[y0 * width + x0] / 255;
  const v10 = maskRaw[y0 * width + x1] / 255;
  const v01 = maskRaw[y1 * width + x0] / 255;
  const v11 = maskRaw[y1 * width + x1] / 255;
  const top = (1 - fx) * v00 + fx * v10;
  const bot = (1 - fx) * v01 + fx * v11;
  return (1 - fy) * top + fy * bot;
}

function hashInt(n, seed = 0) {
  let h = (n ^ seed) + 0x9e3779b9 | 0;
  h = Math.imul(h ^ (h >>> 16), 0x21f0aaad);
  h = Math.imul(h ^ (h >>> 15), 0x735a2d97);
  return ((h = h ^ (h >>> 15)) >>> 0) / 4294967296;
}

function generatePoints(N, jitterFactor) {
  const phiGolden = Math.PI * (3 - Math.sqrt(5));
  const meanDist = Math.sqrt((4 * Math.PI) / N);
  const points = [];

  for (let i = 0; i < N; i++) {
    const y0 = 1 - (2 * (i + 0.5)) / N;
    const r0 = Math.sqrt(Math.max(0, 1 - y0 * y0));
    const theta0 = phiGolden * i;

    let x = Math.sin(theta0) * r0;
    let y = y0;
    let z = Math.cos(theta0) * r0;

    if (jitterFactor > 0) {
      let upX = 0, upY = 1, upZ = 0;
      if (Math.abs(y0) > 0.99) { upX = 1; upY = 0; upZ = 0; }
      let t1x = upY * z - upZ * y;
      let t1y = upZ * x - upX * z;
      let t1z = upX * y - upY * x;
      const lenT1 = Math.hypot(t1x, t1y, t1z);
      t1x /= lenT1; t1y /= lenT1; t1z /= lenT1;
      const t2x = y * t1z - z * t1y;
      const t2y = z * t1x - x * t1z;
      const t2z = x * t1y - y * t1x;

      const rand1 = hashInt(i, 1013);
      const rand2 = hashInt(i, 2027);

      const j1 = (rand1 - 0.5) * jitterFactor * meanDist;
      const j2 = (rand2 - 0.5) * jitterFactor * meanDist;

      x += j1 * t1x + j2 * t2x;
      y += j1 * t1y + j2 * t2y;
      z += j1 * t1z + j2 * t2z;
      const len = Math.hypot(x, y, z);
      x /= len; y /= len; z /= len;
    }

    const latRad = Math.asin(Math.max(-1, Math.min(1, y)));
    const latDeg = (latRad * 180) / Math.PI;
    const lonRad = Math.atan2(x, z);
    const lonDeg = (lonRad * 180) / Math.PI;

    const isLand = sampleLandBilinear(lonDeg, latDeg);
    const rand3 = hashInt(i, 3037);
    const rJitter = 1 + (rand3 - 0.5) * 0.08;
    points.push({ x, y, z, isLand, rJitter });
  }
  return points;
}

async function renderTest(N, jFactor, filename) {
  const R = 350;
  const cx = 430, cy = 370;
  const canvasW = 860, canvasH = 740;
  const tiltRad = (-23.5 * Math.PI) / 180;
  const cosTilt = Math.cos(tiltRad), sinTilt = Math.sin(tiltRad);
  const spinRad = (-22 * Math.PI) / 180;
  const cosS = Math.cos(spinRad), sinS = Math.sin(spinRad);
  const M00 = cosTilt * cosS, M01 = -sinTilt, M02 = cosTilt * sinS;
  const M10 = sinTilt * cosS, M11 = cosTilt,  M12 = sinTilt * sinS;
  const M20 = -sinS,          M21 = 0,        M22 = cosS;
  const lx = -0.6 / Math.hypot(-0.6, 0.7, 0.5);
  const ly = 0.7 / Math.hypot(-0.6, 0.7, 0.5);
  const lz = 0.5 / Math.hypot(-0.6, 0.7, 0.5);

  const points = generatePoints(N, jFactor);
  const scaleFactor = (R / 350.0) * Math.sqrt(18000.0 / N);

  let circles = '';
  for (let i = 0; i < N; i++) {
    const pt = points[i];
    const rx = M00 * pt.x + M01 * pt.y + M02 * pt.z;
    const ry = M10 * pt.x + M11 * pt.y + M12 * pt.z;
    const rz = M20 * pt.x + M21 * pt.y + M22 * pt.z;
    if (rz <= 0.005) continue;
    const sx = cx + rx * R;
    const sy = cy - ry * R;
    const nDotL = rx * lx + ry * ly + rz * lz;
    const lightFactor = Math.max(0, Math.min(1, nDotL * 0.5 + 0.5));
    const rawShade = Math.pow(1 - lightFactor, 1.6);
    const isL = pt.isLand;
    const maxOceanShade = 0.40;
    const allowedShade = isL > 0.3 ? rawShade : Math.min(rawShade, maxOceanShade + (1.0 - maxOceanShade) * (isL / 0.3));
    const tone = Math.max(0, Math.min(1, allowedShade * 0.55 + isL * 0.70));
    const rTone = Math.pow(tone, 1.25);
    let rRef = (0.55 + (4.8 - 0.55) * rTone) * pt.rJitter;
    const rho = Math.hypot(rx, ry);
    if (rho > 0.92) {
      const edgeDist = Math.max(0, Math.min(1, (1.0 - rho) / 0.08));
      rRef = Math.min(rRef, 4.8 * (0.35 + 0.65 * edgeDist));
    }
    const r = Math.max(0.55, rRef * scaleFactor);
    circles += `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="${r.toFixed(1)}" fill="#111111" />`;
  }
  const svg = `<svg width="${canvasW}" height="${canvasH}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${canvasW}" height="${canvasH}" fill="#f5f2eb" />
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="#f5f2eb" />
    ${circles}
  </svg>`;
  await sharp(Buffer.from(svg)).png().toFile('C:/Users/Tomyp/.gemini/antigravity/brain/863dbce5-1730-4fcc-83dc-6561cdd72ad6/' + filename);
  console.log('Saved', filename);
}

await renderTest(18000, 0.35, 'test_18000_j035.png');
await renderTest(18000, 0.55, 'test_18000_j055.png');
await renderTest(14000, 0.55, 'test_14000_j055.png');
await renderTest(12000, 0.55, 'test_12000_j055.png');
await renderTest(9000, 0.55, 'test_9000_j055.png');
