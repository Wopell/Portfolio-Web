import { execFileSync } from 'child_process';
import sharp from 'sharp';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:/Users/Tomyp/.gemini/antigravity/brain/863dbce5-1730-4fcc-83dc-6561cdd72ad6';

async function run() {
  // 1. Reposo idéntico (sin cursor en hero, tiempo congelado)
  console.log('Capturing 1: Reposo idéntico...');
  const temp1 = path.resolve('public/temp_phase5b_reposo.png');
  execFileSync(chromePath, [
    '--headless=new',
    '--no-sandbox',
    '--screenshot=' + temp1,
    '--window-size=1440,1350',
    'http://127.0.0.1:5173/works?time=0&freeze=1'
  ]);
  await sharp(temp1)
    .extract({ left: 80, top: 0, width: 1280, height: 1100 })
    .toFile(path.join(outDir, 'phase5b_reposo.png'));
  console.log('Saved phase5b_reposo.png');

  // 2. Imán estático sobre continente (África: cursor=0.1,0.06&state=magnet)
  console.log('Capturing 2: Imán estático sobre continente...');
  const temp2 = path.resolve('public/temp_phase5b_iman.png');
  execFileSync(chromePath, [
    '--headless=new',
    '--no-sandbox',
    '--screenshot=' + temp2,
    '--window-size=1440,1350',
    'http://127.0.0.1:5173/works?debug=1&time=0&freeze=1&cursor=0.1,0.06&state=magnet'
  ]);
  await sharp(temp2)
    .extract({ left: 80, top: 0, width: 1280, height: 1100 })
    .toFile(path.join(outDir, 'phase5b_iman_continente.png'));
  console.log('Saved phase5b_iman_continente.png');

  // 3. Onda activa en movimiento (wave=1)
  console.log('Capturing 3: Onda activa en movimiento...');
  const temp3 = path.resolve('public/temp_phase5b_onda.png');
  execFileSync(chromePath, [
    '--headless=new',
    '--no-sandbox',
    '--screenshot=' + temp3,
    '--window-size=1440,1350',
    'http://127.0.0.1:5173/works?debug=1&time=0&freeze=1&wave=1'
  ]);
  await sharp(temp3)
    .extract({ left: 80, top: 0, width: 1280, height: 1100 })
    .toFile(path.join(outDir, 'phase5b_onda_movimiento.png'));
  console.log('Saved phase5b_onda_movimiento.png');

  // 4. Panel con 60 FPS estables
  console.log('Capturing 4: FPS HUD...');
  const temp4 = path.resolve('public/temp_phase5b_fps.png');
  execFileSync(chromePath, [
    '--headless=new',
    '--no-sandbox',
    '--screenshot=' + temp4,
    '--window-size=1440,1350',
    'http://127.0.0.1:5173/works?debug=1&time=0&freeze=1'
  ]);
  await sharp(temp4)
    .extract({ left: 80, top: 0, width: 1280, height: 1100 })
    .toFile(path.join(outDir, 'phase5b_fps.png'));
  console.log('Saved phase5b_fps.png');

  console.log('All 4 Phase 5B screenshots captured successfully!');
}

run().catch(console.error);
