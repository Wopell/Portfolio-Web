import sharp from 'sharp';
import fs from 'fs';
import * as topojson from 'topojson-client';
import { geoEquirectangular, geoPath } from 'd3-geo';

const landTopology = JSON.parse(fs.readFileSync('node_modules/world-atlas/land-110m.json', 'utf8'));
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

console.log('Writing public/earth-mask-2048.png with 1.0px blur...');
await sharp(Buffer.from(maskSvg))
  .blur(1.0)
  .png()
  .toFile('public/earth-mask-2048.png');

console.log('Done.');
