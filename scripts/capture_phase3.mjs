import { execFileSync } from 'child_process';
import sharp from 'sharp';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:/Users/Tomyp/.gemini/antigravity/brain/863dbce5-1730-4fcc-83dc-6561cdd72ad6';

async function capture(url, outName, delay = 400) {
  const tempPath = path.resolve(`public/temp_${outName}.png`);
  console.log(`Capturing ${url}...`);
  execFileSync(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--screenshot=' + tempPath,
    '--window-size=1440,1350',
    '--virtual-time-budget=' + delay,
    url
  ]);

  // Extract hero viewport
  await sharp(tempPath)
    .extract({ left: 80, top: 0, width: 1280, height: 1100 })
    .toFile(`${outDir}/${outName}.png`);

  console.log(`Saved ${outName}.png`);
}

console.log('Capturing Phase 3 frames...');
await capture('http://127.0.0.1:5173/works?freeze=1', 'phase3_live_t0', 500);
await capture('http://127.0.0.1:5173/works', 'phase3_live_motion1', 1200);
await capture('http://127.0.0.1:5173/works', 'phase3_live_motion2', 2500);

console.log('All Phase 3 captures done!');
