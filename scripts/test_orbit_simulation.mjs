import { execFileSync } from 'child_process';
import sharp from 'sharp';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:/Users/Tomyp/.gemini/antigravity/brain/863dbce5-1730-4fcc-83dc-6561cdd72ad6';

async function captureFrame(timeOffset, outName) {
  const tempPath = path.resolve(`public/temp_${outName}.png`);
  console.log(`Capturing frame at time=${timeOffset}...`);
  execFileSync(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--screenshot=' + tempPath,
    '--window-size=1440,1350',
    `http://127.0.0.1:5173/works?freeze=1&time=${timeOffset}`
  ]);

  await sharp(tempPath)
    .extract({ left: 80, top: 0, width: 1280, height: 1100 })
    .toFile(`${outDir}/${outName}.png`);

  console.log(`Saved ${outName}.png`);
}

// First update PlanetHero with the proper orbital inclinations so orbits wrap across front and back
console.log('Capturing sequence...');
await captureFrame(0, 'orbit_t0');
await captureFrame(6, 'orbit_t6');
await captureFrame(14, 'orbit_t14');
await captureFrame(22, 'orbit_t22');
console.log('Sequence done.');
