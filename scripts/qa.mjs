#!/usr/bin/env node
/**
 * qa.mjs — QA gate for this repo (run by opencode as the QA role; Antigravity runs it too).
 *
 *   node scripts/qa.mjs          fast: preflight + tsc + desktop/mobile sweeps + img/console checks
 *   node scripts/qa.mjs --full   fast + production build + interaction shots + rAF probe
 *
 * Exit codes (documented in AGENTS.md):
 *   0  pass — REPORT.md written, verdict PASS
 *   1  QA fail — something in the app must be fixed (see REPORT.md)
 *   2  environment down — dev server or chrome unusable; REPORT.md names the fix
 *   3  lock conflict — another qa run holds shots/qa/.lock
 *
 * Never edits source files: this is a gate, not a fixer. Punch list via scripts/qa-punch.mjs.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, unlinkSync, openSync, closeSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const QA_DIR = path.join(ROOT, 'shots', 'qa');
const REPORT = path.join(QA_DIR, 'REPORT.md');
const LOCK = path.join(QA_DIR, '.lock');
const FULL = process.argv.includes('--full');
const URL = 'http://127.0.0.1:5173/works';
const IGNORE_CONSOLE = ['favicon']; // benign noise

const now = () => new Date().toISOString().replace('T', ' ').slice(0, 19);
const fence = (s) => '```\n' + s + '\n```';

/* ── lock: one qa run at a time (PID-checked, Ctrl+C safe) ─────────────── */

let lockHeld = false;
const releaseLock = () => {
  if (!lockHeld) return;
  lockHeld = false;
  try { unlinkSync(LOCK); } catch {}
};
process.on('SIGINT', () => { releaseLock(); process.exit(130); });
process.on('SIGTERM', () => { releaseLock(); process.exit(143); });

const acquireLock = () => {
  mkdirSync(QA_DIR, { recursive: true });
  const create = () => {
    try {
      closeSync(openSync(LOCK, 'wx')); // exclusive create
      return true;
    } catch {
      return false;
    }
  };
  if (create()) {
    lockHeld = true;
    writeFileSync(LOCK, JSON.stringify({ pid: process.pid, startedAt: Date.now() }));
    return;
  }
  try {
    const { pid, startedAt } = JSON.parse(readFileSync(LOCK, 'utf8'));
    const age = Date.now() - (startedAt || 0);
    let alive = false;
    try { process.kill(pid, 0); alive = true; } catch {}
    if (alive && age < 15 * 60 * 1000) {
      console.error(`lock held by pid ${pid} (started ${Math.round(age / 1000)}s ago). If that is stale, delete ${LOCK}`);
      process.exit(3);
    }
    console.warn(`stealing stale lock (pid ${pid} ${alive ? 'older than 15 min' : 'not alive'})`);
  } catch {}
  try { unlinkSync(LOCK); } catch {}
  if (!create()) {
    console.error(`could not acquire ${LOCK}`);
    process.exit(3);
  }
  lockHeld = true;
  writeFileSync(LOCK, JSON.stringify({ pid: process.pid, startedAt: Date.now() }));
};

/* ── report ─────────────────────────────────────────────────────────────── */

const report = {
  startedAt: now(),
  mode: FULL ? 'full' : 'fast',
  preflight: null,
  tsc: null,
  build: null,
  captures: [],
  checks: {},
  verdict: 'PASS',
  exit: 0,
};

const writeReport = (extra = '') => {
  const L = [];
  L.push(`# QA Report — ${report.startedAt} (mode: ${report.mode})`);
  L.push('');
  L.push('| check | result |');
  L.push('|---|---|');
  L.push(`| preflight | ${report.preflight ?? '…'} |`);
  L.push(`| tsc --noEmit | ${report.tsc ?? 'skipped'} |`);
  if (FULL) L.push(`| npm run build | ${report.build ?? 'skipped'} |`);
  for (const c of report.captures) L.push(`| capture ${c.label} | ${c.result} |`);
  if (report.checks.brokenImgs !== undefined) L.push(`| broken imgs | ${report.checks.brokenImgs} |`);
  if (report.checks.consoleErrors !== undefined) L.push(`| console errors | ${report.checks.consoleErrors} |`);
  if (report.checks.exceptions !== undefined) L.push(`| page exceptions | ${report.checks.exceptions} |`);
  if (report.checks.raf !== undefined) L.push(`| rAF probe | ${report.checks.raf} |`);
  L.push('');
  L.push(`**verdict: ${report.verdict}** (exit ${report.exit})`);
  L.push('');
  if (extra) L.push(extra);
  try { writeFileSync(REPORT, L.join('\n')); } catch {}
};

