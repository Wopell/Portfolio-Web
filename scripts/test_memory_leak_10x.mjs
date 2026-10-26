import { spawn, execSync } from 'child_process';

const tmpProfile = 'C:/Users/Tomyp/AppData/Local/Temp/chrome_mem_' + Date.now();

try {
  execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' });
} catch (_) {}

async function testMemory() {
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
      
      // Navigate to /works (mount 1)
      await request('Page.navigate', { url: 'http://127.0.0.1:5173/works' });
      await new Promise(r => setTimeout(r, 1500));
      await request('HeapProfiler.collectGarbage');
      
      const mem1 = await request('Runtime.evaluate', {
        expression: 'window.performance.memory.usedJSHeapSize',
        returnByValue: true
      });
      const startHeap = mem1.result?.result?.value;

      // Navigate back and forth between /works and / 10 times
      for (let i = 0; i < 10; i++) {
        await request('Page.navigate', { url: 'http://127.0.0.1:5173/' });
        await new Promise(r => setTimeout(r, 150));
        await request('Page.navigate', { url: 'http://127.0.0.1:5173/works' });
        await new Promise(r => setTimeout(r, 200));
      }

      await request('HeapProfiler.collectGarbage');
      await new Promise(r => setTimeout(r, 500));

      const mem2 = await request('Runtime.evaluate', {
        expression: 'window.performance.memory.usedJSHeapSize',
        returnByValue: true
      });
      const endHeap = mem2.result?.result?.value;

      console.log('HEAP_TEST_RESULT:', {
        startHeapKB: Math.round(startHeap / 1024),
        endHeapKB: Math.round(endHeap / 1024),
        deltaKB: Math.round((endHeap - startHeap) / 1024)
      });

      try { execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' }); } catch (_) {}
      resolve();
    };
  });
}

testMemory();
