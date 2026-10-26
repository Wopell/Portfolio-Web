import sharp from 'sharp';
import path from 'path';

const outDir = 'C:/Users/Tomyp/.gemini/antigravity/brain/863dbce5-1730-4fcc-83dc-6561cdd72ad6';

async function makeWarpLiveComposite() {
  const w = 540;
  const h = 420;

  const w15 = await sharp(path.join(outDir, 'verification_warp_1_5.png'))
    .extract({ left: 360, top: 130, width: 720, height: 720 })
    .resize(w, h)
    .toBuffer();

  const w60 = await sharp(path.join(outDir, 'verification_warp_6_0.png'))
    .extract({ left: 360, top: 130, width: 720, height: 720 })
    .resize(w, h)
    .toBuffer();

  const totalW = w * 2 + 30;
  const totalH = h + 80;

  const titleSvg = `
    <svg width="${totalW}" height="${totalH}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${totalW}" height="${totalH}" fill="#f5f2eb" />
      <text x="15" y="30" font-family="monospace" font-size="13" font-weight="bold" fill="#111111">OPCIÓN A: warpMax = 1.5px (Original ReactiveHalftone)</text>
      <text x="15" y="48" font-family="monospace" font-size="11" fill="#666666">Deformación ultra-sutil: se percibe con mirada atenta</text>
      <text x="${w + 25}" y="30" font-family="monospace" font-size="13" font-weight="bold" fill="#111111">OPCIÓN B: warpMax = 6.0px (Propuesta táctil armónica)</text>
      <text x="${w + 25}" y="48" font-family="monospace" font-size="11" fill="#666666">Onda claramente visible sin distorsionar la geografía</text>
    </svg>
  `;

  await sharp(Buffer.from(titleSvg))
    .composite([
      { input: w15, top: 60, left: 10 },
      { input: w60, top: 60, left: w + 20 },
    ])
    .png()
    .toFile(path.join(outDir, 'comparacion_warp_live.png'));

  console.log('Saved comparacion_warp_live.png');
}

makeWarpLiveComposite();
