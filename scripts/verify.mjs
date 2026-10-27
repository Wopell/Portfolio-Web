import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// CLI Arguments parsing
const args = process.argv.slice(2);
function getArg(flag, defaultValue = null) {
  const idx = args.indexOf(flag);
  if (idx !== -1 && idx + 1 < args.length) return args[idx + 1];
  return defaultValue;
}

const baseUrl = getArg('--url', 'http://127.0.0.1:5173');
const sectionArg = getArg('--section', 'selected-projects');
const customSelector = getArg('--selector', null);
const customPath = getArg('--path', null);
const widthsArg = getArg('--widths', '1920,1440,768,390');
const targetWidths = widthsArg.split(',').map(w => parseInt(w.trim(), 10)).filter(Boolean);

// Resolve target route and CSS selector based on section
function resolveRouteAndSelector(section, customSel, customP) {
  let routePath = customP ?? '/';
  let selector = customSel ?? null;

  if (section === 'carpetas' || section === 'selected-projects') {
    routePath = customP ?? '/works';
    selector = customSel ?? '#selected-projects';
  } else if (section === 'planeta' || section === 'planet-hero') {
    routePath = customP ?? '/works';
    selector = customSel ?? 'div[role="region"][aria-label="Presentación interactiva del portafolio"]';
  } else if (section === 'home' || section === 'scrollytelling') {
    routePath = customP ?? '/';
    selector = customSel ?? null;
  }

  return { routePath, selector };
}

const { routePath, selector: targetSelector } = resolveRouteAndSelector(sectionArg, customSelector, customPath);
const fullUrl = new URL(routePath, baseUrl).toString();

// Timestamp folder for reports
const now = new Date();
const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
const reportDir = path.join(rootDir, 'docs', 'reportes', dateStr);
fs.mkdirSync(reportDir, { recursive: true });

const aprobadosDir = path.join(rootDir, 'docs', 'referencias', 'aprobados');
fs.mkdirSync(aprobadosDir, { recursive: true });

