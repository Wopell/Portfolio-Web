import sharp from 'sharp';

const width = 800;
const height = 500;
const cx = width / 2;
const cy = height / 2;
const tilt = -28 * (Math.PI / 180);
const cosT = Math.cos(tilt);
const sinT = Math.sin(tilt);
const a = 250;
const b = 135;
const c = 180;
const step = 8;

const circles = [];

for (let y = -cy; y < cy; y += step) {
  for (let x = -cx; x < cx; x += step) {
    // Coordinate in tilted ellipsoid frame
    const xr = x * cosT - y * sinT;
    const yr = x * sinT + y * cosT;

    const val = (xr * xr) / (a * a) + (yr * yr) / (b * b);
    if (val <= 1) {
      const z = c * Math.sqrt(1 - val);
      // Surface normal
      const nx = xr / a;
      const ny = yr / b;
      const nz = z / c;

      // Light direction from upper-left
      const lx = -0.35;
      const ly = -0.55;
      const lz = 0.75;
      const lLen = Math.hypot(lx, ly, lz);
      const dot = (nx * lx + ny * ly + nz * lz) / lLen;

      // Dark spot / crater matching reference
      const sDist = Math.hypot(xr - -75, yr - -25);
      let spotFactor = 0;
      if (sDist < 55) {
        spotFactor = Math.cos((sDist / 55) * Math.PI * 0.5);
      }

      // Shading value: 0 (light) to 1 (shadow)
      let shadow = (1 - dot) * 0.52;
      shadow = Math.max(shadow, spotFactor * 0.95);

      // Halftone dot radius
      const r = 0.8 + shadow * 4.2;
      circles.push({ x: cx + x, y: cy + y, r });
    }
  }
}

const circlesSvg = circles
  .map(
    (c) =>
      `<circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="${c.r.toFixed(1)}" fill="#111111"/>`
  )
  .join('\n');

const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f5f2eb"/>
  ${circlesSvg}
</svg>`;

await sharp(Buffer.from(svg)).png().toFile('public/test_halftone_planet.png');
console.log('Successfully generated test_halftone_planet.png with', circles.length, 'dots');
