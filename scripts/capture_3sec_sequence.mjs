import { execFileSync } from 'child_process';
import sharp from 'sharp';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:/Users/Tomyp/.gemini/antigravity/brain/863dbce5-1730-4fcc-83dc-6561cdd72ad6';

async function captureFrame(t, name) {
  const tempPath = path.resolve(`public/temp_${name}.png`);
  console.log(`Capturing frame at t=${t}s (${name})...`);
  execFileSync(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--screenshot=' + tempPath,
    '--window-size=1440,1350',
    `http://127.0.0.1:5173/works?freeze=1&time=${t}`
  ]);

  await sharp(tempPath)
    .extract({ left: 80, top: 0, width: 1280, height: 1100 })
    .toFile(`${outDir}/${name}.png`);

  console.log(`Saved ${name}.png`);
}

console.log('Capturing 3 screenshots with 3 seconds of difference (t=3s, t=6s, t=9s)...');
await captureFrame(3, 'phase3_t3s');
await captureFrame(6, 'phase3_t6s');
await captureFrame(9, 'phase3_t9s');

// Also create a 3-column composite side by side
const f3 = await sharp(`${outDir}/phase3_t3s.png`).resize(420, 360).toBuffer();
const f6 = await sharp(`${outDir}/phase3_t6s.png`).resize(420, 360).toBuffer();
const f9 = await sharp(`${outDir}/phase3_t9s.png`).resize(420, 360).toBuffer();

await sharp({
  create: {
    width: 1300,
    height: 380,
    channels: 4,
    background: '#EAE6DC'
  }
})
.composite([
  { input: f3, left: 10, top: 10 },
  { input: f6, left: 440, top: 10 },
  { input: f9, left: 870, top: 10 },
])
.png()
.toFile(`${outDir}/phase3_3sec_comparison.png`);

console.log('Saved phase3_3sec_comparison.png');
