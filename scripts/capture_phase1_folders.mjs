import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = 'C:/Users/Tomyp/.gemini/antigravity/brain/863dbce5-1730-4fcc-83dc-6561cdd72ad6';
const tmpProfile = 'C:/Users/Tomyp/AppData/Local/Temp/chrome_folders_' + Date.now();

try {
  execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' });
} catch (_) {}

async function captureFolders() {
  console.log('[Capture] Launching Chrome for ProjectFolders capture...');
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--no-sandbox',
    '--enable-gpu-rasterization',
    `--user-data-dir=${tmpProfile}`,
    '--disk-cache-size=1',
    'http://127.0.0.1:5173/works'
  ]);

  await new Promise(r => setTimeout(r, 2200));

  const listRes = await fetch('http://127.0.0.1:9222/json');
  const tabs = await listRes.json();
  const tab = tabs.find(t => t.url.includes('127.0.0.1:5173')) || tabs[0];
  const ws = new WebSocket(tab.webSocketDebuggerUrl);

  let reqId = 1;
  const send = (method, params = {}) => {
    return new Promise((resolve) => {
      const id = reqId++;
      const handler = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.id === id) {
          ws.removeEventListener('message', handler);
          resolve(data.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  };

  await new Promise((res) => { ws.onopen = res; });

  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 1050,
    deviceScaleFactor: 1.5,
    mobile: false
  });

  await new Promise(r => setTimeout(r, 1800));

  // Scroll to #selected-projects
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const el = document.getElementById('selected-projects');
        if (el) {
          el.scrollIntoView({ block: 'center' });
        }
      })()
    `
  });

  await new Promise(r => setTimeout(r, 1000));

  // Capture full viewport
  const shot = await send('Page.captureScreenshot', {
    format: 'png',
    clip: { x: 0, y: 0, width: 1440, height: 1050, scale: 1 }
  });
  fs.writeFileSync(path.join(outDir, 'fase1_project_folders_1440px.png'), Buffer.from(shot.data, 'base64'));
  console.log('[Success] Saved fase1_project_folders_1440px.png');

  try { execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' }); } catch (_) {}
}

captureFolders().catch(err => {
  console.error('Capture failed:', err);
  try { execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' }); } catch (_) {}
});
