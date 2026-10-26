import sharp from 'sharp';
import path from 'path';

const outDir = 'C:/Users/Tomyp/.gemini/antigravity/brain/863dbce5-1730-4fcc-83dc-6561cdd72ad6';

async function makeWaveComparison() {
  const w = 540;
  const h = 420;

  // Crop around Africa / Europe where the wave travels
  // Previous wave with warpMax 14px and swellMax 0.28 (saved as crop_active_wave.png in previous turn)
  const prevWave = await sharp(path.join(outDir, 'crop_active_wave.png'))
    .resize(w, h)
    .toBuffer();

  // Current wave with exact ReactiveHalftone values (warpMax 1.5px, swellMax 0.10)
  const currWave = await sharp(path.join(outDir, 'evidence_onda_activa.png'))
    .extract({ left: 360, top: 130, width: 720, height: 720 })
    .resize(w, h)
    .toBuffer();

  const totalW = w * 2 + 30;
  const totalH = h + 70;

  const titleSvg = `
    <svg width="${totalW}" height="${totalH}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${totalW}" height="${totalH}" fill="#f5f2eb" />
      <text x="15" y="32" font-family="monospace" font-size="13" font-weight="bold" fill="#111111">VALORES ORIGINALES REACTIVEHALFTONE (warpMax: 1.5px, swell: 0.10)</text>
      <text x="${w + 25}" y="32" font-family="monospace" font-size="13" font-weight="bold" fill="#111111">VALORES AMPLIADOS PREVIOS (warpMax: 14.0px, swell: 0.28)</text>
    </svg>
  `;

  await sharp(Buffer.from(titleSvg))
    .composite([
      { input: currWave, top: 50, left: 10 },
      { input: prevWave, top: 50, left: w + 20 },
    ])
    .png()
    .toFile(path.join(outDir, 'comparacion_ondas_antes_despues.png'));

  console.log('Saved comparacion_ondas_antes_despues.png');
}

makeWaveComparison();
