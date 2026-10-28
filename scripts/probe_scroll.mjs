#!/usr/bin/env node
/* quick CDP probe: does scrolling work, do the sections exist? */
import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import path from 'node:path';
import { mkdirSync } from 'node:fs';

const CHROME_PATH = process.env.CHROME_PATH || '';
const port = 9433;
const userData = path.join(tmpdir(), `cdp-probe-${Date.now()}`);
mkdirSync(userData, { recursive: true });

const proc = spawn(CHROME_PATH, [
  `--remote-debugging-port=${port}`,
  '--remote-allow-origins=*',
  '--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
  `--user-data-dir=${userData}`,
  '--window-size=1920,1080',
  'about:blank',
], { stdio: ['ignore', 'pipe', 'pipe'] });

let wsEndpoint = null;
proc.stderr.on('data', (d) => {
  const m = String(d).match(/ws:\/\/[^\s]+/);
  if (m && !wsEndpoint) wsEndpoint = m[0];
});
while (!wsEndpoint) await new Promise((r) => setTimeout(r, 100));

const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
const page = targets.find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));

let id = 0;
const pending = new Map();
const onceFns = new Map();
ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg.result);
    pending.delete(msg.id);
  } else if (msg.method && onceFns.has(msg.method)) {
    onceFns.get(msg.method)(msg.params);
  }
});
const send = (method, params = {}) => new Promise((res) => {
  const i = ++id;
  pending.set(i, res);
  ws.send(JSON.stringify({ id: i, method, params }));
});
const once = (m, fn) => onceFns.set(m, fn);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await send('Page.enable');
const loaded = new Promise((r) => once('Page.loadEventFired', r));
await send('Page.navigate', { url: 'http://127.0.0.1:5173/works' });
await Promise.race([loaded, sleep(15000)]);
await sleep(2000);

const ev = async (expr) => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.value;

console.log('sections:', await ev(`['planet','work-together','selected-projects','brands'].map(s => { const el = document.querySelector('[data-section=' + s + ']'); return el ? s + '@' + Math.round(el.getBoundingClientRect().top + window.scrollY) : s + ':MISSING'; }).join(' ')`));
console.log('scrollY:', await ev('window.scrollY'));
console.log('scroll to folders:', await ev(`(() => { const el = document.querySelector('[data-section=selected-projects]'); if (!el) return 'MISSING'; const y = el.getBoundingClientRect().top + window.scrollY - 90; window.scrollTo({top: y, behavior:'instant'}); return 'target=' + Math.round(y) + ' scrollY=' + Math.round(window.scrollY); })()`));
await sleep(1000);
console.log('after 1s, scrollY:', await ev('window.scrollY'));
await sleep(1500);
console.log('after 2.5s, scrollY:', await ev('window.scrollY'));
console.log('scrollY final check + folder rows:', await ev(`(() => { const rows=[...document.querySelectorAll('[data-folder-row]')]; return 'rows=' + rows.length + ' scrollY=' + Math.round(window.scrollY) + ' deckH=' + (document.querySelector('#selected-projects')?.offsetHeight ?? -1); })()`));
console.log('doc height:', await ev('document.documentElement.scrollHeight'));
console.log('any scroll listeners (lenis etc):', await ev(`!!window.Lenis || !!document.documentElement.style.scrollBehavior`));
console.log('body overflow:', await ev('getComputedStyle(document.body).overflow'));
ws.close();
proc.kill('SIGKILL');
process.exit(0);
