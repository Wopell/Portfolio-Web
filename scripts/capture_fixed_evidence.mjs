import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const outDir = 'C:/Users/Tomyp/.gemini/antigravity/brain/863dbce5-1730-4fcc-83dc-6561cdd72ad6';
const tmpProfile = 'C:/Users/Tomyp/AppData/Local/Temp/chrome_evidence_' + Date.now();

try {
  execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' });
} catch (_) {}

const targets = [
  {
    name: 'evidence_reposo_comparacion.png',
    url: 'http://127.0.0.1:5173/works?debug=1&freeze=1&time=0',
    width: 1440,
    height: 1050
  },
  {
    name: 'evidence_iman_reposo_fixed.png',
    url: 'http://127.0.0.1:5173/works?cursor=0.05,-0.10&state=magnet&debug=1&freeze=1&time=0',
    width: 1440,
    height: 1050
  },
  {
    name: 'evidence_onda_activa_fixed.png',
    url: 'http://127.0.0.1:5173/works?debug=1&wave=1&freeze=1&time=0',
    width: 1440,
    height: 1050
  }
];

async function captureOne(t) {
  try {
    execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' });
  } catch (_) {}
  await new Promise(r => setTimeout(r, 600));

  console.log(`[Capture] Launching ${t.name}...`);
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--no-sandbox',
    '--disable-gpu',
    `--user-data-dir=${tmpProfile}`,
    '--disk-cache-size=1',
    t.url
  ]);

  await new Promise(r => setTimeout(r, 2200));

  try {
    const listRes = await fetch('http://127.0.0.1:9222/json');
    const tabs = await listRes.json();
    const tab = tabs.find(tab => tab.url.includes('127.0.0.1:5173')) || tabs[0];
    const ws = new WebSocket(tab.webSocketDebuggerUrl);

    await new Promise((resolve, reject) => {
      let reqId = 1;
      const send = (method, params = {}) => {
        const id = reqId++;
        ws.send(JSON.stringify({ id, method, params }));
        return id;
      };

      ws.onopen = async () => {
        send('Network.enable');
        send('Network.setCacheDisabled', { cacheDisabled: true });
        send('Emulation.setDeviceMetricsOverride', {
          width: t.width,
          height: t.height,
          deviceScaleFactor: 1,
          mobile: false
        });

        setTimeout(() => {
          send('Page.captureScreenshot', {
            format: 'png',
            clip: { x: 0, y: 0, width: t.width, height: t.height, scale: 1 }
          });
        }, 2200);
      };

      ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.result && data.result.data) {
          const buf = Buffer.from(data.result.data, 'base64');
          fs.writeFileSync(path.join(outDir, t.name), buf);
          console.log(`[Success] Saved ${t.name}`);
          try { execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' }); } catch (_) {}
          resolve();
        }
      };

      ws.onerror = (err) => {
        try { execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' }); } catch (_) {}
        reject(err);
      };
    });
  } catch (err) {
    try { execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' }); } catch (_) {}
    console.error(`Failed ${t.name}:`, err);
  }
}

async function compareImages(fileA, fileB, label) {
  const bufA = await sharp(path.join(outDir, fileA)).raw().toBuffer({ resolveWithObject: true });
  const bufB = await sharp(path.join(outDir, fileB)).raw().toBuffer({ resolveWithObject: true });

  const dataA = bufA.data;
  const dataB = bufB.data;
  const len = Math.min(dataA.length, dataB.length);

  let diffPixels = 0;
  let totalDiff = 0;

  // Mask out the top-left HUD (x: 0..380, y: 0..200) to measure planet differences only
  const width = bufA.info.width;
  for (let i = 0; i < len; i += 4) {
    const pxIdx = i / 4;
    const x = pxIdx % width;
    const y = Math.floor(pxIdx / width);

    // Skip HUD region
    if (x < 370 && y < 150) continue;

    const dr = Math.abs(dataA[i] - dataB[i]);
    const dg = Math.abs(dataA[i+1] - dataB[i+1]);
    const db = Math.abs(dataA[i+2] - dataB[i+2]);
    const delta = dr + dg + db;

    if (delta > 15) {
      diffPixels++;
      totalDiff += delta;
    }
  }

  console.log(`[Diff Check - ${label}] Differing planet pixels between ${fileA} and ${fileB}: ${diffPixels} (Mean diff: ${(totalDiff / (diffPixels || 1)).toFixed(2)})`);
}

async function run() {
  for (const t of targets) {
    await captureOne(t);
  }

  console.log('\n--- Comparing Repose vs Magnet & Wave ---');
  await compareImages('evidence_reposo_comparacion.png', 'evidence_iman_reposo_fixed.png', 'Magnet vs Repose');
  await compareImages('evidence_reposo_comparacion.png', 'evidence_onda_activa_fixed.png', 'Wave vs Repose');
}

run();
