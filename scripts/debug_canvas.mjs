import { spawn } from 'child_process';

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--window-size=1440,1050',
  'http://127.0.0.1:5173/works?renderer=webgl&freeze=1&time=0'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9222/json');
    const tabs = await listRes.json();
    const tab = tabs.find(t => t.url.includes('127.0.0.1:5173')) || tabs[0];
    const wsUrl = tab.webSocketDebuggerUrl;
    
    const ws = new WebSocket(wsUrl);
    ws.onopen = () => {
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
      ws.send(JSON.stringify({
        id: 2,
        method: 'Runtime.evaluate',
        params: {
          expression: `(() => {
            const canvas = document.querySelector('canvas');
            const gl = canvas.getContext('webgl2');
            const pixels = new Uint8Array(4 * 100);
            gl.readPixels(430, 370, 10, 10, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
            return JSON.stringify({
              centerPixels: Array.from(pixels.slice(0, 40))
            });
          })()`,
          returnByValue: true
        }
      }));
    };
    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.id === 2) {
        console.log('Result:', data.result.result.value);
        chrome.kill();
        process.exit(0);
      }
    };
  } catch (e) {
    console.error(e);
    chrome.kill();
  }
}, 1500);
