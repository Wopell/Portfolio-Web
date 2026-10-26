import { execFileSync } from 'child_process';
import sharp from 'sharp';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:/Users/Tomyp/.gemini/antigravity/brain/863dbce5-1730-4fcc-83dc-6561cdd72ad6';

async function capture() {
  const tempPath = path.resolve('public/temp_previews_t0.png');
  console.log('Capturing new previews screenshot at t=0s...');
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
    .toFile(outDir + '/phase4_new_previews.png');

  console.log('Saved phase4_new_previews.png');
}

capture();
