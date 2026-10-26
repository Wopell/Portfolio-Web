import { execFileSync } from 'child_process';
import sharp from 'sharp';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:/Users/Tomyp/.gemini/antigravity/brain/863dbce5-1730-4fcc-83dc-6561cdd72ad6';

async function run() {
  console.log('Capturing 1: Desktop 1440px...');
  const temp1440 = path.resolve('public/temp_p6_1440.png');
  execFileSync(chromePath, [
    '--headless=new',
    '--no-sandbox',
    '--screenshot=' + temp1440,
    '--window-size=1440,1100',
    'http://127.0.0.1:5173/works?debug=1&time=0&freeze=1'
  ]);
  await sharp(temp1440)
    .extract({ left: 80, top: 0, width: 1280, height: 1100 })
    .toFile(path.join(outDir, 'phase6_desktop_1440.png'));
  console.log('Saved phase6_desktop_1440.png');

  console.log('Capturing 2: Tablet 768px...');
  const temp768 = path.resolve('public/temp_p6_768.png');
  execFileSync(chromePath, [
    '--headless=new',
    '--no-sandbox',
    '--screenshot=' + temp768,
    '--window-size=768,1050',
    'http://127.0.0.1:5173/works?debug=1&time=0&freeze=1'
  ]);
  await sharp(temp768)
    .toFile(path.join(outDir, 'phase6_tablet_768.png'));
  console.log('Saved phase6_tablet_768.png');

  console.log('Capturing 3: Mobile 390px...');
  const temp390 = path.resolve('public/temp_p6_390.png');
  execFileSync(chromePath, [
    '--headless=new',
    '--no-sandbox',
    '--screenshot=' + temp390,
    '--window-size=390,950',
    'http://127.0.0.1:5173/works?debug=1&time=0&freeze=1'
  ]);
  await sharp(temp390)
    .toFile(path.join(outDir, 'phase6_mobile_390.png'));
  console.log('Saved phase6_mobile_390.png');

  console.log('Phase 6 screenshots captured successfully!');
}

run().catch(console.error);