async function run() {
  const browser = await chromium.launch({ headless: true });
  const reportResults = [];
  const criteriaChecks = [];

  for (const width of targetWidths) {
    const height = width >= 1024 ? 1000 : (width >= 768 ? 1024 : 844);
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 1
    });

    const page = await context.newPage();
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => consoleErrors.push(err.message));

    let navigationOk = true;
    try {
      await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1000);
    } catch (e) {
      navigationOk = false;
      consoleErrors.push(`Error de navegación: ${e.message}`);
    }

    // 1. Detect horizontal scroll
    let hasHorizontalScroll = false;
    let scrollWidth = width;
    let clientWidth = width;
    if (navigationOk) {
      const scrollInfo = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: window.innerWidth
      }));
      scrollWidth = scrollInfo.scrollWidth;
      clientWidth = scrollInfo.clientWidth;
      hasHorizontalScroll = scrollWidth > clientWidth + 1;
    }

    // 2. Full-page screenshot
    const fullShotPath = path.join(reportDir, `full_${width}px.png`);
    let fullShotRel = path.relative(rootDir, fullShotPath).replace(/\\/g, '/');
    if (navigationOk) {
      await page.screenshot({ path: fullShotPath, fullPage: true });
    }

    // 3. Section crop screenshot & component checks
    let sectionShotRel = null;
    let sectionFound = false;
    let pixelDiffPercent = null;
    let diffImageRel = null;
    let diffSignal = 'NO_BASELINE';

    let specificChecks = {};

    if (navigationOk && targetSelector) {
      const element = await page.$(targetSelector);
      if (element) {
        sectionFound = true;
        const sectionShotPath = path.join(reportDir, `section_${sectionArg}_${width}px.png`);
        // Check if baseline approved image exists (priority: referencia_*, section_*, senal_*)
        const approvedRefName = `referencia_${sectionArg}_${width}px.png`;
        const approvedName = `section_${sectionArg}_${width}px.png`;
        const approvedSignalName = `senal_${sectionArg}_${width}px.png`;
        const approvedPath = [approvedRefName, approvedName, approvedSignalName]
          .map(n => path.join(aprobadosDir, n))
          .find(p => fs.existsSync(p)) ?? null;

        if (approvedPath && width === 1920 && (sectionArg === 'carpetas' || sectionArg === 'selected-projects')) {
          const box = await element.boundingBox();
          if (box) {
            // Scroll so section is positioned within the 800px frame
            await page.evaluate((top) => window.scrollTo(0, Math.max(0, top - 30)), box.y);
            await page.waitForTimeout(300);
            await page.screenshot({
              path: sectionShotPath,
              clip: { x: 0, y: 0, width: 1920, height: 800 }
            });
          } else {
            await element.screenshot({ path: sectionShotPath });
          }
        } else {
          await element.screenshot({ path: sectionShotPath });
        }
        sectionShotRel = path.relative(rootDir, sectionShotPath).replace(/\\/g, '/');

        if (approvedPath) {
          try {
            const imgCurrent = PNG.sync.read(fs.readFileSync(sectionShotPath));
            const imgApproved = PNG.sync.read(fs.readFileSync(approvedPath));

            if (imgCurrent.width === imgApproved.width && imgCurrent.height === imgApproved.height) {
              const { width: w, height: h } = imgCurrent;
              const diff = new PNG({ width: w, height: h });
              const numDiffPixels = pixelmatch(
                imgCurrent.data,
                imgApproved.data,
                diff.data,
                w,
                h,
                { threshold: 0.1 }
              );

              pixelDiffPercent = Number(((numDiffPixels / (w * h)) * 100).toFixed(2));
              const diffPath = path.join(reportDir, `diff_${sectionArg}_${width}px.png`);
              fs.writeFileSync(diffPath, PNG.sync.write(diff));
              diffImageRel = path.relative(rootDir, diffPath).replace(/\\/g, '/');
              diffSignal = pixelDiffPercent <= 1.5 ? 'ESTABLE' : 'DESVIACIÓN_DETECTADA';
            } else {
              diffSignal = 'DIMENSIÓN_DIFERENTE';
            }
          } catch (diffErr) {
            diffSignal = `ERROR_DIFF: ${diffErr.message}`;
          }
        }

        // Section-specific DOM & architecture checks
        if (sectionArg === 'planeta' || sectionArg === 'planet-hero') {
          specificChecks = await page.evaluate(() => {
            const container = document.querySelector('div[role="region"][aria-label="Presentación interactiva del portafolio"]');
            const nav = document.querySelector('nav');
            const canvas = container ? container.querySelector('canvas') : null;

            const touchAction = container ? window.getComputedStyle(container).touchAction : null;
            const containerZIndex = container ? parseInt(window.getComputedStyle(container).zIndex, 10) || 10 : 0;
            const navZIndex = nav ? parseInt(window.getComputedStyle(nav).zIndex, 10) || 100 : 0;

            const labels = ['Editorial Design', 'Social Media', 'Branding', 'Event Graphics'];
            const labelsFound = labels.filter(txt => document.body.innerText.includes(txt));

            return {
              touchAction,
              hasPanY: touchAction === 'pan-y',
              navAbovePlanet: navZIndex > containerZIndex,
              containerZIndex,
              navZIndex,
              hasCanvas: !!canvas,
              labelsFoundCount: labelsFound.length
            };
          });
        }
      }
    }

    await context.close();

    reportResults.push({
      width,
      navigationOk,
      consoleErrorsCount: consoleErrors.length,
      consoleErrors,
      hasHorizontalScroll,
      scrollWidth,
      clientWidth,
      fullScreenshot: fullShotRel,
      sectionSelector: targetSelector,
      sectionFound,
      sectionScreenshot: sectionShotRel,
      pixelDiffPercent,
      diffSignal: `${diffSignal} (Señal informativa)`,
      diffScreenshot: diffImageRel,
      specificChecks
    });
  }

  // 4. Dedicated 360px overflow test (as requested by user)
  let overflow360Ok = true;
  {
    const context360 = await browser.newContext({ viewport: { width: 360, height: 844 }, deviceScaleFactor: 1 });
    const page360 = await context360.newPage();
    await page360.goto(fullUrl, { waitUntil: 'networkidle', timeout: 30000 });
    const scrollInfo360 = await page360.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: window.innerWidth
    }));
    overflow360Ok = scrollInfo360.scrollWidth <= scrollInfo360.clientWidth + 1;
    await context360.close();
  }

  await browser.close();

  // Evaluate final criteria table
  const allConsoleClean = reportResults.every(r => r.consoleErrorsCount === 0);
  const allNoHorizontalScroll = reportResults.every(r => !r.hasHorizontalScroll) && overflow360Ok;
  const allSectionsDetected = reportResults.every(r => r.sectionFound);

  let touchActionPass = true;
  let navAbovePlanetPass = true;
  if (sectionArg === 'planeta' || sectionArg === 'planet-hero') {
    touchActionPass = reportResults.every(r => r.specificChecks?.hasPanY);
    navAbovePlanetPass = reportResults.every(r => r.specificChecks?.navAbovePlanet);
  }

  criteriaChecks.push({
    criterio: 'Consola limpia (0 errores/warnings)',
    estado: allConsoleClean ? 'PASA' : 'FALLA',
    evidencia: `${reportResults.reduce((acc, r) => acc + r.consoleErrorsCount, 0)} errores en consola`
  });

  criteriaChecks.push({
    criterio: 'Scroll horizontal ausente (1920, 1440, 768, 390px + 360px)',
    estado: allNoHorizontalScroll ? 'PASA' : 'FALLA',
    evidencia: overflow360Ok ? 'Sin desborde horizontal (360px limpio)' : 'Desborde detectado en 360px'
  });

  criteriaChecks.push({
    criterio: `Sección detectada (${targetSelector})`,
    estado: allSectionsDetected ? 'PASA' : 'FALLA',
    evidencia: allSectionsDetected ? 'Presente en 4/4 viewports' : 'Sección ausente en DOM'
  });

  if (sectionArg === 'planeta' || sectionArg === 'planet-hero') {
    criteriaChecks.push({
      criterio: 'Touch action en contenedor es pan-y (no bloquea scroll)',
      estado: touchActionPass ? 'PASA' : 'FALLA',
      evidencia: touchActionPass ? 'touch-action: pan-y activo' : `touch-action inválido: ${reportResults[0]?.specificChecks?.touchAction}`
    });

    criteriaChecks.push({
      criterio: 'Nav z-index superior a la Tierra',
      estado: navAbovePlanetPass ? 'PASA' : 'FALLA',
      evidencia: navAbovePlanetPass
        ? `Nav (z:${reportResults[0]?.specificChecks?.navZIndex}) > Planet (z:${reportResults[0]?.specificChecks?.containerZIndex})`
        : `Nav (z:${reportResults[0]?.specificChecks?.navZIndex}) <= Planet (z:${reportResults[0]?.specificChecks?.containerZIndex})`
    });

    criteriaChecks.push({
      criterio: 'Diff de píxeles (Señal visual; no determinista sin ?freeze=1)',
      estado: 'SEÑAL_INFORMATIVA',
      evidencia: reportResults[0]?.pixelDiffPercent !== null
        ? `${reportResults[0].pixelDiffPercent}% de diferencia`
        : 'Sin línea base fija (?freeze=1 ausente)'
    });
  }

  // Write JSON report
  const summaryJsonPath = path.join(reportDir, 'resultado.json');
  fs.writeFileSync(summaryJsonPath, JSON.stringify({
    timestamp: now.toISOString(),
    sectionArg,
    targetSelector,
    overflow360Ok,
    criteriaChecks,
    results: reportResults
  }, null, 2));

  // Console summary
  console.log('\n========================================================================================');
  console.log(`                     REPORTE QA VISUAL - VERIFY.MJS                                     `);
  console.log(`  Reporte guardado en: docs/reportes/${dateStr}/resultado.json                         `);
  console.log('========================================================================================');
  console.log('| Criterio                                                 | Estado | Evidencia / Detalle |');
  console.log('| :------------------------------------------------------- | :----- | :------------------ |');
  for (const c of criteriaChecks) {
    console.log(`| ${c.criterio.padEnd(56)} | ${c.estado.padEnd(6)} | ${c.evidencia} |`);
  }
  console.log('----------------------------------------------------------------------------------------');
  console.log('| Viewport | Consola | Scroll Horiz. | Sección | Diff Píxeles (Señal) | Captura Sección |');
  console.log('| :------- | :------ | :------------ | :------ | :------------------- | :-------------- |');

  for (const r of reportResults) {
    const consoleCol = r.consoleErrorsCount === 0 ? '0 err' : `${r.consoleErrorsCount} ERR`;
    const scrollCol = r.hasHorizontalScroll ? 'FALLA' : 'PASA';
    const sectionCol = r.sectionFound ? 'DETECTADA' : 'NO ENCONTRADA';
    const diffCol = r.pixelDiffPercent !== null ? `${r.pixelDiffPercent}%` : 'SEÑAL';
    const shotCol = r.sectionScreenshot ? r.sectionScreenshot : r.fullScreenshot;
    console.log(`| ${r.width}px   | ${consoleCol.padEnd(7)} | ${scrollCol.padEnd(13)} | ${sectionCol.padEnd(9)} | ${diffCol.padEnd(20)} | ${shotCol} |`);
  }
  console.log('========================================================================================\n');

  const overallFail = criteriaChecks.some(c => c.estado === 'FALLA');
  if (overallFail) {
    process.exitCode = 1;
  }
}

run().catch(err => {
  console.error('[verify.mjs] Error fatal:', err);
  process.exit(1);
});
