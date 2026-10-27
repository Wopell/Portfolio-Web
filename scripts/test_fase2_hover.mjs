import { chromium } from 'playwright';

async function testPhase2Hover() {
  console.log('--- TEST FASE 2: HOVER 3D Y COMPACTACIÓN ---');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://127.0.0.1:5173/works', { waitUntil: 'networkidle' });

  const folders = await page.$$('div[aria-label^="Carpeta "]');
  await folders[0].scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);

  // 1. Hover sobre Carpeta 001
  console.log('1. Hover sobre Carpeta 001 (Animation)...');
  const box0 = await folders[0].boundingBox();
  await page.mouse.move(box0.x + 50, box0.y + 15);
  await page.waitForTimeout(500);

  const state1 = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('div[aria-label^="Carpeta "]')).map((el, i) => ({
      folder: i + 1,
      top: window.getComputedStyle(el).top,
      zIndex: window.getComputedStyle(el).zIndex,
      transform: window.getComputedStyle(el).transform,
      cardHeight: window.getComputedStyle(el.querySelector('div[style*="height"]')).height
    }));
  });
  console.log('Resultado Hover 001:', state1);
  await page.screenshot({ path: 'docs/reportes/evidencia_hover_001.png' });

  // 2. Mover fuera para reposo
  console.log('\n2. Reposo...');
  await page.mouse.move(100, 100);
  await page.waitForTimeout(500);

  // 3. Hover sobre Carpeta 002
  console.log('\n3. Hover sobre Carpeta 002 (3D Art)...');
  const freshFolders = await page.$$('div[aria-label^="Carpeta "]');
  const box1 = await freshFolders[1].boundingBox();
  // Tab 002 está en tabLeft: 72px -> click en x + 120, y + 15
  await page.mouse.move(box1.x + 120, box1.y + 15);
  await page.waitForTimeout(500);

  const state2 = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('div[aria-label^="Carpeta "]')).map((el, i) => ({
      folder: i + 1,
      top: window.getComputedStyle(el).top,
      zIndex: window.getComputedStyle(el).zIndex,
      transform: window.getComputedStyle(el).transform,
      cardHeight: window.getComputedStyle(el.querySelector('div[style*="height"]')).height
    }));
  });
  console.log('Resultado Hover 002:', state2);
  await page.screenshot({ path: 'docs/reportes/evidencia_hover_002.png' });

  await browser.close();
}

testPhase2Hover().catch(err => {
  console.error(err);
  process.exit(1);
});
