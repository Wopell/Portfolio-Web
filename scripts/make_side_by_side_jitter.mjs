import sharp from 'sharp';
import path from 'path';

const outDir = 'C:/Users/Tomyp/.gemini/antigravity/brain/863dbce5-1730-4fcc-83dc-6561cdd72ad6';

async function makeSideBySide() {
  // Scale each 1440x1050 image to 480x350
  const w = 480;
  const h = 350;

  const imgRef = await sharp(path.join(outDir, 'parity_2d_1440.png')).resize(w, h).toBuffer();
  const img18k = await sharp(path.join(outDir, 'evidence_jitter035_18000.png')).resize(w, h).toBuffer();
  const img12k = await sharp(path.join(outDir, 'evidence_jitter035_12000.png')).resize(w, h).toBuffer();

  const totalW = w * 3 + 40;
  const totalH = h + 70;

  const headerSvg = `
    <svg width="${totalW}" height="${totalH}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${totalW}" height="${totalH}" fill="#f5f2eb" />
      <text x="15" y="32" font-family="monospace" font-size="14" font-weight="bold" fill="#111111">REFERENCIA APROBADA (Canvas 2D)</text>
      <text x="${w + 25}" y="32" font-family="monospace" font-size="14" font-weight="bold" fill="#111111">WEBGL 18,000 PTS (Jitter = 0.35)</text>
      <text x="${w * 2 + 35}" y="32" font-family="monospace" font-size="14" font-weight="bold" fill="#111111">WEBGL 12,000 PTS (Jitter = 0.35)</text>
    </svg>
  `;

  await sharp(Buffer.from(headerSvg))
    .composite([
      { input: imgRef, top: 50, left: 10 },
      { input: img18k, top: 50, left: w + 20 },
      { input: img12k, top: 50, left: w * 2 + 30 },
    ])
    .png()
    .toFile(path.join(outDir, 'comparacion_aprobado_vs_j035.png'));

  console.log('Saved comparacion_aprobado_vs_j035.png');
}

makeSideBySide();