/* ── runners ────────────────────────────────────────────────────────────── */

const run = (cmd, args, timeout) => {
  const r = spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf8', timeout: timeout ?? 180000, shell: process.platform === 'win32' });
  return { code: r.status, stdout: r.stdout || '', stderr: r.stderr || '' };
};

const restartHint = () =>
  process.platform === 'linux'
    ? `WSL: from the project dir → (nohup node node_modules/vite/bin/vite.js --port 5173 --host 127.0.0.1 > /tmp/opencode/vite-dev.log 2>&1 &) then wait ~12s. Or simply: npm run dev`
    : `Windows: run \`npm run dev\` in a standalone terminal (it blocks) and keep it running.`;

const preflight = async () => {
  try {
    const r = await fetch(URL, { signal: AbortSignal.timeout(4000) });
    return r.ok;
  } catch {
    return false;
  }
};

const chromeCached = () => existsSync(path.join(homedir(), '.cache/hyperframes/chrome/chrome-headless-shell'));

const capture = (label, args) => {
  const jsonPath = path.join(QA_DIR, `${label}.json`);
  const r = spawnSync(process.execPath, ['scripts/capture_sections.mjs', '--out', path.join('shots', 'qa', label), '--json', jsonPath, ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 180000,
  });
  const ok = r.status === 0;
  report.captures.push({ label, result: ok ? 'ok' : `FAILED (exit ${r.status})` });
  if (!ok) console.error(`capture ${label} failed:\n${r.stdout}\n${r.stderr}`);
  else {
    try {
      return JSON.parse(readFileSync(jsonPath, 'utf8'));
    } catch (e) {
      console.error(`capture ${label}: unreadable json (${e.message})`);
    }
  }
  return null;
};

/* ── main ───────────────────────────────────────────────────────────────── */

acquireLock();

const viteUp = await preflight();
const chromeOk = chromeCached();
if (!viteUp || !chromeOk) {
  report.preflight = !viteUp ? 'dev server down' : 'chrome cache missing';
  report.verdict = 'ENVIRONMENT';
  report.exit = 2;
  writeReport(!viteUp
    ? `dev server (${URL}) is not reachable. Fix:\n\n    ${restartHint()}\n\nthen re-run \`${FULL ? 'npm run qa:full' : 'npm run qa'}\`.`
    : `chrome-headless-shell cache not found under ~/.cache/hyperframes/chrome — run the capture env setup.`);
  releaseLock();
  console.error(`preflight: ${report.preflight} — see ${REPORT}`);
  process.exit(2);
}
report.preflight = 'ok';

/* tsc */
const tsc = run(process.execPath, ['node_modules/typescript/bin/tsc', '--noEmit', '--pretty', 'false'], 120000);
if (tsc.code !== 0) {
  const lines = tsc.stdout.trim() ? tsc.stdout.trim().split('\n') : ['(no stdout) ' + tsc.stderr.slice(0, 400)];
  report.tsc = `FAILED (${lines.length} line(s))`;
  report.verdict = 'FAIL';
  report.exit = 1;
  writeReport(`typecheck errors (first 10):\n\n${fence(lines.slice(0, 10).join('\n'))}`);
  releaseLock();
  console.error(`tsc failed — see ${REPORT}`);
  process.exit(1);
}
report.tsc = 'ok';

/* build (full only) */
if (FULL) {
  const b = run('npm', ['run', 'build'], 300000);
  report.build = b.code === 0 ? 'ok' : `FAILED (exit ${b.code})`;
  if (b.code !== 0) {
    report.verdict = 'FAIL';
    report.exit = 1;
    writeReport(`build output tail:\n\n${fence((b.stderr + '\n' + b.stdout).trim().slice(-1500))}`);
    releaseLock();
    console.error('build failed — see REPORT');
    process.exit(1);
  }
}

/* captures */
const DESKTOP = ['--width', '1920', '--height', '1080'];
const MOBILE = ['--mobile', '--width', '390', '--height', '844'];
const FULLPAGE = 'eval=window.scrollTo(0,document.body.scrollHeight);wait=600;eval=window.scrollTo(0,0);wait=400;full=1';

