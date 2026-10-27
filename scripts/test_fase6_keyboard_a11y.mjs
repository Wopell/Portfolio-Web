import { chromium } from 'playwright';

async function testKeyboardA11y() {
  console.log('--- TEST FASE 6: ACCESIBILIDAD Y TECLADO (TAB / ENTER / ESCAPE) ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.goto('http://127.0.0.1:5173/works', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  const section = page.locator('#selected-projects');
  await section.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);

  // 1. Navegar por teclado hasta la carpeta 0
  const folder0 = page.locator('[data-testid="folder-0"]');
  await folder0.focus();
  await page.waitForTimeout(200);

  // Verificar que el foco active la carpeta (equivalencia con hover en Fase 2)
  const isElevated = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="folder-0"]');
    const transform = window.getComputedStyle(el).transform;
    const zIndex = window.getComputedStyle(el).zIndex;
    return zIndex === '60' || transform.includes('matrix');
  });
  console.log(`1. Foco por teclado en Carpeta 0 la eleva: ${isElevated ? 'PASA' : 'FALLA'}`);

  // 2. Presionar Enter para abrir modal (Fase 4 por teclado)
  console.log('2. Presionando Enter para abrir modal...');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);

  const modalOpened = await page.evaluate(() => document.querySelector('div[role="dialog"]') !== null);
  console.log(`- Modal abierto con Enter: ${modalOpened ? 'PASA' : 'FALLA'}`);

  // 3. Verificar Focus Trap con Tab y Shift+Tab
  const activeInsideModal = await page.evaluate(() => {
    const modal = document.querySelector('div[role="dialog"]');
    return modal ? modal.contains(document.activeElement) : false;
  });
  console.log(`- Foco atrapado en modal inicial: ${activeInsideModal ? 'PASA' : 'FALLA'}`);

  await page.keyboard.press('Tab');
  await page.waitForTimeout(100);
  const activeAfterTab = await page.evaluate(() => {
    const modal = document.querySelector('div[role="dialog"]');
    return modal ? modal.contains(document.activeElement) : false;
  });
  console.log(`- Foco retenido tras Tab: ${activeAfterTab ? 'PASA' : 'FALLA'}`);

  await page.keyboard.press('Shift+Tab');
  await page.waitForTimeout(100);
  const activeAfterShiftTab = await page.evaluate(() => {
    const modal = document.querySelector('div[role="dialog"]');
    return modal ? modal.contains(document.activeElement) : false;
  });
  console.log(`- Foco retenido tras Shift+Tab: ${activeAfterShiftTab ? 'PASA' : 'FALLA'}`);

  // 4. Presionar Escape para cerrar modal (Fase 5 por teclado)
  console.log('3. Presionando Escape para cerrar modal...');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  const modalClosed = await page.evaluate(() => document.querySelector('div[role="dialog"]') === null);
  console.log(`- Modal cerrado con Escape: ${modalClosed ? 'PASA' : 'FALLA'}`);

  // 5. Verificar que el foco volvió a la carpeta 0
  const focusReturned = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="folder-0"]');
    return document.activeElement === el;
  });
  console.log(`- Foco retornado a Carpeta 0: ${focusReturned ? 'PASA' : 'FALLA'}`);

  console.log(`\nErrores de consola: ${consoleErrors.length}`);

  await browser.close();

  const success = isElevated && modalOpened && activeInsideModal && activeAfterTab && activeAfterShiftTab && modalClosed && focusReturned && consoleErrors.length === 0;
  console.log(success ? '\n>>> TEST FASE 6 KEYBOARD A11Y: PASA <<<' : '\n>>> TEST FASE 6 KEYBOARD A11Y: FALLA <<<');
  process.exit(success ? 0 : 1);
}

testKeyboardA11y().catch((err) => {
  console.error('Error en test keyboard a11y:', err);
  process.exit(1);
});
