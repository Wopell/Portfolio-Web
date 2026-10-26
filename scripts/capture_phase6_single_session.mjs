import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = 'C:/Users/Tomyp/.gemini/antigravity/brain/863dbce5-1730-4fcc-83dc-6561cdd72ad6';

const targets = [
  { name: 'phase6_test_points_9000.png', url: 'http://127.0.0.1:5173/works?points=9000&freeze=1&time=0', width: 1440, height: 1050, dpr: 1, mobile: false },
  { name: 'phase6_desktop_1440.png', url: 'http://127.0.0.1:5173/works?freeze=1&time=0', width: 1440, height: 1050, dpr: 1, mobile: false },
  { name: 'phase6_tablet_768.png', url: 'http://127.0.0.1:5173/works?freeze=1&time=0', width: 768, height: 1024, dpr: 1, mobile: false },
  { name: 'phase6_mobile_390.png', url: 'http://127.0.0.1:5173/works?freeze=1&time=0', width: 390, height: 844, dpr: 2, mobile: true },
  { name: 'phase6_hud_1440.png', url: 'http://127.0.0.1:5173/works?debug=1&time=0', width: 1440, height: 1050, dpr: 1, mobile: false },
  { name: 'phase6_hud_768.png', url: 'http://127.0.0.1:5173/works?debug=1&time=0', width: 768, height: 1024, dpr: 1, mobile: false },
  { name: 'phase6_hud_390.png', url: 'http://127.0.0.1:5173/works?debug=1&time=0', width: 390, height: 844, dpr: 2, mobile: true },
];

async function run() {
  console.log('Starting Chrome...');
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--no-sandbox',
    '--disable-gpu',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  const listRes = await fetch('http://127.0.0.1:9222/json');
  const tabs = await listRes.json();
  const tab = tabs[0];
  const ws = new WebSocket(tab.webSocketDebuggerUrl);

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let reqId = 1;
  function sendCommand(method, params = {}) {
    return new Promise((resolve) => {
      const id = reqId++;
      const handler = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id === id) {
          ws.removeEventListener('message', handler);
          resolve(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await sendCommand('Page.enable');

  for (const t of targets) {
    console.log(`Processing ${t.name} (${t.width}x${t.height}, dpr: ${t.dpr})...`);
    await sendCommand('Emulation.setDeviceMetricsOverride', {
      width: t.width,
      height: t.height,
      deviceScaleFactor: t.dpr,
      mobile: t.mobile
    });

    await sendCommand('Page.navigate', { url: t.url });
    // Esperar navegación y renderizado de frames
    await new Promise(r => setTimeout(r, 1600));

    const res = await sendCommand('Page.captureScreenshot', {
      format: 'png',
      clip: { x: 0, y: 0, width: t.width, height: t.height, scale: 1 }
    });

    if (res && res.data) {
      const buf = Buffer.from(res.data, 'base64');
      fs.writeFileSync(path.join(outDir, t.name), buf);
      console.log(`-> Saved ${t.name}`);
    } else {
      console.error(`Failed to capture ${t.name}:`, res);
    }
  }

  console.log('All captures completed!');
  await sendCommand('Browser.close').catch(() => {});
  chrome.kill();
}

run().catch(err => {
  console.error('Error in capture session:', err);
  process.exit(1);
});
