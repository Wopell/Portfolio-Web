import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = 'C:/Users/Tomyp/.gemini/antigravity/brain/863dbce5-1730-4fcc-83dc-6561cdd72ad6';
const tmpProfile = 'C:/Users/Tomyp/AppData/Local/Temp/chrome_test_profile_' + Date.now();

try {
  execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' });
} catch (_) {}

const targets = [
  { name: 'phase6_test_points_9000.png', url: 'http://127.0.0.1:5173/works?points=9000&freeze=1&time=0', width: 1440, height: 1050, dpr: 1, mobile: false },
  { name: 'phase6_desktop_1440.png', url: 'http://127.0.0.1:5173/works?freeze=1&time=0', width: 1440, height: 1050, dpr: 1, mobile: false },
  { name: 'phase6_tablet_768.png', url: 'http://127.0.0.1:5173/works?freeze=1&time=0', width: 768, height: 1024, dpr: 1, mobile: false },
  { name: 'phase6_mobile_390.png', url: 'http://127.0.0.1:5173/works?freeze=1&time=0', width: 390, height: 844, dpr: 2, mobile: true },
  { name: 'phase6_hud_1440.png', url: 'http://127.0.0.1:5173/works?debug=1&freeze=1&time=0', width: 1440, height: 1050, dpr: 1, mobile: false },
  { name: 'phase6_hud_768.png', url: 'http://127.0.0.1:5173/works?debug=1&freeze=1&time=0', width: 768, height: 1024, dpr: 1, mobile: false },
  { name: 'phase6_hud_390.png', url: 'http://127.0.0.1:5173/works?debug=1&freeze=1&time=0', width: 390, height: 844, dpr: 2, mobile: true },
];

async function captureOne(t) {
  try {
    execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' });
  } catch (_) {}
  await new Promise(r => setTimeout(r, 600));

  console.log(`[Capture] ${t.name} from ${t.url}...`);
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
          deviceScaleFactor: t.dpr,
          mobile: t.mobile
        });

        // Let canvas draw
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
          console.log(`Saved ${t.name}`);
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
    await new Promise(r => setTimeout(r, 600));
  }
  console.log('All clean captures completed!');
  try {
    fs.rmSync(tmpProfile, { recursive: true, force: true });
  } catch (_) {}
}

run().catch(console.error);
