import { execFileSync } from 'child_process';
import sharp from 'sharp';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:/Users/Tomyp/.gemini/antigravity/brain/863dbce5-1730-4fcc-83dc-6561cdd72ad6';
const tempPath = path.resolve('public/temp_africa_center.png');

console.log('Capturing browser with Africa centered...');
execFileSync(chromePath, [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--screenshot=' + tempPath,
  '--window-size=1280,1250',
  '--virtual-time-budget=400',
  'http://127.0.0.1:5173/works?freeze=1'
]);

await sharp(tempPath)
  .extract({ left: 100, top: 0, width: 1080, height: 1060 })
  .toFile(`${outDir}/phase2_africa_center.png`);

console.log('Saved phase2_africa_center.png');