const fastShots = (prefix) => [
  'top:wait=500',
  'folders:scroll=[data-section=selected-projects];wait=700',
  'brands:scroll=[data-section=brands];wait=500',
  'contact:scroll=[data-section=work-together];wait=500',
  `full:${FULLPAGE}`,
  'imgcheck:eval-file=scripts/_qa-imgcheck.js;wait=300',
].map((s) => `${prefix}${s}`);

const desktopJson = capture('desktop', [...DESKTOP, ...fastShots('').flatMap((s) => ['--shot', s])]);
const mobileJson = capture('mobile', [...MOBILE, ...fastShots('m-').flatMap((s) => ['--shot', s])]);

/* full-mode extras: interaction shots + rAF probe (desktop, one session) */
let fullJson = null;
if (FULL) {
  fullJson = capture('interactions', [
    ...DESKTOP,
    '--shot', 'i-hover-folder:scroll=[data-section=selected-projects];wait=700;hover=[data-folder-tab=category-animation] svg;wait=900',
    '--shot', 'i-hover-contact:scroll=[data-section=work-together];wait=500;hover=[data-social-tile];wait=600',
    '--shot', 'raf:eval-file=scripts/_qa-raf.js;wait=300',
    '--shot', 'i-open-folder:scroll=[data-section=selected-projects];wait=600;click=[data-folder-tab=category-3d-art];wait=1500',
  ]);
}

/* checks */
const jsons = [desktopJson, mobileJson, fullJson].filter(Boolean);
const brokenSrcs = new Set();
const consoleErrors = [];
const exceptions = [];
for (const j of jsons) {
  for (const e of j.consoleErrors || []) if (!IGNORE_CONSOLE.some((n) => e.text?.includes(n))) consoleErrors.push(e);
  for (const e of j.exceptions || []) exceptions.push(e);
  for (const shot of j.shots) {
    for (const st of shot.steps) {
      if (!st.step.startsWith('eval-file=scripts/_qa-imgcheck')) continue;
      try {
        const v = JSON.parse(st.result);
        if (v.bad > 0) v.srcs.forEach((s) => brokenSrcs.add(`${j.mobile ? 'mobile' : 'desktop'}: ${s}`));
      } catch {}
    }
  }
}
report.checks.brokenImgs = brokenSrcs.size;
report.checks.consoleErrors = consoleErrors.length;
report.checks.exceptions = exceptions.length;

const problems = [];
const failedCaptures = report.captures.filter((c) => c.result !== 'ok').map((c) => c.label);
if (failedCaptures.length) problems.push(`capture run failed: ${failedCaptures.join(', ')}`);
if (brokenSrcs.size) problems.push(`broken images (${brokenSrcs.size}):\n  ${[...brokenSrcs].join('\n  ')}`);
if (consoleErrors.length) problems.push(`console errors (${consoleErrors.length}):\n  ${consoleErrors.slice(0, 8).map((e) => String(e.text).slice(0, 160)).join('\n  ')}`);
if (exceptions.length) problems.push(`page exceptions (${exceptions.length}):\n  ${exceptions.slice(0, 5).join('\n  ')}`);
if (FULL && fullJson) {
  const rafShot = fullJson.shots.find((s) => s.name === 'raf');
  const rafRes = rafShot?.steps.find((st) => st.step.includes('_qa-raf'));
  if (rafRes) {
    try {
      const v = JSON.parse(rafRes.result);
      const ok = v.avgFrameMs < 100;
      report.checks.raf = `${v.avgFrameMs} ms avg (${ok ? 'ok' : 'THROTTLED'})`;
      if (!ok) problems.push(`rAF avg ${v.avgFrameMs} ms — animations throttled`);
    } catch {
      report.checks.raf = `unparsed: ${String(rafRes.result).slice(0, 80)}`;
    }
  } else {
    report.checks.raf = 'probe step missing';
  }
}

if (problems.length) {
  report.verdict = 'FAIL';
  report.exit = 1;
  writeReport(problems.map((p) => `- ${p}`).join('\n'));
  releaseLock();
  console.error(`QA FAIL — see ${REPORT}`);
  process.exit(1);
}

writeReport();
releaseLock();
console.log(`QA PASS (${report.mode}) — ${REPORT}`);
process.exit(0);
