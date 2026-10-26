import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = 'C:/Users/Tomyp/.gemini/antigravity/brain/863dbce5-1730-4fcc-83dc-6561cdd72ad6';

async function captureViewport(url, width, height, dpr, isMobile, filename) {
  console.log(`Capturing ${filename} (${width}x${height}, dpr: ${dpr}) from ${url}...`);
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
        }, 1500);
      };

      ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.result && data.result.data) {
          const buffer = Buffer.from(data.result.data, 'base64');
          fs.writeFileSync(path.join(outDir, filename), buffer);
          console.log(`Saved ${filename}`);
          chrome.kill();
          resolve();
        }
      };

      ws.onerror = (err) => {
        chrome.kill();
        reject(err);
      };
    });
  } catch (e) {
    console.error('Error during capture:', e);
    chrome.kill();
  }
}

async function run() {
  console.log('--- 1. Testing ?points=9000 at 1440px ---');
  await captureViewport('http://127.0.0.1:5173/works?points=9000&freeze=1&time=0', 1440, 1050, 1, false, 'phase6_test_points_9000.png');
  await new Promise(r => setTimeout(r, 1000));

  console.log('--- 2. Desktop 1440px (18000 pts) ---');
  await captureViewport('http://127.0.0.1:5173/works?freeze=1&time=0', 1440, 1050, 1, false, 'phase6_desktop_1440.png');
  await new Promise(r => setTimeout(r, 1000));

  console.log('--- 3. Tablet 768px (14000 pts) ---');
  await captureViewport('http://127.0.0.1:5173/works?freeze=1&time=0', 768, 1024, 1, false, 'phase6_tablet_768.png');
  await new Promise(r => setTimeout(r, 1000));

  console.log('--- 4. Mobile 390px (12000 pts) ---');
  await captureViewport('http://127.0.0.1:5173/works?freeze=1&time=0', 390, 844, 2, true, 'phase6_mobile_390.png');
  await new Promise(r => setTimeout(r, 1000));

  console.log('--- 5. Debug HUD at 1440px ---');
  await captureViewport('http://127.0.0.1:5173/works?debug=1&time=0', 1440, 1050, 1, false, 'phase6_hud_1440.png');
  await new Promise(r => setTimeout(r, 1000));

  console.log('--- 6. Debug HUD at 768px ---');
  await captureViewport('http://127.0.0.1:5173/works?debug=1&time=0', 768, 1024, 1, false, 'phase6_hud_768.png');
  await new Promise(r => setTimeout(r, 1000));

  console.log('--- 7. Debug HUD at 390px ---');
  await captureViewport('http://127.0.0.1:5173/works?debug=1&time=0', 390, 844, 2, true, 'phase6_hud_390.png');
  console.log('All tests finished!');
}

run().catch(console.error);
