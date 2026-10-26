import { execFileSync } from 'child_process';
import sharp from 'sharp';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:/Users/Tomyp/.gemini/antigravity/brain/863dbce5-1730-4fcc-83dc-6561cdd72ad6';

async function captureFrame(url, name) {
  const tempPath = path.resolve(`public/temp_${name}.png`);
  console.log(`Capturing ${name} from ${url}...`);
  execFileSync(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--screenshot=' + tempPath,
    '--window-size=1440,1350',
    url
  ]);

  await sharp(tempPath)
    .extract({ left: 80, top: 0, width: 1280, height: 1100 })
    .toFile(`${outDir}/${name}.png`);

  console.log(`Saved ${name}.png`);
}

console.log('Capturing Phase 4 screenshots...');

// 1. 3 screenshots with 3 seconds of difference
await captureFrame('http://127.0.0.1:5173/works?freeze=1&time=3', 'phase4_t3s');
await captureFrame('http://127.0.0.1:5173/works?freeze=1&time=6', 'phase4_t6s');
await captureFrame('http://127.0.0.1:5173/works?freeze=1&time=9', 'phase4_t9s');

// 2. 1 screenshot with hover active on work-1 (front circle)
await captureFrame('http://127.0.0.1:5173/works?freeze=1&time=3&hover=0', 'phase4_hover');

// 3. Create a 3-column composite of the 3s difference
const f3 = await sharp(`${outDir}/phase4_t3s.png`).resize(420, 360).toBuffer();
const f6 = await sharp(`${outDir}/phase4_t6s.png`).resize(420, 360).toBuffer();
const f9 = await sharp(`${outDir}/phase4_t9s.png`).resize(420, 360).toBuffer();

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
.toFile(`${outDir}/phase4_3sec_comparison.png`);

console.log('Saved phase4_3sec_comparison.png');
console.log('All Phase 4 captures completed successfully!');
