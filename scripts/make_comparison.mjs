import sharp from 'sharp';

const outDir = 'C:/Users/Tomyp/.gemini/antigravity/brain/863dbce5-1730-4fcc-83dc-6561cdd72ad6';

// Read the 3 frames
const img0 = sharp(`${outDir}/phase2_live_t0.png`);
const img2 = sharp(`${outDir}/phase2_live_t2.png`);
const img4 = sharp(`${outDir}/phase2_live_t4.png`);

// Crop just the planet area from each (around center: y: 280 to 1020, x: 180 to 900)
// Original image size is 1080 x 1060
const cropOptions = { left: 160, top: 300, width: 760, height: 760 };

const buf0 = await img0.extract(cropOptions).resize(420, 420).toBuffer();
const buf2 = await img2.extract(cropOptions).resize(420, 420).toBuffer();
const buf4 = await img4.extract(cropOptions).resize(420, 420).toBuffer();

// Composite side-by-side: width = 420 * 3 + 40 padding = 1300, height = 480
const strip = await sharp({
  create: {
    width: 1300,
    height: 480,
    channels: 4,
    background: { r: 241, g: 238, b: 230, alpha: 1 } // #F1EEE6 cream background
  }
})
.composite([
  { input: buf0, top: 40, left: 15 },
  { input: buf2, top: 40, left: 445 },
  { input: buf4, top: 40, left: 875 },
])
.png()
.toFile(`${outDir}/phase2_sequence_comparison.png`);

console.log('Comparison strip saved to phase2_sequence_comparison.png');
