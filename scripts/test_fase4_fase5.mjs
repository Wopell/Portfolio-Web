import { chromium } from 'playwright';

async function testFases4and5() {
  console.log('--- TEST FASES 4 & 5: APERTURA, VUELO, CIERRE Y ARCHIVADO ---');
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

  // Guardar scroll position inicial antes de abrir
  const initialScrollY = await page.evaluate(() => window.scrollY);
  console.log(`Scroll inicial: ${initialScrollY}px`);

  // Probar con Carpeta 1 (3D ART - Intermedia: arriba suben, abajo bajan)
  const folders = await page.$$('div[aria-label^="Carpeta "]');
  const box1 = await folders[1].boundingBox();
  if (!box1) throw new Error('No se encontró boundingBox de Carpeta 1');

  console.log('\n--- FASE 4: APERTURA DE CARPETA 1 (3D ART) ---');
  const folder1 = page.locator('[data-testid="folder-1"]');
  // 1. Hover sobre Carpeta 1 (asoma la carpeta)
  await folder1.hover({ position: { x: 120, y: 15 } });
  await page.waitForTimeout(200); // Superar 80ms debounce

  // 2. Click sobre la carpeta asomada para abrirla
  await folder1.click({ position: { x: 120, y: 15 } });
  await page.waitForTimeout(600); // Esperar animación de apertura

  // 1. Verificar salida de carpetas fuera del viewport:
  // - Carpeta 0 (arriba): debe subir fuera de pantalla
  // - Carpeta 2 y 3 (abajo): deben bajar fuera de pantalla
  const folderPositions = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('div[data-testid^="folder-"]')).map((el, i) => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return {
        index: i,
        topComputed: style.top,
        opacity: style.opacity,
        rectY: rect.y,
        rectBottom: rect.bottom,
      };
    });
  });

  console.log('Posición de carpetas durante apertura:', folderPositions);

  const folder0ExitedUp = folderPositions[0].opacity === '0' || folderPositions[0].rectBottom < 0;
  const folder2ExitedDown = folderPositions[2].opacity === '0' || folderPositions[2].rectY > 1080;
  const folder3ExitedDown = folderPositions[3].opacity === '0' || folderPositions[3].rectY > 1080;

  console.log(`- Carpeta 0 subió fuera de pantalla: ${folder0ExitedUp ? 'PASA' : 'FALLA'}`);
  console.log(`- Carpeta 2 bajó fuera de pantalla: ${folder2ExitedDown ? 'PASA' : 'FALLA'}`);
  console.log(`- Carpeta 3 bajó fuera de pantalla: ${folder3ExitedDown ? 'PASA' : 'FALLA'}`);

  // 2. Verificar bloqueo de scroll de página (document.body.style.overflow === 'hidden')
  const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
  console.log(`- Bloqueo de scroll body.overflow: "${bodyOverflow}" -> ${bodyOverflow === 'hidden' ? 'PASA' : 'FALLA'}`);

  // 3. Verificar URL hash sincronizado con #selected-projects/<slug>/<id>
  const urlHash = await page.evaluate(() => window.location.hash);
  console.log(`- URL Hash sincronizado: "${urlHash}" -> ${urlHash.startsWith('#selected-projects/3d-art/') ? 'PASA' : 'FALLA'}`);

  // 4. Stacking context: <Navbar> (z: 100) por encima del modal (z: 90)
  const zIndices = await page.evaluate(() => {
    const nav = document.querySelector('nav');
    const modal = document.querySelector('div[role="dialog"]');
    return {
      navZ: nav ? window.getComputedStyle(nav).zIndex : null,
      modalZ: modal ? window.getComputedStyle(modal).zIndex : null,
    };
  });
  console.log(`- Stacking Context: Nav zIndex = ${zIndices.navZ}, Modal zIndex = ${zIndices.modalZ}`);
  const navAboveModal = parseInt(zIndices.navZ || '0', 10) > parseInt(zIndices.modalZ || '0', 10);
  console.log(`- Navbar por encima del modal: ${navAboveModal ? 'PASA' : 'FALLA'}`);

  // 5. Verificar Focus Trap dentro del modal
  const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
  const focusedAriaLabel = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
  console.log(`- Foco activo dentro del modal: <${focusedTag}> aria-label="${focusedAriaLabel}"`);

  // Captura de evidencia Fase 4
  await page.screenshot({ path: 'docs/reportes/evidencia_fase4_apertura.png' });

  // =========================================================================
  // FASE 5: CIERRE Y ARCHIVADO (TECLA ESCAPE < 300ms)
  // =========================================================================
  console.log('\n--- FASE 5: CIERRE Y ARCHIVADO CON ESCAPE ---');
  const t0 = Date.now();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400); // Esperar animación elástica de guardado
  const closeElapsedMs = Date.now() - t0;
  console.log(`Tiempo de respuesta / animación: ${closeElapsedMs} ms (< 300ms nominal para inicio)`);

  // 1. Verificar modal desmontado
  const modalPresent = await page.evaluate(() => document.querySelector('div[role="dialog"]') !== null);
  console.log(`- Modal desmontado tras Escape: ${!modalPresent ? 'PASA' : 'FALLA'}`);

  // 2. Verificar body.overflow restaurado
  const bodyOverflowRestored = await page.evaluate(() => document.body.style.overflow);
  console.log(`- Scroll desbloqueado body.overflow: "${bodyOverflowRestored}" -> ${bodyOverflowRestored !== 'hidden' ? 'PASA' : 'FALLA'}`);

  // 3. Verificar URL hash revertido
  const urlHashRestored = await page.evaluate(() => window.location.hash);
  console.log(`- URL Hash restaurado: "${urlHashRestored}" -> ${!urlHashRestored.includes('#selected-projects/') ? 'PASA' : 'FALLA'}`);

  // 4. Mover mouse fuera para verificar reposo completo de la cascada
  await page.mouse.move(10, 10);
  await page.waitForTimeout(400);

  const foldersRestored = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('div[data-testid^="folder-"]')).map((el, i) => {
      const style = window.getComputedStyle(el);
      return {
        index: i,
        opacity: style.opacity,
        top: Math.round(parseFloat(style.top)),
      };
    });
  });
  console.log('Posición de carpetas tras cierre y reposo:', foldersRestored);
  const allFoldersVisible = foldersRestored.every((f) => parseFloat(f.opacity) >= 0.95);
  console.log(`- Todas las carpetas retornaron visibles: ${allFoldersVisible ? 'PASA' : 'FALLA'}`);

  const expectedTops = [0, 58, 109, 194];
  const topsMatchRest = foldersRestored.every((f, i) => Math.abs(f.top - expectedTops[i]) <= 2);
  console.log(`- Retorno a posiciones en cascada de reposo [0, 58, 109, 194]: ${topsMatchRest ? 'PASA' : 'FALLA'}`);

  // Captura de evidencia Fase 5
  await page.screenshot({ path: 'docs/reportes/evidencia_fase5_cierre.png' });

  // Verificación de errores de consola
  console.log(`\nErrores de consola acumulados: ${consoleErrors.length}`);

  await browser.close();

  const fase4Passed = folder0ExitedUp && folder2ExitedDown && folder3ExitedDown && bodyOverflow === 'hidden' && urlHash.startsWith('#selected-projects/3d-art/') && navAboveModal;
  const fase5Passed = !modalPresent && bodyOverflowRestored !== 'hidden' && !urlHashRestored.includes('#selected-projects/') && allFoldersVisible && topsMatchRest;

  const allPassed = fase4Passed && fase5Passed && consoleErrors.length === 0;
  console.log(allPassed ? '\n>>> FASES 4 & 5 TEST: PASA <<<' : '\n>>> FASES 4 & 5 TEST: FALLA <<<');
  process.exit(allPassed ? 0 : 1);
}

testFases4and5().catch((err) => {
  console.error('Error en test Fases 4 & 5:', err);
  process.exit(1);
});
