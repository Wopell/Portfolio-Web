import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = 'C:/Users/Tomyp/.gemini/antigravity/brain/863dbce5-1730-4fcc-83dc-6561cdd72ad6';

async function testTime(timeVal) {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--no-sandbox',
    '--disable-gpu',
    `http://127.0.0.1:5173/works?freeze=1&time=${timeVal}`
  ]);
  await new Promise(r => setTimeout(r, 1500));
  const listRes = await fetch('http://127.0.0.1:9222/json');
  const tabs = await listRes.json();
  const tab = tabs.find(t => t.url.includes('127.0.0.1:5173')) || tabs[0];
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  let id = 1;
  const send = (method, params = {}) => ws.send(JSON.stringify({ id: id++, method, params }));
  
  ws.onopen = () => {
    send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    setTimeout(() => {
      send('Runtime.evaluate', {
        expression: `(() => {
          const circles = Array.from(document.querySelectorAll('button, a')).filter(el => el.querySelector('img'));
          return JSON.stringify(circles.map((c, i) => {
            const r = c.getBoundingClientRect();
            return { i, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), z: c.style.zIndex, op: c.style.opacity };
          }));
        })()`,
        returnByValue: true
      });
      setTimeout(() => {
        send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 390, height: 844, scale: 1 } });
      }, 300);
    }, 1200);
  };

  ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    if (data.result?.result?.value) {
      console.log(`[t=${timeVal}]:`, data.result.result.value);
    }
    if (data.result?.data) {
      fs.writeFileSync(path.join(outDir, `test_mobile_t${timeVal}.png`), Buffer.from(data.result.data, 'base64'));
      console.log(`Saved test_mobile_t${timeVal}.png`);
      chrome.kill();
      process.exit(0);
    }
  };
}

testTime(28.8).catch(console.error);
