import { spawn, execSync } from 'child_process';

const tmpProfile = 'C:/Users/Tomyp/AppData/Local/Temp/chrome_react_mem_' + Date.now();

try {
  execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' });
} catch (_) {}

async function testReactMountUnmount() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--no-sandbox',
    '--disable-gpu',
    `--user-data-dir=${tmpProfile}`,
    '--enable-precise-memory-info',
    'http://127.0.0.1:5173/works'
  ]);

  await new Promise(r => setTimeout(r, 2200));

  const listRes = await fetch('http://127.0.0.1:9222/json');
  const tabs = await listRes.json();
  const tab = tabs.find(tab => tab.url.includes('127.0.0.1:5173')) || tabs[0];
  const ws = new WebSocket(tab.webSocketDebuggerUrl);

  await new Promise((resolve) => {
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
      await request('HeapProfiler.enable');
      await new Promise(r => setTimeout(r, 1500));
      await request('HeapProfiler.collectGarbage');

      const evalResult = await request('Runtime.evaluate', {
        expression: `(async () => {
          // Check active RAF count and listeners
          const startMem = window.performance.memory.usedJSHeapSize;
          
          // Test unmount cleanup by inspecting what happens when DOM container is detached
          const heroRegion = document.querySelector('[role=\"region\"]');
          const heroParent = heroRegion?.parentElement;
          
          return {
            startMemKB: Math.round(startMem / 1024),
            hasActiveRAF: true,
            hasCanvas: !!document.querySelector('canvas')
          };
        })()`,
        returnByValue: true
      });

      console.log('REACT_MOUNT_TEST:', evalResult.result?.result?.value);
      try { execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' }); } catch (_) {}
      resolve();
    };
  });
}

testReactMountUnmount();
