import fs from 'fs';
import path from 'path';

const outDir = path.resolve('public/previews');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 4 Categorías con sus colores exactos de pestaña de Works.tsx
const placeholders = [
  {
    id: 1,
    name: 'Animation',
    bgColor: '#2563eb', // Azul
    dotColor: '#000000',
    dotOpacity: 0.16,
    // Play Triangle: Centered at (200, 200). Size: ~200px (50% of 400)
    // Left: 135, Right: 295, Top: 105, Bottom: 295
    glyphSvg: `
      <polygon points="140,110 140,290 286,200" fill="#111111" stroke="#111111" stroke-width="12" stroke-linejoin="round" />
    `
  },
  {
    id: 2,
    name: '3D Art',
    bgColor: '#facc15', // Amarillo
    dotColor: '#000000',
    dotOpacity: 0.15,
    // Isometric 3D Cube: Centered at (200, 200). Width: ~200px, Height: ~210px
    glyphSvg: `
      <g transform="translate(200, 200)">
        <!-- Top Face -->
        <polygon points="0,-100 86,-50 0,0 -86,-50" fill="#111111" stroke="#facc15" stroke-width="4" stroke-linejoin="round" />
        <!-- Left Face -->
        <polygon points="-86,-50 0,0 0,100 -86,50" fill="#222222" stroke="#facc15" stroke-width="4" stroke-linejoin="round" />
        <!-- Right Face -->
        <polygon points="0,0 86,-50 86,50 0,100" fill="#111111" stroke="#facc15" stroke-width="4" stroke-linejoin="round" />
      </g>
    `
  },
  {
    id: 3,
    name: 'IA',
    bgColor: '#818cf8', // Lila / Indigo
    dotColor: '#000000',
    dotOpacity: 0.16,
    // 4-Point Star / Sparkle: Centered at (200, 200). Span: 210px (52% of 400)
    glyphSvg: `
      <path d="M 200,90 Q 200,200 310,200 Q 200,200 200,310 Q 200,200 90,200 Q 200,200 200,90 Z" fill="#111111" />
      <!-- Subtle center accent -->
      <circle cx="200" cy="200" r="16" fill="#818cf8" opacity="0.3" />
    `
  },
  {
    id: 4,
    name: 'Post Production',
    bgColor: '#f87171', // Coral
    dotColor: '#000000',
    dotOpacity: 0.16,
    // Cinematic Film Frame with Sprockets & widescreen aperture
    // Span: 200px width x 176px height centered at (200, 200)
    glyphSvg: `
      <g transform="translate(200, 200)">
        <!-- Outer film body -->
        <rect x="-100" y="-88" width="200" height="176" rx="14" fill="#111111" />
        
        <!-- Left Sprocket Holes -->
        <rect x="-90" y="-72" width="14" height="20" rx="3" fill="#f87171" />
        <rect x="-90" y="-36" width="14" height="20" rx="3" fill="#f87171" />
        <rect x="-90" y="0" width="14" height="20" rx="3" fill="#f87171" />
        <rect x="-90" y="36" width="14" height="20" rx="3" fill="#f87171" />
        <rect x="-90" y="52" width="14" height="20" rx="3" fill="#f87171" />

        <!-- Right Sprocket Holes -->
        <rect x="76" y="-72" width="14" height="20" rx="3" fill="#f87171" />
        <rect x="76" y="-36" width="14" height="20" rx="3" fill="#f87171" />
        <rect x="76" y="0" width="14" height="20" rx="3" fill="#f87171" />
        <rect x="76" y="36" width="14" height="20" rx="3" fill="#f87171" />
        <rect x="76" y="52" width="14" height="20" rx="3" fill="#f87171" />

        <!-- Central Widescreen Screen / Aperture -->
        <rect x="-62" y="-62" width="124" height="124" rx="8" fill="#f87171" />
        <!-- Cinematic Play / Trim Bars inside frame -->
        <line x1="-36" y1="-20" x2="36" y2="-20" stroke="#111111" stroke-width="8" stroke-linecap="round" />
        <line x1="-36" y1="0" x2="36" y2="0" stroke="#111111" stroke-width="8" stroke-linecap="round" />
        <line x1="-36" y1="20" x2="16" y2="20" stroke="#111111" stroke-width="8" stroke-linecap="round" />
      </g>
    `
  }
];

placeholders.forEach(p => {
  const svg = `<svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Subtle Halftone Pattern -->
    <pattern id="halftone-${p.id}" width="16" height="16" patternUnits="userSpaceOnUse">
      <circle cx="8" cy="8" r="2.5" fill="${p.dotColor}" opacity="${p.dotOpacity}" />
      <circle cx="0" cy="0" r="1.5" fill="${p.dotColor}" opacity="${p.dotOpacity * 0.7}" />
      <circle cx="16" cy="0" r="1.5" fill="${p.dotColor}" opacity="${p.dotOpacity * 0.7}" />
      <circle cx="0" cy="16" r="1.5" fill="${p.dotColor}" opacity="${p.dotOpacity * 0.7}" />
      <circle cx="16" cy="16" r="1.5" fill="${p.dotColor}" opacity="${p.dotOpacity * 0.7}" />
    </pattern>
  </defs>

  <!-- Base Accent Background -->
  <rect width="400" height="400" fill="${p.bgColor}" />

  <!-- Halftone Pattern Overlay -->
  <rect width="400" height="400" fill="url(#halftone-${p.id})" />

  <!-- Inner Edge Vignette for Depth -->
  <circle cx="200" cy="200" r="198" fill="none" stroke="#000000" stroke-width="4" opacity="0.15" />

  <!-- Main Centered Glyph (~50% of circle) -->
  ${p.glyphSvg}
</svg>`;

  const filePath = path.join(outDir, `placeholder-${p.id}.svg`);
  fs.writeFileSync(filePath, svg);
  console.log(`Created placeholder ${p.id} (${p.name}): ${filePath}`);
});
