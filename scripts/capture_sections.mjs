#!/usr/bin/env node
/**
 * capture_sections.mjs — CDP screenshot pipeline for visual QA (Linux, no extra deps).
 *
 * Spawns chrome-headless-shell, drives it over raw CDP (global WebSocket), and saves
 * viewport screenshots for each shot descriptor passed on the CLI.
 *
 * Usage:
 *   node scripts/capture_sections.mjs [--out DIR] [--url URL] [--width N] [--height N]
 *        [--dsf N] [--mobile] [--shot "name:step;step;..."]
 *
 * Steps:  scroll=<selector|y>  |  click=<selector>  |  wait=<ms>  |  eval=<js>
 * Default shots cover the works page sections. Requires the dev server on :5173.
 */
import { spawn } from 'node:child_process';
import { mkdirSync, readdirSync, existsSync, writeFileSync, readFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import path from 'node:path';

/* ── CLI ─────────────────────────────────────────────────────────────────── */
const argv = process.argv.slice(2);
const arg = (name, def) => {
  const i = argv.indexOf(`--${name}`);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : def;
};
const OUT = arg('out', 'shots');
const URL = arg('url', 'http://127.0.0.1:5173/works');
const WIDTH = Number(arg('width', 1920));
const HEIGHT = Number(arg('height', 1080));
const DSF = Number(arg('dsf', 1));
const MOBILE = argv.includes('--mobile');
const DEBUG = argv.includes('--debug');
const SHOTS = argv
  .map((a, i) => (a === '--shot' ? argv[i + 1] : a.startsWith('--shot=') ? a.slice(7) : null))
  .filter(Boolean);

const DEFAULT_SHOTS = [
  'top',
  'planet:scroll=[data-section=planet]',
  'work-together:scroll=[data-section=work-together]',
  'folders-rest:scroll=[data-section=selected-projects]',
  'brands:scroll=[data-section=brands]',
  'footer:scroll=#works footer',
  'full:eval=window.scrollTo(0,document.body.scrollHeight);wait=600;eval=window.scrollTo(0,0);wait=400;full=1',
  'folder-open:scroll=[data-section=selected-projects];click=[data-folder-tab];wait=1100',
];

/* ── locate a chrome-headless-shell binary ───────────────────────────────── */
function findChrome() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const base = path.join(homedir(), '.cache/hyperframes/chrome/chrome-headless-shell');
  if (!existsSync(base)) throw new Error('no chrome-headless-shell cache; run the doctor install');
  for (const v of readdirSync(base).sort().reverse()) {
    for (const d of readdirSync(path.join(base, v))) {
      const bin = path.join(base, v, d, 'chrome-headless-shell');
      if (existsSync(bin)) return bin;
    }
  }
  throw new Error('chrome-headless-shell binary not found');
}

