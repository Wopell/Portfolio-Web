import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = 'C:/Users/Tomyp/.gemini/antigravity/brain/863dbce5-1730-4fcc-83dc-6561cdd72ad6';
const tmpProfile = 'C:/Users/Tomyp/AppData/Local/Temp/chrome_test_profile_' + Date.now();

try {
  execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' });
} catch (_) {}

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--no-sandbox',
  '--disable-gpu',
  `--user-data-dir=${tmpProfile}`,
  '--disk-cache-size=1',
  'http://127.0.0.1:5173/works?debug=1'
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
      send('Emulation.setDeviceMetricsOverride', {
        width: 1440,
        height: 1050,
        deviceScaleFactor: 1,
        mobile: false
      });

      // Wait 1s for load
      await new Promise(r => setTimeout(r, 1000));

      // Get planet center
      send('Runtime.evaluate', {
        expression: `(() => {
          const c = document.querySelector('canvas');
          const rect = c.getBoundingClientRect();
          return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
        })()`,
        returnByValue: true
      });
    };

    let planetRect = null;
    ws.onmessage = async (msg) => {
      const data = JSON.parse(msg.data);
      if (data.result && data.result.result && data.result.result.value && !planetRect) {
        planetRect = data.result.result.value;
        console.log('Planet rect:', planetRect);

        const cx = planetRect.left + planetRect.width / 2;
        const cy = planetRect.top + planetRect.height / 2;

        console.log('Simulating mouse moves across planet...');
        // Dispatch mouse moves across the planet
        for (let step = -150; step <= 150; step += 15) {
          send('Input.dispatchMouseEvent', {
            type: 'mouseMoved',
            x: cx + step,
            y: cy + step * 0.3
          });
          await new Promise(r => setTimeout(r, 20));
        }

        // Check telemetry right after move
        setTimeout(() => {
          send('Runtime.evaluate', {
            expression: `(() => {
              return window.__PLANET_HERO_PERF__;
            })()`,
            returnByValue: true
          });
        }, 50);

        // Capture screenshot while wave might be expanding
        setTimeout(() => {
          send('Page.captureScreenshot', {
            format: 'png',
            clip: { x: 0, y: 0, width: 1440, height: 1050, scale: 1 }
          });
        }, 150);
      } else if (data.result && data.result.result && data.result.result.value && planetRect) {
        console.log('Perf telemetry:', data.result.result.value);
      } else if (data.result && data.result.data) {
        const buf = Buffer.from(data.result.data, 'base64');
        fs.writeFileSync(path.join(outDir, 'test_mouse_interaction.png'), buf);
        console.log('Saved test_mouse_interaction.png');
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
  console.error('Error in test:', err);
  try { execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' }); } catch (_) {}
}
