import sharp from 'sharp';
import fs from 'fs';

// 1. work-1.jpg: 001 Animation -> public/landscapes/april.webp
await sharp('public/landscapes/april.webp')
  .resize(400, 400, { fit: 'cover', position: 'center' })
  .jpeg({ quality: 90 })
  .toFile('public/previews/work-1.jpg');
console.log('✓ work-1.jpg generado desde april.webp (001 Animation)');

// 2. work-2.jpg: 002 3D Art -> public/landscapes/march.webp
await sharp('public/landscapes/march.webp')
  .resize(400, 400, { fit: 'cover', position: 'center' })
  .jpeg({ quality: 90 })
  .toFile('public/previews/work-2.jpg');
console.log('✓ work-2.jpg generado desde march.webp (002 3D Art)');

// 3. work-3.jpg: 003 IA -> public/landscapes/may.webp
await sharp('public/landscapes/may.webp')
  .resize(400, 400, { fit: 'cover', position: 'center' })
  .jpeg({ quality: 90 })
  .toFile('public/previews/work-3.jpg');
console.log('✓ work-3.jpg generado desde may.webp (003 IA)');

// 4. work-4.jpg: 004 Post Production -> Placeholder neutro claramente marcado
const svg = `<svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#27272a"/>
      <stop offset="100%" stop-color="#09090b"/>
    </radialGradient>
  </defs>
  <rect width="400" height="400" fill="url(#bg)"/>
  <circle cx="200" cy="200" r="170" fill="none" stroke="#f87171" stroke-width="2" stroke-dasharray="6 6" opacity="0.6"/>
  <rect x="130" y="110" width="140" height="30" rx="4" fill="#f87171" opacity="0.2"/>
  <text x="200" y="131" text-anchor="middle" font-family="monospace" font-size="14" font-weight="bold" fill="#f87171" letter-spacing="3">004 // POST</text>
  <circle cx="200" cy="200" r="36" fill="#18181b" stroke="#f87171" stroke-width="2"/>
  <polygon points="192,186 214,200 192,214" fill="#f87171"/>
  <text x="200" y="270" text-anchor="middle" font-family="sans-serif" font-size="16" font-weight="bold" fill="#ffffff" letter-spacing="1">POST PRODUCTION</text>
  <text x="200" y="295" text-anchor="middle" font-family="monospace" font-size="11" fill="#71717a" letter-spacing="1">[PREVIEW PENDIENTE]</text>
</svg>`;

await sharp(Buffer.from(svg))
  .jpeg({ quality: 90 })
  .toFile('public/previews/work-4.jpg');
console.log('✓ work-4.jpg generado como placeholder neutro (004 Post Production)');
