import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = 'C:/Users/Tomyp/.gemini/antigravity/brain/863dbce5-1730-4fcc-83dc-6561cdd72ad6';

async function captureClip(url, width, height, dpr, isMobile, clip, filename) {
  try { execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' }); } catch (_) {}
  await new Promise(r => setTimeout(r, 600));

  console.log(`Capturing crop ${filename}...`);
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--no-sandbox',
    '--disable-gpu',
    url
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

      setTimeout(() => {
        send('Page.captureScreenshot', {
          format: 'png',
          clip: { ...clip, scale: 1 }
        });
      }, 2000);
    };

    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.result && data.result.data) {
        fs.writeFileSync(path.join(outDir, filename), Buffer.from(data.result.data, 'base64'));
        console.log(`Saved crop ${filename}`);
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
  // 1. Crop planet 9000 points at 1440px
  await captureClip(
    'http://127.0.0.1:5173/works?points=9000&freeze=1&time=0',
    1440, 1050, 1, false,
    { x: 360, y: 120, width: 720, height: 720 },
    'crop_planet_points_9000.png'
  );

  // 2. Crop planet tablet 768px (14000 points)
  await captureClip(
    'http://127.0.0.1:5173/works?freeze=1&time=0',
    768, 1024, 1, false,
    { x: 60, y: 120, width: 648, height: 648 },
    'crop_planet_tablet_768.png'
  );

  // 3. Crop planet mobile 390px (12000 points)
  await captureClip(
    'http://127.0.0.1:5173/works?freeze=1&time=0',
    390, 844, 2, true,
    { x: 25, y: 65, width: 340, height: 340 },
    'crop_planet_mobile_390.png'
  );

  // 4. Crop HUD box 1440px
  await captureClip(
    'http://127.0.0.1:5173/works?debug=1&time=0',
    1440, 1050, 1, false,
    { x: 920, y: 10, width: 500, height: 300 },
    'crop_hud_1440.png'
  );

  // 5. Crop HUD box 768px
  await captureClip(
    'http://127.0.0.1:5173/works?debug=1&time=0',
    768, 1024, 1, false,
    { x: 300, y: 10, width: 450, height: 300 },
    'crop_hud_768.png'
  );

  // 6. Crop HUD box 390px
  await captureClip(
    'http://127.0.0.1:5173/works?debug=1&time=0',
    390, 844, 2, true,
    { x: 10, y: 10, width: 370, height: 260 },
    'crop_hud_390.png'
  );

  console.log('All crops finished!');
}

run().catch(console.error);
