import sharp from 'sharp';
import path from 'path';

const outDir = 'C:/Users/Tomyp/.gemini/antigravity/brain/863dbce5-1730-4fcc-83dc-6561cdd72ad6';

async function makeWaveComposite() {
  const waveCrop = await sharp(path.join(outDir, 'crop_active_wave.png')).resize(480, 480).toBuffer();
  const hudCrop = await sharp(path.join(outDir, 'crop_hud_active_wave.png')).resize(330, 112).toBuffer();

  const bgSvg = `
    <svg width="860" height="520" xmlns="http://www.w3.org/2000/svg">
      <rect width="860" height="520" fill="#f5f2eb" />
      <text x="20" y="30" font-family="monospace" font-size="15" font-weight="bold" fill="#111111">BUG 2: ONDA ACTIVA CON TRAZO DE SEGMENTOS E INSPECCIÓN HUD</text>
      <text x="520" y="70" font-family="monospace" font-size="12" font-weight="600" fill="#2F6F6B">TELEMETRÍA EN TIEMPO REAL</text>
      <text x="520" y="230" font-family="monospace" font-size="11" fill="#444444">• Segmentos activos W1 dibujados en verde (#2F6F6B)</text>
      <text x="520" y="250" font-family="monospace" font-size="11" fill="#444444">• Frente de onda concéntrico (radio de expansión)</text>
      <text x="520" y="270" font-family="monospace" font-size="11" fill="#444444">• Swell en cresta (+28%) + Warp tangencial (14px)</text>
      <text x="520" y="290" font-family="monospace" font-size="11" fill="#444444">• centerFade ajustado a 12px (onda visible desde r=0)</text>
      <text x="520" y="310" font-family="monospace" font-size="11" fill="#444444">• restThreshold = 180ms (sin corte prematuro)</text>
    </svg>
  `;

  await sharp(Buffer.from(bgSvg))
    .composite([
      { input: waveCrop, top: 35, left: 20 },
      { input: hudCrop, top: 85, left: 515 },
    ])
    .png()
    .toFile(path.join(outDir, 'fase6_active_wave_composite.png'));

  console.log('Saved fase6_active_wave_composite.png');
}

makeWaveComposite();
