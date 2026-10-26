import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = 'C:/Users/Tomyp/.gemini/antigravity/brain/863dbce5-1730-4fcc-83dc-6561cdd72ad6';

async function captureHud(width, height, dpr, isMobile, filename) {
  try {
    execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' });
  } catch (_) {}
  await new Promise(r => setTimeout(r, 600));

  console.log(`Capturing HUD: ${filename} (${width}x${height})...`);
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--no-sandbox',
    '--disable-gpu',
    'http://127.0.0.1:5173/works?debug=1'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  const listRes = await fetch('http://127.0.0.1:9222/json');
  const tabs = await listRes.json();
  const tab = tabs.find(t => t.url.includes('127.0.0.1:5173')) || tabs[0];
  const ws = new WebSocket(tab.webSocketDebuggerUrl);

  await new Promise((resolve, reject) => {
    let reqId = 1;
    const send = (method, params = {}) => {
      const id = reqId++;
      ws.send(JSON.stringify({ id, method, params }));
      return id;
    };

    ws.onopen = async () => {
      send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: dpr,
        mobile: isMobile
      });

      // Let animation run for 2.5s to establish solid 60 FPS
      setTimeout(() => {
        send('Page.captureScreenshot', {
          format: 'png',
          clip: { x: 0, y: 0, width, height, scale: 1 }
        });
      }, 2500);
    };

    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.result && data.result.data) {
        fs.writeFileSync(path.join(outDir, filename), Buffer.from(data.result.data, 'base64'));
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

async function run() {
  await captureHud(768, 1024, 1, false, 'phase6_hud_768.png');
  await new Promise(r => setTimeout(r, 600));
  await captureHud(390, 844, 2, true, 'phase6_hud_390.png');
  console.log('Done capturing HUDs!');
}

run().catch(console.error);
