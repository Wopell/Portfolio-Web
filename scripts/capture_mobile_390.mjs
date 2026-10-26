import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = 'C:/Users/Tomyp/.gemini/antigravity/brain/863dbce5-1730-4fcc-83dc-6561cdd72ad6';

try {
  execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' });
} catch (_) {}

await new Promise(r => setTimeout(r, 1000));

console.log('Capturing phase6_mobile_390.png...');
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--no-sandbox',
  '--disable-gpu',
  'http://127.0.0.1:5173/works?freeze=1&time=0'
]);

await new Promise(r => setTimeout(r, 2500));

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
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    setTimeout(() => {
      send('Page.captureScreenshot', {
        format: 'png',
        clip: { x: 0, y: 0, width: 390, height: 844, scale: 1 }
      });
    }, 2000);
  };

  ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    if (data.result && data.result.data) {
      const buffer = Buffer.from(data.result.data, 'base64');
      fs.writeFileSync(path.join(outDir, 'phase6_mobile_390.png'), buffer);
      console.log('Successfully saved phase6_mobile_390.png');
      try {
        execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' });
      } catch (_) {}
      resolve();
      process.exit(0);
    }
  };

  ws.onerror = (err) => {
    try {
      execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' });
    } catch (_) {}
    reject(err);
  };
});
