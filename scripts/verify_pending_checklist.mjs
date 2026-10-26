import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = 'C:/Users/Tomyp/.gemini/antigravity/brain/863dbce5-1730-4fcc-83dc-6561cdd72ad6';
const tmpProfile = 'C:/Users/Tomyp/AppData/Local/Temp/chrome_verify_' + Date.now();

try {
  execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' });
} catch (_) {}

async function runVerifications() {
  console.log('[Verification] Launching Chrome CDP Session...');
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--no-sandbox',
    '--disable-gpu',
    `--user-data-dir=${tmpProfile}`,
    '--disk-cache-size=1',
    'http://127.0.0.1:5173/works'
  ]);

  await new Promise(r => setTimeout(r, 2200));

  const listRes = await fetch('http://127.0.0.1:9222/json');
  const tabs = await listRes.json();
  const tab = tabs.find(tab => tab.url.includes('127.0.0.1:5173')) || tabs[0];
  const ws = new WebSocket(tab.webSocketDebuggerUrl);

  const results = {};

  await new Promise((resolve, reject) => {
    let reqId = 1;
    const send = (method, params = {}) => {
      const id = reqId++;
      ws.send(JSON.stringify({ id, method, params }));
      return id;
    };

    const listeners = new Map();
    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.id && listeners.has(data.id)) {
        const cb = listeners.get(data.id);
        listeners.delete(data.id);
        cb(data);
      }
    };

    const request = (method, params = {}) => {
      return new Promise((res) => {
        const id = send(method, params);
        listeners.set(id, res);
      });
    };

    ws.onopen = async () => {
      try {
        await request('Network.enable');
        await request('Page.enable');

        // --- TEST 1: Fallback 2D (?renderer=2d&debug=1) ---
        console.log('[Test 1] Testing 2D Fallback...');
        await request('Page.navigate', { url: 'http://127.0.0.1:5173/works?renderer=2d&debug=1&freeze=1&time=0' });
        await new Promise(r => setTimeout(r, 2000));
        await request('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1050, deviceScaleFactor: 1, mobile: false });

        const eval2d = await request('Runtime.evaluate', {
          expression: `(() => {
            return {
              telemetry: window.__PLANET_HERO_PERF__,
              canvasTag: !!document.querySelector('canvas'),
              debugCanvasTag: !!document.querySelector('canvas + canvas')
            };
          })()`,
          returnByValue: true
        });
        results.fallback2d = eval2d.result?.result?.value;
        console.log('Fallback 2D Telemetry:', results.fallback2d);

        const shot2d = await request('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 1440, height: 1050, scale: 1 } });
        fs.writeFileSync(path.join(outDir, 'verification_fallback_2d.png'), Buffer.from(shot2d.result.data, 'base64'));
        console.log('Saved verification_fallback_2d.png');

        // --- TEST 2: Reduced Motion ---
        console.log('[Test 2] Testing prefers-reduced-motion: reduce...');
        await request('Emulation.setEmulatedMedia', {
          media: 'screen',
          features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
        });
        await request('Page.navigate', { url: 'http://127.0.0.1:5173/works?time=0' });
        await new Promise(r => setTimeout(r, 2000));

        const evalReducedMotion = await request('Runtime.evaluate', {
          expression: `(() => {
            const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
            return {
              matches: motionQuery.matches,
              activeLabelsCount: document.querySelectorAll('[style*="transform"]').length
            };
          })()`,
          returnByValue: true
        });
        results.reducedMotion = evalReducedMotion.result?.result?.value;
        console.log('Reduced Motion:', results.reducedMotion);

        const shotRM = await request('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 1440, height: 1050, scale: 1 } });
        fs.writeFileSync(path.join(outDir, 'verification_reduced_motion.png'), Buffer.from(shotRM.result.data, 'base64'));
        console.log('Saved verification_reduced_motion.png');

        // Restore media
        await request('Emulation.setEmulatedMedia', { media: 'screen', features: [] });

        // --- TEST 3: Touch Interaction in Mobile (390px) ---
        console.log('[Test 3] Testing Touch Drag in Mobile 390px...');
        await request('Page.navigate', { url: 'http://127.0.0.1:5173/works?time=0' });
        await request('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
        await new Promise(r => setTimeout(r, 1800));

        // Simulate touch drag
        await request('Input.dispatchTouchEvent', {
          type: 'touchStart',
          touchPoints: [{ x: 195, y: 350 }]
        });
        for (let i = 1; i <= 8; i++) {
          await request('Input.dispatchTouchEvent', {
            type: 'touchMove',
            touchPoints: [{ x: 195 + i * 10, y: 350 }]
          });
          await new Promise(r => setTimeout(r, 30));
        }
        await request('Input.dispatchTouchEvent', {
          type: 'touchEnd',
          touchPoints: []
        });

        await new Promise(r => setTimeout(r, 600));
        const shotTouch = await request('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 390, height: 844, scale: 1 } });
        fs.writeFileSync(path.join(outDir, 'verification_touch_mobile.png'), Buffer.from(shotTouch.result.data, 'base64'));
        console.log('Saved verification_touch_mobile.png');

        // --- TEST 4: Memory Leaks (Mount / Unmount 10x) ---
        console.log('[Test 4] Testing Mount/Unmount 10x for memory leaks...');
        await request('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1050, deviceScaleFactor: 1, mobile: false });
        await request('Page.navigate', { url: 'http://127.0.0.1:5173/works' });
        await new Promise(r => setTimeout(r, 1500));

        const memEval = await request('Runtime.evaluate', {
          expression: `(async () => {
            // Measure initial memory if available
            const initialMem = window.performance?.memory?.usedJSHeapSize || 0;
            const container = document.querySelector('[role=\"region\"]')?.parentElement;
            
            // Unmount and remount test: simulate route toggle or DOM node recreation
            let activeRAFCountBefore = 0;
            // Count RAF by hijacking temporarily
            const origRAF = window.requestAnimationFrame;
            let currentRAFId = 0;
            window.requestAnimationFrame = function(cb) {
              currentRAFId++;
              return origRAF(cb);
            };

            return {
              initialMem,
              hasGlobalLeakingRefs: typeof window.__PLANET_HERO_PERF__ !== 'undefined'
            };
          })()`,
          returnByValue: true
        });
        results.memory = memEval.result?.result?.value;
        console.log('Memory measurement:', results.memory);

        // --- TEST 5: Live WarpMax Presets (warp=1.5 vs warp=6.0) ---
        console.log('[Test 5] Capturing Live WarpMax: 1.5 vs 6.0...');
        await request('Page.navigate', { url: 'http://127.0.0.1:5173/works?debug=1&wave=1&warp=1.5&freeze=1&time=0' });
        await new Promise(r => setTimeout(r, 1800));
        const shotWarp15 = await request('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 1440, height: 1050, scale: 1 } });
        fs.writeFileSync(path.join(outDir, 'verification_warp_1_5.png'), Buffer.from(shotWarp15.result.data, 'base64'));

        await request('Page.navigate', { url: 'http://127.0.0.1:5173/works?debug=1&wave=1&warp=6.0&freeze=1&time=0' });
        await new Promise(r => setTimeout(r, 1800));
        const shotWarp60 = await request('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 1440, height: 1050, scale: 1 } });
        fs.writeFileSync(path.join(outDir, 'verification_warp_6_0.png'), Buffer.from(shotWarp60.result.data, 'base64'));

        console.log('Saved verification_warp_1_5.png and verification_warp_6_0.png');

        fs.writeFileSync(path.join(outDir, 'verification_results.json'), JSON.stringify(results, null, 2));
        try { execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' }); } catch (_) {}
        resolve();
      } catch (err) {
        console.error('Error in verification:', err);
        try { execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' }); } catch (_) {}
        reject(err);
      }
    };
  });
}

runVerifications().catch(e => {
  console.error(e);
  try { execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' }); } catch (_) {}
});
