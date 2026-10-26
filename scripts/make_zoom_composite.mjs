import sharp from 'sharp';
import path from 'path';

const outDir = 'C:/Users/Tomyp/.gemini/antigravity/brain/863dbce5-1730-4fcc-83dc-6561cdd72ad6';

async function makeZoomComposite() {
  // Planet center in 1440x1050:
  // canvas is ~860x740, right aligned in desktop hero
  // Let's crop around the planet center: x: 800 to 1250, y: 200 to 650 (450x450 px)
  const cropArea = { left: 820, top: 220, width: 440, height: 440 };

  const cropReposo = await sharp(path.join(outDir, 'evidence_reposo_comparacion.png')).extract(cropArea).toBuffer();
  const cropIman = await sharp(path.join(outDir, 'evidence_iman_reposo_fixed.png')).extract(cropArea).toBuffer();
  const cropOnda = await sharp(path.join(outDir, 'evidence_onda_activa_fixed.png')).extract(cropArea).toBuffer();

  const compositeImg = await sharp({
    create: {
      width: 440 * 3 + 40,
      height: 480,
      channels: 4,
      background: { r: 245, g: 242, b: 235, alpha: 1 }
    }
  })
  .composite([
    { input: cropReposo, left: 10, top: 20 },
    { input: cropIman, left: 460, top: 20 },
    { input: cropOnda, left: 910, top: 20 }
  ])
  .png()
  .toFile(path.join(outDir, 'comparacion_detalle_zoom.png'));

  console.log('Saved comparacion_detalle_zoom.png');
}

makeZoomComposite();
