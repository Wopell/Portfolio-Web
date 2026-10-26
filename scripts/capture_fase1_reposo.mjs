import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/Tomyp/.gemini/antigravity/brain/863dbce5-1730-4fcc-83dc-6561cdd72ad6';
const tmpProfile = 'C:/Users/Tomyp/AppData/Local/Temp/chrome_fase1_reposo_' + Date.now();

try {
  execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' });
} catch (_) {}

async function run() {
  console.log('Launching Chrome for 1440px repose screenshots...');
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--no-sandbox',
    '--window-size=1440,1100',
    `--user-data-dir=${tmpProfile}`,
    'http://127.0.0.1:5173/works'
  ]);

  await new Promise(r => setTimeout(r, 2500));

  const listRes = await fetch('http://127.0.0.1:9222/json');
  const tabs = await listRes.json();
  const tab = tabs.find(t => t.url.includes('127.0.0.1:5173')) || tabs[0];
  const ws = new WebSocket(tab.webSocketDebuggerUrl);

  let reqId = 1;
  const send = (method, params = {}) => {
    return new Promise((resolve, reject) => {
      const id = reqId++;
      const handler = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.id === id) {
          ws.removeEventListener('message', handler);
          if (data.error) reject(data.error);
          else resolve(data.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  };

  await new Promise((res) => { ws.onopen = res; });

  await send('Runtime.enable');
  await send('Page.enable');
  await send('DOM.enable');

  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 1100,
    deviceScaleFactor: 1,
    mobile: false
  });

  // Wait for initial page hydration
  await new Promise(r => setTimeout(r, 3000));

  // 1. Full page repose screenshot
  console.log('Capturing full page in repose at 1440px...');
  const captureFull = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true
  });
  const fullPath = path.join(ARTIFACT_DIR, 'fase1_reposo_fiel_1440px.png');
  fs.writeFileSync(fullPath, Buffer.from(captureFull.data, 'base64'));
  console.log(`Saved full page: ${fullPath} (${fs.statSync(fullPath).size} bytes)`);

  // 2. Scroll to #selected-projects for detailed viewport screenshot
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const sec = document.getElementById('selected-projects');
        if (sec) {
          const rect = sec.getBoundingClientRect();
          window.scrollBy({ top: rect.top - 110, behavior: 'instant' });
        }
      })()
    `
  });

  await new Promise(r => setTimeout(r, 600));

  const captureDetail = await send('Page.captureScreenshot', {
    format: 'png'
  });
  const detailPath = path.join(ARTIFACT_DIR, 'fase1_selected_projects_detail_1440px.png');
  fs.writeFileSync(detailPath, Buffer.from(captureDetail.data, 'base64'));
  console.log(`Saved detail zoom: ${detailPath} (${fs.statSync(detailPath).size} bytes)`);

  ws.close();
  try {
    execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' });
  } catch (_) {}
  console.log('Done!');
}

run().catch(err => {
  console.error('Error running capture:', err);
  try {
    execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' });
  } catch (_) {}
  process.exit(1);
});
