import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const outDir = path.resolve('public/previews');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const templates = [
  {
    file: 'work-1.jpg',
    code: '001',
    category: 'ANIMATION',
    iconSvg: `
      <!-- Motion Play Icon with Clapper Corners -->
      <polygon points="182,165 182,235 238,200" fill="#2F6F6B" />
      <polygon points="180,165 180,235 236,200" fill="none" stroke="#6ee7b7" stroke-width="2" />
      <!-- Frame corners -->
      <path d="M 140,165 L 140,150 L 155,150" fill="none" stroke="#71717a" stroke-width="2" stroke-linecap="round" />
      <path d="M 260,165 L 260,150 L 245,150" fill="none" stroke="#71717a" stroke-width="2" stroke-linecap="round" />
      <path d="M 140,235 L 140,250 L 155,250" fill="none" stroke="#71717a" stroke-width="2" stroke-linecap="round" />
      <path d="M 260,235 L 260,250 L 245,250" fill="none" stroke="#71717a" stroke-width="2" stroke-linecap="round" />
    `
  },
  {
    file: 'work-2.jpg',
    code: '002',
    category: '3D ART',
    iconSvg: `
      <!-- Isometric 3D Cube -->
      <g transform="translate(200, 200)">
        <!-- Top Face -->
        <polygon points="0,-48 42,-24 0,0 -42,-24" fill="#1e3a38" stroke="#2F6F6B" stroke-width="2" stroke-linejoin="round"/>
        <!-- Left Face -->
        <polygon points="-42,-24 0,0 0,48 -42,24" fill="#132423" stroke="#2F6F6B" stroke-width="2" stroke-linejoin="round"/>
        <!-- Right Face -->
        <polygon points="0,0 42,-24 42,24 0,48" fill="#254d4a" stroke="#2F6F6B" stroke-width="2" stroke-linejoin="round"/>
        <!-- Coordinate Axes -->
        <line x1="0" y1="0" x2="0" y2="-62" stroke="#6ee7b7" stroke-width="1.5" stroke-dasharray="3,3"/>
        <line x1="0" y1="0" x2="54" y2="31" stroke="#6ee7b7" stroke-width="1.5" stroke-dasharray="3,3"/>
        <line x1="0" y1="0" x2="-54" y2="31" stroke="#6ee7b7" stroke-width="1.5" stroke-dasharray="3,3"/>
      </g>
    `
  },
  {
    file: 'work-3.jpg',
    code: '003',
    category: 'IA // GEN',
    iconSvg: `
      <!-- AI Neural Spark / Nodes -->
      <g transform="translate(200, 200)">
        <!-- Central Sparkle -->
        <path d="M 0,-36 Q 0,0 36,0 Q 0,0 0,36 Q 0,0 -36,0 Q 0,0 0,-36 Z" fill="#2F6F6B" stroke="#6ee7b7" stroke-width="1.5" />
        <!-- Small companion sparks -->
        <path d="M 32,-28 Q 32,-16 44,-16 Q 32,-16 32,-4 Q 32,-16 20,-16 Q 32,-16 32,-28 Z" fill="#6ee7b7" opacity="0.8" />
        <path d="M -32,24 Q -32,32 -24,32 Q -32,32 -32,40 Q -32,32 -40,32 Q -32,32 -32,24 Z" fill="#6ee7b7" opacity="0.6" />
        <!-- Orbiting ring -->
        <circle cx="0" cy="0" r="48" fill="none" stroke="#3f3f46" stroke-width="1.5" stroke-dasharray="4,4" />
      </g>
    `
  },
  {
    file: 'work-4.jpg',
    code: '004',
    category: 'POST PROD',
    iconSvg: `
      <!-- Color Grading & Aperture Dials -->
      <g transform="translate(200, 200)">
        <!-- Outer aperture / dial circle -->
        <circle cx="0" cy="0" r="42" fill="none" stroke="#2F6F6B" stroke-width="2" />
        <circle cx="0" cy="0" r="42" fill="none" stroke="#6ee7b7" stroke-width="2.5" stroke-dasharray="66 200" />
        <!-- Three grading sliders / crosshair -->
        <line x1="-30" y1="-12" x2="30" y2="-12" stroke="#3f3f46" stroke-width="2" stroke-linecap="round" />
        <circle cx="-6" cy="-12" r="4" fill="#2F6F6B" stroke="#6ee7b7" stroke-width="1.5" />
        <line x1="-30" y1="6" x2="30" y2="6" stroke="#3f3f46" stroke-width="2" stroke-linecap="round" />
        <circle cx="12" cy="6" r="4" fill="#2F6F6B" stroke="#6ee7b7" stroke-width="1.5" />
        <line x1="-30" y1="24" x2="30" y2="24" stroke="#3f3f46" stroke-width="2" stroke-linecap="round" />
        <circle cx="2" cy="24" r="4" fill="#2F6F6B" stroke="#6ee7b7" stroke-width="1.5" />
      </g>
    `
  }
];

async function generate() {
  for (const t of templates) {
    const svg = `
    <svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Radial gradient background -->
        <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#1f2128" />
          <stop offset="100%" stop-color="#101114" />
        </radialGradient>
      </defs>

      <!-- Background Fill -->
      <rect width="400" height="400" fill="url(#bgGrad)" />

      <!-- Blueprint Subtle Crosses -->
      <text x="35" y="45" fill="#3f3f46" font-family="monospace" font-size="16" opacity="0.6">+</text>
      <text x="355" y="45" fill="#3f3f46" font-family="monospace" font-size="16" opacity="0.6">+</text>
      <text x="35" y="375" fill="#3f3f46" font-family="monospace" font-size="16" opacity="0.6">+</text>
      <text x="355" y="375" fill="#3f3f46" font-family="monospace" font-size="16" opacity="0.6">+</text>

      <!-- Outer Subtle Dashed Ring (inside circle border) -->
      <circle cx="200" cy="200" r="172" fill="none" stroke="#27272a" stroke-width="1.5" stroke-dasharray="6,6" />
      <circle cx="200" cy="200" r="150" fill="none" stroke="#2F6F6B" stroke-width="1" opacity="0.2" />

      <!-- Top Header: Category & Code -->
      <text x="200" y="86" text-anchor="middle" fill="#9ca3af" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="19" font-weight="800" letter-spacing="3.5">
        ${t.code} // ${t.category}
      </text>

      <!-- Center Icon -->
      ${t.iconSvg}

      <!-- Bottom Status Pill: PREVIEW PENDIENTE -->
      <rect x="105" y="306" width="190" height="34" rx="17" fill="#18181b" stroke="#3f3f46" stroke-width="1.5" />
      <circle cx="125" cy="323" r="4.5" fill="#f59e0b" />
      <text x="210" y="329" text-anchor="middle" fill="#d4d4d8" font-family="monospace, Courier, monospace" font-size="13" font-weight="700" letter-spacing="1.5">
        PREVIEW PENDIENTE
      </text>
    </svg>
    `;

    const destPath = path.join(outDir, t.file);
    await sharp(Buffer.from(svg))
      .jpeg({ quality: 92 })
      .toFile(destPath);
    console.log(`Generated neutral placeholder: ${destPath}`);
  }
}

generate().catch(err => {
  console.error('Error generating previews:', err);
  process.exit(1);
});
