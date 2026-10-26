import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/Tomyp/.gemini/antigravity/brain/863dbce5-1730-4fcc-83dc-6561cdd72ad6';
const tmpProfile = 'C:/Users/Tomyp/AppData/Local/Temp/chrome_fase1_test_' + Date.now();

try {
  execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' });
} catch (_) {}

async function run() {
  console.log('Launching Chrome for 1440px screenshots...');
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--no-sandbox',
    '--window-size=1440,1100',
    `--user-data-dir=${tmpProfile}`,
    'http://127.0.0.1:5173/works'
  ]);

  await new Promise(r => setTimeout(r, 2500));

  const listRes = await fetch('http://127.0.0.1:9222/json');
  const tabs = await listRes.json();
  const tab = tabs.find(t => t.url.includes('127.0.0.1:5173')) || tabs[0];
  const ws = new WebSocket(tab.webSocketDebuggerUrl);

  let reqId = 1;
  const send = (method, params = {}) => {
    return new Promise((resolve, reject) => {
      const id = reqId++;
      const handler = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.id === id) {
          ws.removeEventListener('message', handler);
          if (data.error) reject(data.error);
          else resolve(data.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  };

  await new Promise((res) => { ws.onopen = res; });

  await send('Runtime.enable');
  await send('Page.enable');
  await send('DOM.enable');

  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 1100,
    deviceScaleFactor: 1,
    mobile: false
  });

  // Wait for initial render
  await new Promise(r => setTimeout(r, 3000));

  // 1. CAPTURE FULL REPOSO
  console.log('Capturing full page in repose at 1440px...');
  const captureReposo = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true
  });
  const reposoPath = path.join(ARTIFACT_DIR, 'fase1_fixed_page_reposo_1440px.png');
  fs.writeFileSync(reposoPath, Buffer.from(captureReposo.data, 'base64'));
  console.log(`Saved reposo: ${reposoPath} (${fs.statSync(reposoPath).size} bytes)`);

  // 2. Scroll to folders section so coordinates align
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const sec = document.getElementById('selected-projects');
        if (sec) {
          const rect = sec.getBoundingClientRect();
          window.scrollBy({ top: rect.top - 140, behavior: 'instant' });
        }
      })()
    `
  });

  await new Promise(r => setTimeout(r, 400));

  // Find exact Folder 001 tab:
  const folder001Tab = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const folder0 = document.querySelector('#selected-projects [aria-label*="001"]');
        if (!folder0) return null;
        // Find tab element inside folder 0
        const tabEl = folder0.querySelector('.font-mono');
        if (tabEl) {
          const rect = tabEl.getBoundingClientRect();
          return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
          };
        }
        const rect = folder0.getBoundingClientRect();
        return { x: rect.left + 80, y: rect.top + 20, rect };
      })()
    `,
    returnByValue: true
  });

  console.log('Folder 001 tab target:', folder001Tab?.result?.value);

  if (folder001Tab?.result?.value) {
    const { x, y } = folder001Tab.result.value;

    console.log(`Moving mouse to Folder 001 tab at (${x}, ${y})...`);
    await send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x,
      y
    });

    // Wait for hover state transition (380ms)
    await new Promise(r => setTimeout(r, 700));

    // Verify hover state in DOM
    const stateCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const folder0 = document.querySelector('#selected-projects [aria-label*="001"]');
          const folder1 = document.querySelector('#selected-projects [aria-label*="002"]');
          const card0 = folder0 ? folder0.querySelectorAll('div')[2] : null;
          return {
            folder0Transform: folder0 ? folder0.style.transform : null,
            folder0ZIndex: folder0 ? folder0.style.zIndex : null,
            folder1Transform: folder1 ? folder1.style.transform : null,
            folder1ZIndex: folder1 ? folder1.style.zIndex : null,
          };
        })()
      `,
      returnByValue: true
    });
    console.log('DOM State Check:', stateCheck?.result?.value);

    // Capture FULL PAGE screenshot WITH HOVER ACTIVE (WITHOUT resetting scroll!)
    console.log('Capturing full page with hover active at 1440px...');
    const captureHoverFull = await send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true
    });
    const hoverPath = path.join(ARTIFACT_DIR, 'fase1_fixed_page_hover_1440px.png');
    fs.writeFileSync(hoverPath, Buffer.from(captureHoverFull.data, 'base64'));
    console.log(`Saved hover full page: ${hoverPath} (${fs.statSync(hoverPath).size} bytes)`);

    // Also capture zoomed viewport view centered on Selected Projects
    const captureViewport = await send('Page.captureScreenshot', {
      format: 'png'
    });
    const viewportPath = path.join(ARTIFACT_DIR, 'fase1_folder_001_hover_detail_1440px.png');
    fs.writeFileSync(viewportPath, Buffer.from(captureViewport.data, 'base64'));
    console.log(`Saved viewport zoom: ${viewportPath}`);
  }

  ws.close();
  try {
    execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' });
  } catch (_) {}
  console.log('Done!');
}

run().catch(err => {
  console.error('Error running test script:', err);
  try {
    execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' });
  } catch (_) {}
  process.exit(1);
});
