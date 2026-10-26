import { execFileSync } from 'child_process';
import sharp from 'sharp';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:/Users/Tomyp/.gemini/antigravity/brain/863dbce5-1730-4fcc-83dc-6561cdd72ad6';

async function capture() {
  const tempPath = path.resolve('public/temp_phase4_audit.png');
  console.log('Capturing phase 4 audit at t=0s...');
  execFileSync(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--screenshot=' + tempPath,
    '--window-size=1440,1350',
    'http://127.0.0.1:5173/works?freeze=1&time=0'
  ]);

  await sharp(tempPath)
    .extract({ left: 80, top: 0, width: 1280, height: 1100 })
    .toFile(outDir + '/phase4_neutral_t0.png');

  console.log('Saved phase4_neutral_t0.png');

  // Also capture with hover on circle 0 to demonstrate hover tooltip works perfectly
  const tempPathHover = path.resolve('public/temp_phase4_hover.png');
  execFileSync(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--screenshot=' + tempPathHover,
    '--window-size=1440,1350',
    'http://127.0.0.1:5173/works?freeze=1&time=0&hover=0'
  ]);

  await sharp(tempPathHover)
    .extract({ left: 80, top: 0, width: 1280, height: 1100 })
    .toFile(outDir + '/phase4_neutral_hover.png');

  console.log('Saved phase4_neutral_hover.png');
}

capture().catch(console.error);
