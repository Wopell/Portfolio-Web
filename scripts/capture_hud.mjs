import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = 'C:/Users/Tomyp/.gemini/antigravity/brain/863dbce5-1730-4fcc-83dc-6561cdd72ad6';

async function run() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--window-size=1440,1050',
    'http://127.0.0.1:5173/works?renderer=webgl&debug=1'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    const listRes = await fetch('http://127.0.0.1:9222/json');
    const tabs = await listRes.json();
    const tab = tabs.find(t => t.url.includes('127.0.0.1:5173')) || tabs[0];
    const ws = new WebSocket(tab.webSocketDebuggerUrl);

    let id = 1;
    const send = (method, params = {}) => ws.send(JSON.stringify({ id: id++, method, params }));

    ws.onopen = () => {
      send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1050, deviceScaleFactor: 1, mobile: false });
      // Allow 3 seconds of animation to measure steady 60 FPS
      setTimeout(() => {
        send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 1440, height: 1050, scale: 1 } });
      }, 3000);
    };

    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.result?.data) {
        fs.writeFileSync(path.join(outDir, 'phase6_debug_hud.png'), Buffer.from(data.result.data, 'base64'));
        console.log('Saved phase6_debug_hud.png');
        chrome.kill();
        process.exit(0);
      }
    };
  } catch (e) {
    console.error(e);
    chrome.kill();
  }
}

run();
