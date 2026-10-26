import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = 'C:/Users/Tomyp/.gemini/antigravity/brain/863dbce5-1730-4fcc-83dc-6561cdd72ad6';
const tmpProfile = 'C:/Users/Tomyp/AppData/Local/Temp/chrome_perf_' + Date.now();

try {
  execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' });
} catch (_) {}

async function runProfileAndCaptures() {
  console.log('[DevTools Perf] Launching Chrome with GPU acceleration...');
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--no-sandbox',
    '--enable-gpu-rasterization',
    '--enable-zero-copy',
    `--user-data-dir=${tmpProfile}`,
    '--disk-cache-size=1',
    'http://127.0.0.1:5173/works?debug=1'
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

  // Emulate high-DPI desktop display: deviceScaleFactor = 2.0 to test clamping to 1.5
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 1050,
    deviceScaleFactor: 2.0,
    mobile: false
  });

  console.log('[DevTools Perf] Waiting 2 seconds for warm up...');
  await new Promise(r => setTimeout(r, 2000));

  // 1. Measure Canvas and DPR in page
  const pageMetrics = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const canvas = document.querySelector('canvas');
        const perf = window.__PLANET_HERO_PERF__ || {};
        return {
          windowDpr: window.devicePixelRatio,
          clampedDpr: perf.dpr,
          canvasClientWidth: canvas ? canvas.clientWidth : 0,
          canvasClientHeight: canvas ? canvas.clientHeight : 0,
          canvasBufferWidth: canvas ? canvas.width : 0,
          canvasBufferHeight: canvas ? canvas.height : 0,
          fps: perf.fps,
          cpuMs: perf.cpuMs,
          drawMs: perf.drawMs,
          domMs: perf.domMs,
          renderer: perf.renderer,
          uCursorActive: perf.uCursorActive,
          motionState: perf.motionState
        };
      })()
    `,
    returnByValue: true
  });
  console.log('[DevTools Page Metrics]:', JSON.stringify(pageMetrics.result.value, null, 2));

  // 2. Start DevTools Tracing for 5 seconds
  console.log('[DevTools Perf] Starting 5-second Tracing profile (Rendering, Painting, Composite Layers)...');
  await send('Tracing.start', {
    traceConfig: {
      includedCategories: [
        'devtools.timeline',
        'v8.execute',
        'disabled-by-default-devtools.timeline',
        'blink.user_timing'
      ]
    }
  });

  const traceEvents = [];
  const traceListener = (msg) => {
    const data = JSON.parse(msg.data);
    if (data.method === 'Tracing.dataCollected' && data.params && data.params.value) {
      traceEvents.push(...data.params.value);
    }
  };
  ws.addEventListener('message', traceListener);

  await new Promise(r => setTimeout(r, 5000));

  console.log('[DevTools Perf] Stopping Tracing profile...');
  await new Promise((resolve) => {
    const completeListener = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.method === 'Tracing.tracingComplete') {
        ws.removeEventListener('message', completeListener);
        resolve();
      }
    };
    ws.addEventListener('message', completeListener);
    send('Tracing.end');
  });

  // Analyze trace events
  let scriptingDurUs = 0;
  let renderingDurUs = 0;
  let paintingDurUs = 0;
  let compositeDurUs = 0;

  for (const evt of traceEvents) {
    const name = evt.name;
    const dur = evt.dur || 0;

    if (name === 'FunctionCall' || name === 'EvaluateScript' || name === 'v8.compile' || name === 'TimerFire') {
      scriptingDurUs += dur;
    } else if (name === 'Layout' || name === 'UpdateLayoutTree' || name === 'RecalculateStyles') {
      renderingDurUs += dur;
    } else if (name === 'Paint' || name === 'RasterTask' || name === 'UpdateLayers') {
      paintingDurUs += dur;
    } else if (name === 'CompositeLayers' || name === 'Commit') {
      compositeDurUs += dur;
    }
  }

  const perfReport = {
    durationMs: 5000,
    metrics: pageMetrics.result.value,
    traceAggregationMs: {
      scriptingMs: (scriptingDurUs / 1000).toFixed(2),
      renderingMs: (renderingDurUs / 1000).toFixed(2),
      paintingMs: (paintingDurUs / 1000).toFixed(2),
      compositeLayersMs: (compositeDurUs / 1000).toFixed(2),
      totalTrackedWorkMs: ((scriptingDurUs + renderingDurUs + paintingDurUs + compositeDurUs) / 1000).toFixed(2)
    }
  };

  fs.writeFileSync(path.join(outDir, 'devtools_performance_report.json'), JSON.stringify(perfReport, null, 2));
  console.log('[DevTools Report Saved]:', JSON.stringify(perfReport, null, 2));

  // 3. Capture Screen with cursor quieto (outside magnet: e.g. at 100, 100)
  console.log('[Capture] Capturing evidence_fps_quieto_10warp.png...');
  await send('Page.navigate', { url: 'http://127.0.0.1:5173/works?debug=1' });
  await new Promise(r => setTimeout(r, 2000));
  
  // Hover at (100, 100) outside magnet
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 100, y: 100 });
  await new Promise(r => setTimeout(r, 800));

  const shotQuieto = await send('Page.captureScreenshot', {
    format: 'png',
    clip: { x: 0, y: 0, width: 1440, height: 1050, scale: 1 }
  });
  fs.writeFileSync(path.join(outDir, 'evidence_fps_quieto_10warp.png'), Buffer.from(shotQuieto.data, 'base64'));
  console.log('[Success] Saved evidence_fps_quieto_10warp.png');

  // 4. Capture Screen with cursor moving (active wave)
  console.log('[Capture] Capturing evidence_fps_movimiento_10warp.png...');
  await send('Page.navigate', { url: 'http://127.0.0.1:5173/works?debug=1&wave=1' });
  await new Promise(r => setTimeout(r, 2000));

  const shotMov = await send('Page.captureScreenshot', {
    format: 'png',
    clip: { x: 0, y: 0, width: 1440, height: 1050, scale: 1 }
  });
  fs.writeFileSync(path.join(outDir, 'evidence_fps_movimiento_10warp.png'), Buffer.from(shotMov.data, 'base64'));
  console.log('[Success] Saved evidence_fps_movimiento_10warp.png');

  // 5. Capture Screen with cursor in magnet (quieto sobre continente para verificar planeta 100% visible)
  console.log('[Capture] Capturing evidence_iman_quieto_10warp.png...');
  await send('Page.navigate', { url: 'http://127.0.0.1:5173/works?debug=1&state=magnet&cursor=0,0' });
  await new Promise(r => setTimeout(r, 2000));

  const shotMagnet = await send('Page.captureScreenshot', {
    format: 'png',
    clip: { x: 0, y: 0, width: 1440, height: 1050, scale: 1 }
  });
  fs.writeFileSync(path.join(outDir, 'evidence_iman_quieto_10warp.png'), Buffer.from(shotMagnet.data, 'base64'));
  console.log('[Success] Saved evidence_iman_quieto_10warp.png');

  try { execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' }); } catch (_) {}
}

runProfileAndCaptures().catch(err => {
  console.error('Fatal error:', err);
  try { execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' }); } catch (_) {}
});
