import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = 'C:/Users/Tomyp/.gemini/antigravity/brain/863dbce5-1730-4fcc-83dc-6561cdd72ad6';
const tmpProfile = 'C:/Users/Tomyp/AppData/Local/Temp/chrome_mob_' + Date.now();

try {
  execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' });
} catch (_) {}

async function testMobileViewport(width, height, label) {
  console.log(`\n[Mobile Test] Testing ${label} (${width}x${height})...`);
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--no-sandbox',
    '--enable-gpu-rasterization',
    `--user-data-dir=${tmpProfile}`,
    '--disk-cache-size=1',
    'http://127.0.0.1:5173/works'
  ]);

  await new Promise(r => setTimeout(r, 2200));

  const listRes = await fetch('http://127.0.0.1:9222/json');
  const tabs = await listRes.json();
  const tab = tabs.find(t => t.url.includes('127.0.0.1:5173')) || tabs[0];
  const ws = new WebSocket(tab.webSocketDebuggerUrl);

  let reqId = 1;
  const send = (method, params = {}) => {
    return new Promise((resolve) => {
      const id = reqId++;
      const handler = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.id === id) {
          ws.removeEventListener('message', handler);
          resolve(data.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  };

  await new Promise((res) => { ws.onopen = res; });

  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 2.0,
    mobile: true
  });

  await new Promise(r => setTimeout(r, 1500));

  // Sample scroll width and Editorial Design position over 3 seconds of animation
  const samples = [];
  for (let s = 0; s < 10; s++) {
    const metrics = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const docEl = document.documentElement;
          const body = document.body;
          const labels = Array.from(document.querySelectorAll('span, div')).filter(el => el.textContent === 'Editorial Design');
          const edEl = labels[0];
          const edRect = edEl ? edEl.getBoundingClientRect() : null;

          return {
            clientWidth: docEl.clientWidth,
            scrollWidth: docEl.scrollWidth,
            bodyScrollWidth: body.scrollWidth,
            hasHorizontalScroll: docEl.scrollWidth > docEl.clientWidth || body.scrollWidth > docEl.clientWidth,
            edRect: edRect ? {
              left: Math.round(edRect.left),
              right: Math.round(edRect.right),
              width: Math.round(edRect.width),
              inViewport: edRect.left >= 0 && edRect.right <= docEl.clientWidth
            } : null
          };
        })()
      `,
      returnByValue: true
    });
    samples.push(metrics.result.value);
    await new Promise(r => setTimeout(r, 300));
  }

  // Take screenshot
  const shot = await send('Page.captureScreenshot', {
    format: 'png',
    clip: { x: 0, y: 0, width, height, scale: 1 }
  });
  fs.writeFileSync(path.join(outDir, `evidence_mobile_${width}.png`), Buffer.from(shot.data, 'base64'));
  console.log(`Saved evidence_mobile_${width}.png`);

  try { execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' }); } catch (_) {}

  const anyHScroll = samples.some(s => s.hasHorizontalScroll);
  const minLeft = Math.min(...samples.map(s => s.edRect ? s.edRect.left : 0));
  const maxRight = Math.max(...samples.map(s => s.edRect ? s.edRect.right : width));

  return {
    width,
    height,
    hasHorizontalScroll: anyHScroll,
    editorialDesignBounds: { minLeft, maxRight, viewportWidth: width },
    sample: samples[0]
  };
}

async function run() {
  const res390 = await testMobileViewport(390, 844, 'Mobile 390px');
  console.log('Result 390px:', JSON.stringify(res390, null, 2));

  const res360 = await testMobileViewport(360, 780, 'Mobile 360px');
  console.log('Result 360px:', JSON.stringify(res360, null, 2));
}

run().catch(err => {
  console.error('Mobile test failed:', err);
  try { execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' }); } catch (_) {}
});
