import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/Tomyp/.gemini/antigravity/brain/863dbce5-1730-4fcc-83dc-6561cdd72ad6';
const tmpProfile = 'C:/Users/Tomyp/AppData/Local/Temp/chrome_fase1_' + Date.now();

try {
  execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' });
} catch (_) {}

async function run() {
  console.log('Launching Chrome for 1440px screenshots...');
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--no-sandbox',
    '--window-size=1440,1000',
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

  const consoleLogs = [];
  ws.addEventListener('message', (msg) => {
    const data = JSON.parse(msg.data);
    if (data.method === 'Runtime.consoleAPICalled') {
      consoleLogs.push({ type: data.params.type, text: data.params.args.map(a => a.value).join(' ') });
    }
    if (data.method === 'Runtime.exceptionThrown') {
      consoleLogs.push({
        type: 'EXCEPTION',
        text: data.params.exceptionDetails.exception?.description || data.params.exceptionDetails.text
      });
    }
  });

  await send('Runtime.enable');
  await send('Page.enable');
  await send('DOM.enable');

  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false
  });

  // Wait for React, PlanetHero canvas, and images to settle
  await new Promise(r => setTimeout(r, 3500));

  const domStatus = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const root = document.getElementById('root');
        const folders = document.getElementById('selected-projects');
        const planet = document.querySelector('canvas');
        const marquee = document.querySelector('.animate-marquee-slow');
        return {
          rootChildren: root ? root.children.length : 0,
          rootNotEmpty: root && root.innerHTML.length > 50,
          foldersPresent: !!folders,
          canvasPresent: !!planet,
          marqueePresent: !!marquee,
          bodyScrollHeight: document.body.scrollHeight,
          pageTitle: document.title
        };
      })()
    `,
    returnByValue: true
  });

  console.log('DOM Diagnostic Status:', domStatus?.result?.value);
  console.log('Console Logs during load:', consoleLogs);

  // 1. Capture FULL SCREENSHOT in repose
  console.log('Capturing full page in repose at 1440px...');
  const captureReposo = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true
  });
  const reposoPath = path.join(ARTIFACT_DIR, 'fase1_fixed_page_reposo_1440px.png');
  fs.writeFileSync(reposoPath, Buffer.from(captureReposo.data, 'base64'));
  console.log(`Saved: ${reposoPath} (${fs.statSync(reposoPath).size} bytes)`);

  // 2. Locate folder 001 tab or hit-box to trigger hover
  const folder001Info = await send('Runtime.evaluate', {
    expression: `
      (() => {
        // Find tab containing 001
        const tabs = Array.from(document.querySelectorAll('#selected-projects button, #selected-projects div, #selected-projects span'));
        const tab001 = tabs.find(el => el.textContent && el.textContent.includes('001') && el.textContent.includes('ANIMATION'));
        if (tab001) {
          const rect = tab001.getBoundingClientRect();
          return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            width: rect.width,
            height: rect.height,
            text: tab001.textContent.trim().slice(0, 30)
          };
        }
        return null;
      })()
    `,
    returnByValue: true
  });

  console.log('Folder 001 target info:', folder001Info?.result?.value);

  if (folder001Info?.result?.value) {
    const { x, y } = folder001Info.result.value;

    // Scroll folder into view first if necessary so pointer event matches viewport coordinates
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const sec = document.getElementById('selected-projects');
          if (sec) sec.scrollIntoView({ behavior: 'instant', block: 'center' });
        })()
      `
    });

    await new Promise(r => setTimeout(r, 300));

    // Recompute viewport coordinates after scroll
    const recomputedCoords = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const tabs = Array.from(document.querySelectorAll('#selected-projects *'));
          const tab001 = tabs.find(el => el.textContent && el.textContent.includes('001') && el.textContent.includes('ANIMATION') && el.clientWidth > 40);
          if (tab001) {
            const rect = tab001.getBoundingClientRect();
            return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
          }
          return null;
        })()
      `,
      returnByValue: true
    });

    const targetX = recomputedCoords?.result?.value?.x ?? x;
    const targetY = recomputedCoords?.result?.value?.y ?? y;
    console.log(`Dispatching mouseMoved to (${targetX}, ${targetY})...`);

    await send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: targetX,
      y: targetY
    });

    // Wait for hover intent delay (80ms) + 3D lift animation transition (350ms)
    await new Promise(r => setTimeout(r, 700));

    // Scroll back to top for full page screenshot in hover state
    await send('Runtime.evaluate', {
      expression: `window.scrollTo({ top: 0, behavior: 'instant' });`
    });
    await new Promise(r => setTimeout(r, 200));

    // Capture FULL SCREENSHOT in hover
    console.log('Capturing full page in hover over folder 001 at 1440px...');
    const captureHover = await send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true
    });
    const hoverPath = path.join(ARTIFACT_DIR, 'fase1_fixed_page_hover_1440px.png');
    fs.writeFileSync(hoverPath, Buffer.from(captureHover.data, 'base64'));
    console.log(`Saved: ${hoverPath} (${fs.statSync(hoverPath).size} bytes)`);

    // Also capture zoomed view of the folder deck in hover
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const sec = document.getElementById('selected-projects');
          if (sec) sec.scrollIntoView({ behavior: 'instant', block: 'center' });
        })()
      `
    });
    await new Promise(r => setTimeout(r, 300));

    // Re-dispatch hover after scroll
    const recomputedCoords2 = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const tabs = Array.from(document.querySelectorAll('#selected-projects *'));
          const tab001 = tabs.find(el => el.textContent && el.textContent.includes('001') && el.textContent.includes('ANIMATION') && el.clientWidth > 40);
          if (tab001) {
            const rect = tab001.getBoundingClientRect();
            return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
          }
          return null;
        })()
      `,
      returnByValue: true
    });
    if (recomputedCoords2?.result?.value) {
      await send('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x: recomputedCoords2.result.value.x,
        y: recomputedCoords2.result.value.y
      });
      await new Promise(r => setTimeout(r, 500));
    }

    const folderZoom = await send('Page.captureScreenshot', {
      format: 'png'
    });
    const zoomPath = path.join(ARTIFACT_DIR, 'fase1_folder_001_hover_detail_1440px.png');
    fs.writeFileSync(zoomPath, Buffer.from(folderZoom.data, 'base64'));
    console.log(`Saved zoom: ${zoomPath}`);
  }

  ws.close();
  try {
    execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' });
  } catch (_) {}
  console.log('Capture completed successfully!');
}

run().catch(err => {
  console.error('Error running capture script:', err);
  try {
    execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' });
  } catch (_) {}
  process.exit(1);
});
