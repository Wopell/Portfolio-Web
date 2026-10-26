import { execFileSync } from 'child_process';
import sharp from 'sharp';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:/Users/Tomyp/.gemini/antigravity/brain/863dbce5-1730-4fcc-83dc-6561cdd72ad6';

async function run() {
  console.log('Capturing Screenshot 1: Cursor outside planet (Resting look + 60fps HUD)...');
  const temp1 = path.resolve('public/temp_phase5_1.png');
  execFileSync(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--screenshot=' + temp1,
    '--window-size=1440,1350',
    'http://127.0.0.1:5173/works?debug=1&time=0&freeze=1'
  ]);

  await sharp(temp1)
    .extract({ left: 80, top: 0, width: 1280, height: 1100 })
    .toFile(path.join(outDir, 'phase5_cursor_outside.png'));
  console.log('Saved phase5_cursor_outside.png');

  console.log('Capturing Screenshot 2: Lens repulsion over land (Africa, cursor=0.1,0.06)...');
  const temp2 = path.resolve('public/temp_phase5_2.png');
  execFileSync(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--screenshot=' + temp2,
    '--window-size=1440,1350',
    'http://127.0.0.1:5173/works?debug=1&time=0&freeze=1&cursor=0.1,0.06'
  ]);

  await sharp(temp2)
    .extract({ left: 80, top: 0, width: 1280, height: 1100 })
    .toFile(path.join(outDir, 'phase5_lens_repulsion_land.png'));
  console.log('Saved phase5_lens_repulsion_land.png');

  console.log('Capturing Screenshot 3: Active drag state (drag=1)...');
  const temp3 = path.resolve('public/temp_phase5_3.png');
  execFileSync(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--screenshot=' + temp3,
    '--window-size=1440,1350',
    'http://127.0.0.1:5173/works?debug=1&time=0&freeze=1&drag=1'
  ]);

  await sharp(temp3)
    .extract({ left: 80, top: 0, width: 1280, height: 1100 })
    .toFile(path.join(outDir, 'phase5_drag_active.png'));
  console.log('Saved phase5_drag_active.png');
}

run().catch(console.error);
