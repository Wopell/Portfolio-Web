import sharp from 'sharp';
import path from 'path';

const outDir = 'C:/Users/Tomyp/.gemini/antigravity/brain/863dbce5-1730-4fcc-83dc-6561cdd72ad6';

async function makeComposite() {
  const p18k = await sharp(path.join(outDir, 'crop_points_18000.png')).resize(360, 360).toBuffer();
  const p14k = await sharp(path.join(outDir, 'crop_points_14000.png')).resize(360, 360).toBuffer();
  const p12k = await sharp(path.join(outDir, 'crop_points_12000.png')).resize(360, 360).toBuffer();
  const p9k  = await sharp(path.join(outDir, 'crop_points_9000.png')).resize(360, 360).toBuffer();

  const titleSvg = `
    <svg width="740" height="780" xmlns="http://www.w3.org/2000/svg">
      <rect width="740" height="780" fill="#f5f2eb" />
      <text x="20" y="30" font-family="monospace" font-size="14" font-weight="bold" fill="#111111">N = 18,000 pts (Jitter: 5.08px)</text>
      <text x="390" y="30" font-family="monospace" font-size="14" font-weight="bold" fill="#111111">N = 14,000 pts (Jitter: 5.76px)</text>
      <text x="20" y="410" font-family="monospace" font-size="14" font-weight="bold" fill="#111111">N = 12,000 pts (Jitter: 6.23px - Piso Desktop)</text>
      <text x="390" y="410" font-family="monospace" font-size="14" font-weight="bold" fill="#111111">N = 9,000 pts (Jitter: 7.19px - Piso Mobile)</text>
    </svg>
  `;

  await sharp(Buffer.from(titleSvg))
    .composite([
      { input: p18k, top: 40, left: 10 },
      { input: p14k, top: 40, left: 370 },
      { input: p12k, top: 420, left: 10 },
      { input: p9k,  top: 420, left: 370 },
    ])
    .png()
    .toFile(path.join(outDir, 'fase6_points_stripes_comparison.png'));

  console.log('Saved fase6_points_stripes_comparison.png');
}

makeComposite();
