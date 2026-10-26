import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = 'C:/Users/Tomyp/.gemini/antigravity/brain/863dbce5-1730-4fcc-83dc-6561cdd72ad6';

function killAllChrome() {
  try {
    execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' });
  } catch (_) {}
}

async function captureViewport(url, width, height, dpr, isMobile, filename) {
  killAllChrome();
  await new Promise(r => setTimeout(r, 600));

  console.log(`Capturing ${filename} (${width}x${height}, dpr: ${dpr})...`);
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--no-sandbox',
    '--disable-gpu',
    url
  ]);

  await new Promise((res) => setTimeout(res, 2000));

  try {
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

        // Esperar a que renderFrame dibuje
        setTimeout(() => {
          send('Page.captureScreenshot', {
            format: 'png',
            clip: { x: 0, y: 0, width, height, scale: 1 }
          });
        }, 1800);
      };

      ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.result && data.result.data) {
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
  console.log('=== Step 1: ?points=9000 at 1440px ===');
  await captureViewport('http://127.0.0.1:5173/works?points=9000&freeze=1&time=0', 1440, 1050, 1, false, 'phase6_test_points_9000.png');
  await new Promise(r => setTimeout(r, 600));

  console.log('=== Step 2: 1440px Desktop (18000 points) ===');
  await captureViewport('http://127.0.0.1:5173/works?freeze=1&time=0', 1440, 1050, 1, false, 'phase6_desktop_1440.png');
  await new Promise(r => setTimeout(r, 600));

  console.log('=== Step 3: 768px Tablet (14000 points) ===');
  await captureViewport('http://127.0.0.1:5173/works?freeze=1&time=0', 768, 1024, 1, false, 'phase6_tablet_768.png');
  await new Promise(r => setTimeout(r, 600));

  console.log('=== Step 4: 390px Mobile (12000 points) ===');
  await captureViewport('http://127.0.0.1:5173/works?freeze=1&time=0', 390, 844, 2, true, 'phase6_mobile_390.png');
  await new Promise(r => setTimeout(r, 600));

  console.log('=== Step 5: WebGL HUD debug at 1440px ===');
  await captureViewport('http://127.0.0.1:5173/works?debug=1&time=0', 1440, 1050, 1, false, 'phase6_debug_hud.png');
  await new Promise(r => setTimeout(r, 600));

  console.log('All captures finished cleanly!');
}

run().catch(console.error);
