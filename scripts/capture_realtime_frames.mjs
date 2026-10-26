import { spawn } from 'child_process';
import WebSocket from 'ws';
import sharp from 'sharp';
import fs from 'fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:/Users/Tomyp/.gemini/antigravity/brain/863dbce5-1730-4fcc-83dc-6561cdd72ad6';

const chromeProcess = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--disable-gpu',
  '--no-sandbox',
  '--window-size=1280,1250',
  'http://127.0.0.1:5173/works'
]);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let wsUrl = null;
for (let i = 0; i < 40; i++) {
  await sleep(200);
  try {
    const res = await fetch('http://127.0.0.1:9222/json/list');
    const list = await res.json();
    if (list && list.length > 0 && list[0].webSocketDebuggerUrl) {
      wsUrl = list[0].webSocketDebuggerUrl;
      break;
    }
  } catch (e) {}
}

if (!wsUrl) {
  console.error('Failed to get wsUrl');
  chromeProcess.kill();
  process.exit(1);
}

console.log('Connecting to:', wsUrl);
const ws = new WebSocket(wsUrl);

await new Promise(resolve => ws.on('open', resolve));

let reqId = 1;
function sendCommand(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = reqId++;
    const onMsg = (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.id === id) {
          ws.off('message', onMsg);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      } catch (e) {}
    };
    ws.on('message', onMsg);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

await sendCommand('Page.enable');
console.log('Page enabled. Waiting for page load and initial spin...');
await sleep(2000);

async function captureCropped(filename) {
  const result = await sendCommand('Page.captureScreenshot', { format: 'png' });
  const buffer = Buffer.from(result.data, 'base64');
  await sharp(buffer)
    .extract({ left: 100, top: 0, width: 1080, height: 1060 })
    .toFile(`${outDir}/${filename}`);
  console.log(`Saved ${filename}`);
}

console.log('Taking t=0s screenshot...');
await captureCropped('phase2_live_f1.png');

console.log('Waiting 2 seconds...');
await sleep(2000);
console.log('Taking t=2s screenshot...');
await captureCropped('phase2_live_f2.png');

console.log('Waiting 2 seconds...');
await sleep(2000);
console.log('Taking t=4s screenshot...');
await captureCropped('phase2_live_f3.png');

ws.close();
chromeProcess.kill();
console.log('All done!');
