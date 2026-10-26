import { spawn, execSync } from 'child_process';

async function checkAngle(renderer) {
  try { execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' }); } catch (_) {}
  await new Promise(r => setTimeout(r, 600));
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--no-sandbox',
    '--disable-gpu',
    'http://127.0.0.1:5173/works?renderer=' + renderer + '&freeze=1&time=0'
  ]);
  await new Promise(r => setTimeout(r, 2000));
  const listRes = await fetch('http://127.0.0.1:9222/json');
  const tabs = await listRes.json();
  const tab = tabs.find(t => t.url.includes('127.0.0.1:5173')) || tabs[0];
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  return new Promise((resolve) => {
    ws.onopen = () => {
      ws.send(JSON.stringify({ id: 1, method: 'Emulation.setDeviceMetricsOverride', params: { width: 1440, height: 1050, deviceScaleFactor: 1, mobile: false } }));
      setTimeout(() => {
        ws.send(JSON.stringify({ id: 2, method: 'Runtime.evaluate', params: { expression: 'JSON.stringify(window.__PLANET_HERO_PERF__)' } }));
      }, 1000);
    };
    ws.onmessage = (msg) => {
      const d = JSON.parse(msg.data);
      if (d.result?.result?.value) {
        console.log(renderer, d.result.result.value);
        try { execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' }); } catch (_) {}
        resolve();
      }
    };
  });
}

await checkAngle('2d');
await checkAngle('webgl');
