import { execFileSync } from 'child_process';
import sharp from 'sharp';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:/Users/Tomyp/.gemini/antigravity/brain/863dbce5-1730-4fcc-83dc-6561cdd72ad6';

async function run() {
  console.log('Capturing Screenshot 1: All 4 circles visible (t=28.8s)...');
  const tempAll4 = path.resolve('public/temp_final_all4.png');
  execFileSync(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--screenshot=' + tempAll4,
    '--window-size=1440,1350',
    'http://127.0.0.1:5173/works?freeze=1&time=28.8'
  ]);

  await sharp(tempAll4)
    .extract({ left: 80, top: 0, width: 1280, height: 1100 })
    .toFile(path.join(outDir, 'phase4_final_4circles_visible.png'));
  console.log('Saved phase4_final_4circles_visible.png');

  console.log('Capturing Screenshot 2: Circle crossing behind the title (t=0s)...');
  const tempBehind = path.resolve('public/temp_final_behind.png');
  execFileSync(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--screenshot=' + tempBehind,
    '--window-size=1440,1350',
    'http://127.0.0.1:5173/works?freeze=1&time=0'
  ]);

  await sharp(tempBehind)
    .extract({ left: 80, top: 0, width: 1280, height: 1100 })
    .toFile(path.join(outDir, 'phase4_final_circle_behind_title.png'));
  console.log('Saved phase4_final_circle_behind_title.png');

  // Also close-up crop of the title area at t=0s to show the letters cleanly over the circle
  await sharp(tempBehind)
    .extract({ left: 360, top: 50, width: 720, height: 350 })
    .toFile(path.join(outDir, 'phase4_final_title_closeup.png'));
  console.log('Saved phase4_final_title_closeup.png');
}

run().catch(console.error);