/* ── tiny CDP client over the global WebSocket ───────────────────────────── */
class CDP {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 0;
    this.pending = new Map();
    this.listeners = new Map();
    this.ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
      } else if (msg.method && this.listeners.has(msg.method)) {
        this.listeners.get(msg.method)(msg.params);
      }
    });
  }
  open() {
    return new Promise((res, rej) => {
      this.ws.addEventListener('open', res, { once: true });
      this.ws.addEventListener('error', rej, { once: true });
    });
  }
  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.id;
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  once(method, fn) {
    this.listeners.set(method, fn);
  }
  close() {
    this.ws.close();
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── main ────────────────────────────────────────────────────────────────── */
const bin = findChrome();
const port = 9333 + Math.floor(Math.random() * 400);
const userData = path.join(tmpdir(), `cdp-capture-${Date.now()}`);
mkdirSync(userData, { recursive: true });
mkdirSync(OUT, { recursive: true });

const proc = spawn(bin, [
  `--remote-debugging-port=${port}`,
  '--remote-allow-origins=*',
  '--no-sandbox',
  '--disable-gpu',
  '--hide-scrollbars',
  '--no-first-run',
  '--disable-extensions',
  `--user-data-dir=${userData}`,
  `--window-size=${WIDTH},${HEIGHT}`,
  'about:blank',
], { stdio: ['ignore', 'pipe', 'pipe'] });

let wsEndpoint = null;
proc.stderr.on('data', (d) => {
  const m = String(d).match(/ws:\/\/[^\s]+/);
  if (m && !wsEndpoint) wsEndpoint = m[0];
});

const deadline = Date.now() + 15000;
while (!wsEndpoint && Date.now() < deadline) await sleep(100);
if (!wsEndpoint) { console.error('chrome did not expose CDP'); process.exit(1); }

// browser-level ws → create/fetch the page target ws
const browserWs = wsEndpoint;
const res = await fetch(`http://127.0.0.1:${port}/json`);
const targets = await res.json();
const page = targets.find((t) => t.type === 'page');

const cdp = new CDP(page.webSocketDebuggerUrl);
await cdp.open();
await cdp.send('Page.enable');
await cdp.send('Runtime.enable');
await cdp.send('Emulation.setDeviceMetricsOverride', {
  width: WIDTH,
  height: HEIGHT,
  deviceScaleFactor: MOBILE ? 2 : DSF,
  mobile: MOBILE,
});

const loaded = new Promise((r) => cdp.once('Page.loadEventFired', r));
await cdp.send('Page.navigate', { url: URL });
await Promise.race([loaded, sleep(20000)]);
await sleep(1200);
// wait for web fonts so typography is measured correctly
await cdp.send('Runtime.evaluate', { expression: 'document.fonts.ready.then(() => true)', awaitPromise: true, returnByValue: true }).catch(() => {});
await sleep(400);

const evalJs = async (expression) => {
  const r = await cdp.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) console.warn('  eval warn:', r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result?.value;
};

let runStep = async (step) => {
  const eq = step.indexOf('=');
  const kind = eq === -1 ? step : step.slice(0, eq);
  const value = eq === -1 ? '' : step.slice(eq + 1);
  switch (kind) {
    case 'scroll': {
      const asNumber = Number(value);
      if (Number.isNaN(asNumber)) {
        const r = await evalJs(`(() => { const el = document.querySelector('${value.replaceAll("'", "\\'")}'); if (!el) return 'no-element'; const y = el.getBoundingClientRect().top + window.scrollY - 90; window.scrollTo({ top: y, behavior: 'instant' }); return 'ok@' + Math.round(y); })()`);
        await sleep(900); // let ScrollTrigger settle
        return r;
      }
      await evalJs(`window.scrollTo({ top: ${value}, behavior: 'instant' })`);
      await sleep(900); // let ScrollTrigger settle
      return 'ok';
    }
    case 'click': {
      const r = await evalJs(`(() => { const els = [...document.querySelectorAll('${value.replaceAll("'", "\\'")}')]; const el = els[0]; if (!el) return 'no-element'; el.scrollIntoView({ block: 'center', behavior: 'instant' }); el.click(); return 'clicked'; })()`);
      return r;
    }
    case 'wait': await sleep(Number(value)); return 'waited';
    case 'eval': return String(await evalJs(value));
    case 'eval-file': return String(await evalJs(readFileSync(value, 'utf8')));
    case 'hover': {
      const r = await evalJs(`(() => { const el = document.querySelector('${value.replaceAll("'", "\\'")}'); if (!el) return JSON.stringify({ err: 'no-element' }); const b = el.getBoundingClientRect(); return JSON.stringify({ x: Math.round(b.left + b.width / 2), y: Math.round(b.top + b.height / 2) }); })()`);
      const pos = JSON.parse(r);
      if (pos.err) return pos.err;
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: pos.x, y: pos.y });
      return `hover@${pos.x},${pos.y}`;
    }
    case 'full': return 'full-flag';
    default: console.warn(`unknown step "${step}"`); return '?';
  }
};

const shots = SHOTS.length ? SHOTS : DEFAULT_SHOTS;
for (const shot of shots) {
  const [name, ...rest] = shot.split(':');
  const steps = rest.join(':') ? rest.join(':').split(';').filter(Boolean) : [];
  process.stdout.write(`  shot ${name} `);
  for (const s of steps) {
    const result = await runStep(s);
    if (DEBUG) process.stdout.write(` [${s.slice(0, 24)}→${result}]`);
    else process.stdout.write(`.`);
  }
  if (DEBUG) {
    const y1 = await evalJs('window.scrollY');
    process.stdout.write(` [scrollY after steps=${y1}]`);
  }
  const fullPage = steps.some((s) => s.startsWith('full=1'));
  const metrics = fullPage
    ? { width: WIDTH, height: await evalJs('Math.ceil(document.documentElement.scrollHeight)'), deviceScaleFactor: MOBILE ? 2 : DSF, mobile: MOBILE }
    : { width: WIDTH, height: HEIGHT, deviceScaleFactor: MOBILE ? 2 : DSF, mobile: MOBILE };
  await cdp.send('Emulation.setDeviceMetricsOverride', metrics);
  await sleep(fullPage ? 700 : 150);
  if (DEBUG) {
    const y2 = await evalJs('window.scrollY');
    process.stdout.write(` [scrollY after metrics=${y2}]`);
  }
  const shot_ = await cdp.send('Page.captureScreenshot', { format: 'png' });
  const file = path.join(OUT, `${name}${MOBILE ? '-mobile' : ''}.png`);
  writeFileSync(file, Buffer.from(shot_.data, 'base64'));
  if (fullPage) {
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: HEIGHT, deviceScaleFactor: MOBILE ? 2 : DSF, mobile: MOBILE });
  }
  console.log(`→ ${file}`);
}

cdp.close();
proc.kill('SIGKILL');
console.log('done');
