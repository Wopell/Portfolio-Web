#!/usr/bin/env node
/**
 * qa-punch.mjs — punch list CLI for the Antigravity(builder)/opencode(QA) split.
 *
 * PUNCHLIST.md is written ONLY through this script (atomic write: tmp+rename).
 * Roles via env QA_ROLE=builder|qa guard against careless actions (not security).
 *
 *   QA_ROLE=qa       add "<location> · <expected vs actual> · <patch> · <severity>"
 *                    add --file <path>            (4 lines: location / finding / patch / severity)
 *   QA_ROLE=builder  set <ID> fixed-pending-verify
 *                    dispute <ID> "reason"
 *   QA_ROLE=qa       verify <ID>                  (fixed-pending-verify → verified)
 *                    bump <ID>                    (fixed-pending-verify → open, rounds+1)
 *                    close <ID> <wontfix|withdrawn> "reason"   (any non-terminal state)
 *                    resolve <ID> <open|wontfix|withdrawn>      (disputed → target, rounds untouched)
 *   anyone           list
 *
 * ID allocation: max existing ID (including closed) + 1 — IDs are never reused.
 */
import { readFileSync, writeFileSync, renameSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const FILE = resolve(import.meta.dirname, '..', 'shots', 'qa', 'PUNCHLIST.md');
const SEVERITIES = new Set(['blocker', 'major', 'minor']);
const TERMINAL = new Set(['verified', 'wontfix', 'withdrawn']);
const STATE_RE = /^(QA-\d+) — \[([a-z-]+)\] rounds:(\d+)/;

/* ── file IO (atomic) ──────────────────────────────────────────────────── */

const load = () => {
  if (!existsSync(FILE)) fail(`no ${FILE} yet — run "add" to bootstrap it`);
  return readFileSync(FILE, 'utf8');
};

const atomicWrite = (content) => {
  mkdirSync(dirname(FILE), { recursive: true });
  const tmp = `${FILE}.tmp-${process.pid}`;
  writeFileSync(tmp, content);
  renameSync(tmp, FILE);
};

/* ── item model ────────────────────────────────────────────────────────── */

const parseItems = (text) => {
  const items = [];
  for (const block of text.split(/^### /m).slice(1)) {
    const m = block.match(STATE_RE);
    if (!m) continue;
    let body = block.slice(block.indexOf('\n') + 1);
    let history = [];
    const hm = body.match(/^_history: (.+)_$/m);
    if (hm) {
      history = hm[1].split(' · ');
      body = body.replace(/^_history: .+_\n?/m, '');
    }
    items.push({ id: m[1], state: m[2], rounds: Number(m[3]), body: body.trim(), history });
  }
  return items;
};

const serializeItem = (it) =>
  [
    `### ${it.id} — [${it.state}] rounds:${it.rounds}`,
    ...(it.history?.length ? [`_history: ${it.history.join(' · ')}_`] : []),
    '',
    it.body,
  ].join('\n') + '\n';

const headText =
  '# QA Punch List\n\n' +
  'IDs QA-NNN, assigned by scripts/qa-punch.mjs (never reused).\n' +
  'States: open → fixed-pending-verify → verified, plus disputed / wontfix / withdrawn.\n' +
  'A round = punch list delivered → builder response → opencode re-verification.\n' +
  'Round 3 without a pass escalates: opencode proposes to implement, pending user approval.\n\n' +
  'Edit this file ONLY via `node scripts/qa-punch.mjs` (atomic writes).\n\n';

const rebuild = (items) => headText + items.map(serializeItem).join('\n');

const nextId = (items) => {
  const max = items.reduce((a, it) => Math.max(a, Number(it.id.slice(3))), 0);
  return `QA-${String(max + 1).padStart(3, '0')}`;
};

/* ── role guard: reject AND print the exact corrected command ──────────── */

const roleFail = (cmd, role, args) => {
  console.error(
    `role error: '${cmd}' requires QA_ROLE=${role}.\n` +
      `Run: QA_ROLE=${role} node scripts/qa-punch.mjs ${[cmd, ...args].join(' ')}`
  );
  process.exit(3);
};
const requireRole = (cmd, role, args) => {
  if (process.env.QA_ROLE !== role) roleFail(cmd, role, args);
};

const fail = (msg) => {
  console.error(msg);
  process.exit(1);
};

/* ── commands ──────────────────────────────────────────────────────────── */

const cmdAdd = (args) => {
  requireRole('add', 'qa', args);
  let location, finding, patch, severity;

  if (args[0] === '--file') {
    const lines = readFileSync(args[1], 'utf8').split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 4) fail(`--file expects 4 non-empty lines (location / finding / patch / severity), got ${lines.length}`);
    [location, finding, patch, severity] = lines;
  } else if (args[0] === '--stdin') {
    const lines = readFileSync(0, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 4) fail(`--stdin expects 4 non-empty lines (location / finding / patch / severity), got ${lines.length}`);
    [location, finding, patch, severity] = lines;
  } else {
    const parts = (args[0] ?? '').split('·').map((s) => s.trim());
    [location, finding, patch, severity] = parts;
    if (parts.length !== 4 || parts.some((p) => !p)) {
      fail(
        `add expects 4 '·'-separated fields (location · expected vs actual · suggested patch · severity), ` +
          `got ${parts.length}: ${JSON.stringify(parts)}\n` +
          `For items containing '·' or newlines use: add --file <path> (4 lines) or --stdin.`
      );
    }
  }
  if (!SEVERITIES.has(severity)) fail(`severity must be one of blocker|major|minor, got "${severity}"`);

  const items = parseItems(existsSync(FILE) ? load() : '');
  const it = {
    id: nextId(items),
    state: 'open',
    rounds: 0,
    body: `**${location}** — ${finding}\n- severity: ${severity}\n- suggested patch: ${patch}`,
    history: [`added ${new Date().toISOString().slice(0, 10)}`],
  };
  items.push(it);
  atomicWrite(rebuild(items));
  console.log(`${it.id} added [open]`);
};

const find = (items, id) => {
  const it = items.find((x) => x.id === id);
  if (!it) fail(`${id} not found`);
  return it;
};

const guardTerminal = (it, cmd) => {
  if (TERMINAL.has(it.state)) fail(`${it.id} is terminal [${it.state}] — '${cmd}' is not allowed`);
};

const cmdSet = (args) => {
  requireRole('set', 'builder', args);
  if (args[1] !== 'fixed-pending-verify') fail("set only accepts 'fixed-pending-verify'");
  const items = parseItems(load());
  const it = find(items, args[0].toUpperCase());
  guardTerminal(it, 'set');
  if (it.state !== 'open') fail(`${it.id} is [${it.state}] — set is only valid from open (use dispute from open, or resolve a disputed item first)`);
  it.state = 'fixed-pending-verify';
  it.history.push(`builder marked fixed ${new Date().toISOString().slice(0, 10)}`);
  atomicWrite(rebuild(items));
  console.log(`${it.id} → [fixed-pending-verify]`);
};

const cmdDispute = (args) => {
  requireRole('dispute', 'builder', args);
  const id = args[0].toUpperCase();
  const reason = args.slice(1).join(' ').trim();
  if (!reason) fail('dispute requires a one-line reason');
  const items = parseItems(load());
  const it = find(items, id);
  guardTerminal(it, 'dispute');
  if (it.state !== 'open') fail(`${it.id} is [${it.state}] — dispute is only valid from open`);
  it.state = 'disputed';
  it.history.push(`disputed: ${reason}`);
  atomicWrite(rebuild(items));
  console.log(`${it.id} → [disputed]`);
};

const cmdVerify = (args) => {
  requireRole('verify', 'qa', args);
  const id = args[0].toUpperCase();
  const items = parseItems(load());
  const it = find(items, id);
  guardTerminal(it, 'verify');
  if (it.state !== 'fixed-pending-verify') fail(`${it.id} is [${it.state}] — verify is only valid from fixed-pending-verify (the builder must mark it first)`);
  it.state = 'verified';
  it.history.push(`verified after ${it.rounds} round(s)`);
  atomicWrite(rebuild(items));
  console.log(`${it.id} → [verified]`);
};

const cmdBump = (args) => {
  requireRole('bump', 'qa', args);
  const id = args[0].toUpperCase();
  const items = parseItems(load());
  const it = find(items, id);
  guardTerminal(it, 'bump');
  if (it.state !== 'fixed-pending-verify') fail(`${it.id} is [${it.state}] — bump is only valid from fixed-pending-verify (a round counts only when the builder responded and it still fails)`);
  it.rounds += 1;
  it.state = 'open';
  it.history.push(`round ${it.rounds} failed re-verification`);
  atomicWrite(rebuild(items));
  const note = it.rounds >= 3 ? ' — ESCALATION: 3+ rounds, propose to implement (pending user approval)' : '';
  console.log(`${it.id} → [open] rounds:${it.rounds}${note}`);
};

const cmdClose = (args) => {
  requireRole('close', 'qa', args);
  const id = args[0].toUpperCase();
  const target = args[1];
  const reason = args.slice(2).join(' ').trim();
  if (!['wontfix', 'withdrawn'].includes(target)) fail("close target must be 'wontfix' or 'withdrawn'");
  if (!reason) fail('close requires a one-line reason');
  const items = parseItems(load());
  const it = find(items, id);
  guardTerminal(it, 'close');
  it.state = target;
  it.history.push(`closed as ${target}: ${reason}`);
  atomicWrite(rebuild(items));
  console.log(`${it.id} → [${target}]`);
};

const cmdResolve = (args) => {
  requireRole('resolve', 'qa', args);
  const id = args[0].toUpperCase();
  const target = args[1];
  if (!['open', 'wontfix', 'withdrawn'].includes(target)) fail("resolve target must be 'open', 'wontfix' or 'withdrawn'");
  const items = parseItems(load());
  const it = find(items, id);
  guardTerminal(it, 'resolve');
  if (it.state !== 'disputed') fail(`${it.id} is [${it.state}] — resolve is only valid from disputed`);
  it.state = target;
  it.history.push(`dispute resolved → ${target} (rounds untouched)`);
  atomicWrite(rebuild(items));
  console.log(`${it.id} → [${target}] (rounds untouched)`);
};

const cmdList = () => {
  if (!existsSync(FILE)) {
    console.log('no punch list yet (no open items)');
    return;
  }
  const items = parseItems(load());
  if (!items.length) {
    console.log('punch list is empty (no open items)');
    return;
  }
  for (const it of items) {
    console.log(`${it.id} [${it.state}] rounds:${it.rounds}${TERMINAL.has(it.state) ? ' (terminal)' : ''}`);
    console.log(`  ${it.body.split('\n')[0]}`);
  }
  const open = items.filter((it) => !TERMINAL.has(it.state)).length;
  console.log(`— ${items.length} item(s), ${open} open —`);
};

/* ── dispatch ──────────────────────────────────────────────────────────── */

const [cmd, ...args] = process.argv.slice(2);
const commands = { add: cmdAdd, set: cmdSet, dispute: cmdDispute, verify: cmdVerify, bump: cmdBump, close: cmdClose, resolve: cmdResolve, list: cmdList };
const fn = commands[cmd];
if (!fn) fail(`usage: node scripts/qa-punch.mjs <add|set|dispute|verify|bump|close|resolve|list> [args...]`);
fn(args);
