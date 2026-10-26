import { execFileSync } from 'child_process';
import sharp from 'sharp';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:/Users/Tomyp/.gemini/antigravity/brain/863dbce5-1730-4fcc-83dc-6561cdd72ad6';

async function captureTimeFrame(timeSec, outName) {
  const tempPath = path.resolve(`public/temp_phase2_t${timeSec}.png`);
  console.log(`Capturing browser at time=${timeSec}s...`);
  execFileSync(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--screenshot=' + tempPath,
    '--window-size=1280,1250',
    '--virtual-time-budget=400',
    `http://127.0.0.1:5173/works?time=${timeSec}`
  ]);

  await sharp(tempPath)
    .extract({ left: 100, top: 0, width: 1080, height: 1060 })
    .toFile(`${outDir}/${outName}`);

  console.log(`Saved ${outName}`);
}

await captureTimeFrame(0, 'phase2_live_t0.png');
await captureTimeFrame(2, 'phase2_live_t2.png');
await captureTimeFrame(4, 'phase2_live_t4.png');

console.log('All 3 frames captured successfully.');
