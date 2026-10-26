import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const outDir = 'C:/Users/Tomyp/.gemini/antigravity/brain/863dbce5-1730-4fcc-83dc-6561cdd72ad6';

function killAllChrome() {
  try {
    execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' });
  } catch (_) {}
}

async function captureUrl(url, filename) {
  killAllChrome();
  await new Promise(r => setTimeout(r, 600));

  console.log(`Capturing ${filename} from ${url}...`);
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--no-sandbox',
    '--disable-gpu',
    url
  ]);
  await new Promise(r => setTimeout(r, 2000));

  try {
    const listRes = await fetch('http://127.0.0.1:9222/json');
    const tabs = await listRes.json();
    const tab = tabs.find(t => t.url.includes('127.0.0.1:5173')) || tabs[0];
    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    let id = 1;
    const send = (method, params = {}) => ws.send(JSON.stringify({ id: id++, method, params }));

    await new Promise((resolve, reject) => {
      ws.onopen = () => {
        send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1050, deviceScaleFactor: 1, mobile: false });
        setTimeout(() => {
          send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 1440, height: 1050, scale: 1 } });
        }, 1500);
      };

      ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.result?.data) {
          const buffer = Buffer.from(data.result.data, 'base64');
          fs.writeFileSync(path.join(outDir, filename), buffer);
          console.log(`Saved ${filename}`);
          killAllChrome();
          resolve();
        }
      };

      ws.onerror = (err) => {
        killAllChrome();
        reject(err);
      };
    });
  } catch (e) {
    console.error('Error during capture:', e);
    killAllChrome();
  }
}

async function run() {
  await captureUrl('http://127.0.0.1:5173/works?renderer=2d&freeze=1&time=0', 'parity_2d_1440.png');
  await new Promise(r => setTimeout(r, 600));
  await captureUrl('http://127.0.0.1:5173/works?renderer=webgl&freeze=1&time=0', 'parity_webgl_1440.png');

  console.log('Comparing 2D vs WebGL images...');
  const img2d = sharp(path.join(outDir, 'parity_2d_1440.png'));
  const imgWebGL = sharp(path.join(outDir, 'parity_webgl_1440.png'));

  // Crop to planet area: left: 300, top: 310, width: 840, height: 720
  const cropBox = { left: 300, top: 310, width: 840, height: 720 };
  const raw2d = await img2d.extract(cropBox).raw().toBuffer();
  const rawWebGL = await imgWebGL.extract(cropBox).raw().toBuffer();

  let totalDiff = 0;
  let totalPixels = cropBox.width * cropBox.height;
  const diffBuffer = Buffer.alloc(totalPixels * 3);

  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 3;
    const dr = Math.abs(raw2d[idx] - rawWebGL[idx]);
    const dg = Math.abs(raw2d[idx + 1] - rawWebGL[idx + 1]);
    const db = Math.abs(raw2d[idx + 2] - rawWebGL[idx + 2]);
    const pixelDiff = (dr + dg + db) / 3;
    totalDiff += pixelDiff;

    // Amplified diff for visual inspection (x10)
    diffBuffer[idx] = Math.min(255, dr * 10);
    diffBuffer[idx + 1] = Math.min(255, dg * 10);
    diffBuffer[idx + 2] = Math.min(255, db * 10);
  }

  const mad = totalDiff / totalPixels;
  const pct = (mad / 255) * 100;
  console.log(`=== RESULTADO DE PARIDAD 2D vs WEBGL ===`);
  console.log(`Diferencia Media Absoluta de Brillo (MAD): ${mad.toFixed(3)} / 255`);
  console.log(`Diferencia Porcentual: ${pct.toFixed(2)}%`);
  console.log(`========================================`);

  // Create side-by-side composite
  const cropped2dBuf = await sharp(path.join(outDir, 'parity_2d_1440.png')).extract(cropBox).png().toBuffer();
  const croppedWebGLBuf = await sharp(path.join(outDir, 'parity_webgl_1440.png')).extract(cropBox).png().toBuffer();

  await sharp({
    create: {
      width: cropBox.width * 2 + 20,
      height: cropBox.height,
      channels: 4,
      background: { r: 245, g: 242, b: 235, alpha: 1 }
    }
  })
  .composite([
    { input: cropped2dBuf, left: 0, top: 0 },
    { input: croppedWebGLBuf, left: cropBox.width + 20, top: 0 }
  ])
  .png()
  .toFile(path.join(outDir, 'parity_comparison_1440.png'));

  console.log('Saved parity_comparison_1440.png successfully!');
}

run().catch(console.error);
