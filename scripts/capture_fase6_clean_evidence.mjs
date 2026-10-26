import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = 'C:/Users/Tomyp/.gemini/antigravity/brain/863dbce5-1730-4fcc-83dc-6561cdd72ad6';
const tmpProfile = 'C:/Users/Tomyp/AppData/Local/Temp/chrome_clean_' + Date.now();

try {
  execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' });
} catch (_) {}

const targets = [
  // Item 1: Jitter tests (full 1440x1050)
  { name: 'evidence_jitter035_18000.png', url: 'http://127.0.0.1:5173/works?points=18000&freeze=1&time=0', width: 1440, height: 1050 },
  { name: 'evidence_jitter035_12000.png', url: 'http://127.0.0.1:5173/works?points=12000&freeze=1&time=0', width: 1440, height: 1050 },

  // Item 3: Evidencia sin recortar a 1440px
  // c) Planeta en reposo (sin cursor)
  { name: 'evidence_planeta_reposo.png', url: 'http://127.0.0.1:5173/works?freeze=1&time=0', width: 1440, height: 1050 },
  
  // b) Imán en reposo (cursor sobre continente en reposo)
  { name: 'evidence_iman_reposo.png', url: 'http://127.0.0.1:5173/works?cursor=0.05,-0.10&state=magnet&debug=1&freeze=1&time=0', width: 1440, height: 1050 },
  
  // a) Onda activa moviendo el cursor sobre un continente
  { name: 'evidence_onda_activa.png', url: 'http://127.0.0.1:5173/works?debug=1&wave=1&freeze=1&time=0', width: 1440, height: 1050 },

  // d) Panel de FPS con cursor quieto
  { name: 'evidence_fps_quieto.png', url: 'http://127.0.0.1:5173/works?debug=1&time=0', width: 1440, height: 1050 },

  // d) Panel de FPS con cursor en movimiento
  { name: 'evidence_fps_movimiento.png', url: 'http://127.0.0.1:5173/works?debug=1&wave=1&time=0', width: 1440, height: 1050 },
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

        // Wait 1.8s for canvas & shaders
        setTimeout(() => {
          send('Page.captureScreenshot', {
            format: 'png',
            clip: { x: 0, y: 0, width: t.width, height: t.height, scale: 1 }
          });
        }, 1800);
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
    console.error(`Error capturing ${t.name}:`, err);
    try { execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' }); } catch (_) {}
  }
}

async function run() {
  for (const t of targets) {
    await captureOne(t);
    await new Promise(r => setTimeout(r, 700));
  }
  console.log('All clean evidence captures complete!');
}

run();
