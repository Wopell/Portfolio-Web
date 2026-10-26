import * as topojson from 'topojson-client';
import { geoEquirectangular, geoPath } from 'd3-geo';
import fs from 'fs';
import sharp from 'sharp';

const landTopology = JSON.parse(fs.readFileSync('node_modules/world-atlas/land-110m.json', 'utf8'));
const landFeature = topojson.feature(landTopology, landTopology.objects.land);

const width = 1024;
const height = 512;

// d3-geo equirectangular projection
const projection = geoEquirectangular()
  .fitSize([width, height], { type: "Sphere" });

const pathGenerator = geoPath(projection);
const svgPath = pathGenerator(landFeature);

console.log('Path generated length:', svgPath.length);

const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#000000" />
  <path d="${svgPath}" fill="#ffffff" stroke="none" />
</svg>`;

// Apply subtle blur (1.5px) for smooth coastal transitions
const maskBuffer = await sharp(Buffer.from(svg))
  .blur(1.5)
  .png()
  .toBuffer();

await sharp(maskBuffer).toFile('public/earth-mask.png');
console.log('Saved public/earth-mask.png');
