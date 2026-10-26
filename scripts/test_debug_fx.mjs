import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const outDir = 'C:/Users/Tomyp/.gemini/antigravity/brain/863dbce5-1730-4fcc-83dc-6561cdd72ad6';
const tmpProfile = 'C:/Users/Tomyp/AppData/Local/Temp/chrome_fx_' + Date.now();

try {
  execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' });
} catch (_) {}

async function captureOne(url, filename) {
  try {
    execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' });
  } catch (_) {}
  await new Promise(r => setTimeout(r, 600));

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--no-sandbox',
    '--disable-gpu',
    `--user-data-dir=${tmpProfile}`,
    '--disk-cache-size=1',
    url
  ]);

  await new Promise(r => setTimeout(r, 2200));

  const listRes = await fetch('http://127.0.0.1:9222/json');
  const tabs = await listRes.json();
  const tab = tabs.find(tab => tab.url.includes('127.0.0.1:5173')) || tabs[0];
  const ws = new WebSocket(tab.webSocketDebuggerUrl);

  return new Promise((resolve, reject) => {
    let reqId = 1;
    const send = (method, params = {}) => {
      const id = reqId++;
      ws.send(JSON.stringify({ id, method, params }));
      return id;
    };

    ws.onopen = async () => {
      send('Emulation.setDeviceMetricsOverride', {
        width: 1440,
        height: 1050,
        deviceScaleFactor: 1,
        mobile: false
      });

      setTimeout(() => {
        send('Page.captureScreenshot', {
          format: 'png',
          clip: { x: 0, y: 0, width: 1440, height: 1050, scale: 1 }
        });
      }, 1800);
    };

    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.result && data.result.data) {
        const buf = Buffer.from(data.result.data, 'base64');
        fs.writeFileSync(path.join(outDir, filename), buf);
        console.log(`Saved ${filename}`);
        try { execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' }); } catch (_) {}
        resolve();
      }
    };

    ws.onerror = (err) => {
      try { execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' }); } catch (_) {}
      reject(err);
    };
  });
}

async function analyzeColors(filename) {
  const img = await sharp(path.join(outDir, filename)).raw().toBuffer({ resolveWithObject: true });
  const { data, info } = img;
  let bluePixels = 0;
  let redPixels = 0;

  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i], g = data[i+1], b = data[i+2];
    // Blue for magnet: high blue, low red
    if (b > 180 && r < 50 && g > 70 && g < 150) {
      bluePixels++;
    }
    // Red for wave: high red, low blue and green
    if (r > 180 && g < 50 && b < 50) {
      redPixels++;
    }
  }
  return { bluePixels, redPixels };
}

async function run() {
  console.log('[FX Test 1] Testing magnet with ?debug=fx...');
  await captureOne('http://127.0.0.1:5173/works?debug=fx&state=magnet&cursor=0,0&freeze=1&time=0', 'debug_fx_magnet.png');
  const resMagnet = await analyzeColors('debug_fx_magnet.png');
  console.log('Magnet colors in debug_fx_magnet.png:', resMagnet);

  console.log('[FX Test 2] Testing wave with ?debug=fx...');
  await captureOne('http://127.0.0.1:5173/works?debug=fx&wave=1&freeze=1&time=0', 'debug_fx_wave.png');
  const resWave = await analyzeColors('debug_fx_wave.png');
  console.log('Wave colors in debug_fx_wave.png:', resWave);
}

run();
