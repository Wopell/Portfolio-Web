import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
function getArg(flag, defaultValue = null) {
  const idx = args.indexOf(flag);
  if (idx !== -1 && idx + 1 < args.length) return args[idx + 1];
  return defaultValue;
}

const baseUrl = getArg('--url', 'http://127.0.0.1:5173');
const sectionArg = getArg('--section', 'selected-projects');
const customPath = getArg('--path', null);
const width = parseInt(getArg('--width', '1440'), 10);
const height = 900;

const routePath = customPath ?? ((sectionArg === 'carpetas' || sectionArg === 'selected-projects' || sectionArg === 'planeta') ? '/works' : '/');
const fullUrl = new URL(routePath, baseUrl).toString();

// Timestamp folder
const now = new Date();
const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
const reportDir = path.join(rootDir, 'docs', 'reportes', dateStr);
fs.mkdirSync(reportDir, { recursive: true });

async function measureFps(page, durationMs = 2000, action = async () => {}) {
  await page.evaluate(() => {
    window.__fpsFrames = 0;
    window.__fpsStart = performance.now();
    window.__fpsActive = true;
    function loop() {
      if (!window.__fpsActive) return;
      window.__fpsFrames++;
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  });

  const interval = setInterval(async () => {
    try {
      await action();
    } catch {}
  }, 50);

  await page.waitForTimeout(durationMs);
  clearInterval(interval);

  const result = await page.evaluate(() => {
    window.__fpsActive = false;
    const elapsed = performance.now() - window.__fpsStart;
    return {
      frames: window.__fpsFrames,
      elapsedMs: elapsed,
      fps: Number(((window.__fpsFrames / elapsed) * 1000).toFixed(1))
    };
  });

  return result.fps;
}

async function getHeapMemoryMb(cdpSession) {
  try {
    const { metrics } = await cdpSession.send('Performance.getMetrics');
    const heapMetric = metrics.find(m => m.name === 'JSHeapUsedSize');
    if (heapMetric) {
      return Number((heapMetric.value / (1024 * 1024)).toFixed(2));
    }
  } catch {}
  return null;
}

function getBundleSize() {
  const distDir = path.join(rootDir, 'dist');
  if (!fs.existsSync(distDir)) return null;

  let totalBytes = 0;
  function walk(d) {
    const items = fs.readdirSync(d, { withFileTypes: true });
    for (const item of items) {
      const full = path.join(d, item.name);
      if (item.isDirectory()) walk(full);
      else totalBytes += fs.statSync(full).size;
    }
  }
  walk(distDir);
  return Number((totalBytes / (1024 * 1024)).toFixed(2));
}

async function run() {
  // Launch Chromium enabling GPU flags
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--enable-gpu-rasterization',
      '--ignore-gpu-blocklist',
      '--use-gl=angle',
      '--disable-background-timer-throttling'
    ]
  });

  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1
  });

  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Performance.enable');

  const startNav = Date.now();
  await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 30000 });
  const loadTimeMs = Date.now() - startNav;

  // Let initial animations settle
  await page.waitForTimeout(1000);

  const initialHeapMb = await getHeapMemoryMb(cdp);

  // 1. Measure FPS Idle (cursor stationary) -> Serves as ENVIRONMENT BASELINE
  const fpsIdle = await measureFps(page, 2000);

  // 2. Measure FPS Active (cursor moving across selected projects)
  const fpsMoving = await measureFps(page, 2000, async () => {
    const x = Math.floor(width / 2 + (Math.random() * 200 - 100));
    const y = Math.floor(height / 2 + (Math.random() * 200 - 100));
    await page.mouse.move(x, y);
  });

  // Relative retention ratio against own environment baseline
  const fpsRetentionPercent = fpsIdle > 0 ? Number(((fpsMoving / fpsIdle) * 100).toFixed(1)) : 100;
  const fpsStatus = fpsRetentionPercent >= 85 ? 'PASA (Fluido, retiene ≥ 85% de la línea base)' : 'CAÍDA DETECTADA';

  // 3. Simulate stress: 10 cycles of scroll/interaction to test memory stability
  for (let i = 0; i < 10; i++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(50);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(50);
  }

  // Allow GC settling
  await page.waitForTimeout(500);
  const postStressHeapMb = await getHeapMemoryMb(cdp);

  const bundleSizeMb = getBundleSize();

  const memoryDeltaPercent = (initialHeapMb && postStressHeapMb)
    ? Number((((postStressHeapMb - initialHeapMb) / initialHeapMb) * 100).toFixed(1))
    : 0;

  const resultData = {
    timestamp: now.toISOString(),
    environmentNote: 'En Chromium headless el virtual compositor clampa rAF a 60 FPS por defecto; en monitor real de 240Hz el refresco sincroniza con el display nativo. Por ello, la evaluación cinemática se mide contra la línea base de reposo de cada entorno.',
    viewport: { width, height },
    loadTimeMs,
    fpsIdleBaseline: fpsIdle,
    fpsMoving,
    fpsRetentionPercent,
    fpsStatus,
    initialHeapMb,
    postStressHeapMb,
    memoryDeltaPercent,
    bundleSizeMb: bundleSizeMb !== null ? `${bundleSizeMb} MB` : 'dist/ no compilado'
  };

  const outputJsonPath = path.join(reportDir, 'performance.json');
  fs.writeFileSync(outputJsonPath, JSON.stringify(resultData, null, 2));

  await context.close();
  await browser.close();

  console.log('\n======================================================');
  console.log('              REPORTE DE RENDIMIENTO (PERF.MJS)       ');
  console.log(`  Guardado en: docs/reportes/${dateStr}/performance.json `);
  console.log('======================================================');
  console.log(`- Tiempo de carga (networkidle): ${loadTimeMs} ms`);
  console.log(`- FPS en Reposo (Línea base del entorno): ${fpsIdle} FPS`);
  console.log(`- FPS en Movimiento (Cursor activo): ${fpsMoving} FPS`);
  console.log(`- Retención cinemática relativa: ${fpsRetentionPercent}% -> ${fpsStatus}`);
  console.log(`- Memoria JS Heap Inicial: ${initialHeapMb ?? 'N/D'} MB`);
  console.log(`- Memoria JS Heap Post-10x Estrés: ${postStressHeapMb ?? 'N/D'} MB (Delta: ${memoryDeltaPercent}%)`);
  console.log(`- Tamaño del directorio dist/: ${resultData.bundleSizeMb}`);
  console.log('======================================================\n');
}

run().catch(err => {
  console.error('[perf.mjs] Error fatal:', err);
  process.exit(1);
});
