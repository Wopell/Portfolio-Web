import { chromium } from 'playwright';

async function run() {
  console.log('--- TEST FASE 3: ROTACIÓN CÍCLICA DE PREVIEWS (10s) ---');
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
  await page.waitForTimeout(500);

  // 1. Hover sobre Carpeta 0 (ANIMATION)
  const folder0 = page.locator('[data-testid="folder-0"]');
  const box = await folder0.boundingBox();
  if (!box) throw new Error('No se encontró folder 0');

  console.log('1. Moviendo cursor sobre Carpeta 0...');
  await page.mouse.move(box.x + box.width / 2, box.y + 20);
  await page.waitForTimeout(200); // 80ms debounce

  // 2. Verificar presencia de indicador numérico en el DOM
  const indicator = page.locator('[data-testid="preview-pagination-indicator"]');
  const isIndicatorVisible = await indicator.isVisible();
  const indicatorTextInitial = await indicator.textContent();
  console.log(`2. Indicador en DOM: ${isIndicatorVisible ? 'VISIBLE' : 'NO VISIBLE'} ("${indicatorTextInitial?.trim()}")`);

  // 3. Obtener src inicial
  const previewImg = page.locator('[data-testid="preview-image-category-animation"]');
  const initialSrc = await previewImg.getAttribute('src');
  console.log(`3. Src inicial de Carpeta 0: ${initialSrc}`);

  // 4. Esperar 10.5 segundos para la rotación cíclica
  console.log('4. Esperando 10.5 segundos para rotación cíclica...');
  await page.waitForTimeout(10500);

  const rotatedSrc = await previewImg.getAttribute('src');
  const indicatorTextAfter = await indicator.textContent();
  console.log(`5. Src tras 10.5s: ${rotatedSrc}`);
  console.log(`6. Indicador tras rotación: "${indicatorTextAfter?.trim()}"`);

  const srcChanged = rotatedSrc !== initialSrc || indicatorTextAfter?.trim() !== indicatorTextInitial?.trim();
  console.log(`7. ¿Cambió el preview? ${srcChanged ? 'SÍ (PASA)' : 'NO (FALLA)'}`);

  // 8. Pausa al salir el cursor: Mover cursor fuera
  console.log('8. Moviendo cursor fuera de la baraja...');
  await page.mouse.move(10, 10);
  await page.waitForTimeout(300);

  const indicatorAfterLeave = await indicator.isVisible();
  console.log(`9. Indicador tras salir: ${indicatorAfterLeave ? 'AÚN VISIBLE (FALLA)' : 'OCULTO (PASA)'}`);

  // 10. Verificación de consola limpia
  console.log(`10. Errores de consola: ${consoleErrors.length}`);

  await browser.close();

  const success = srcChanged && !indicatorAfterLeave && consoleErrors.length === 0;
  console.log(success ? '>>> FASE 3 TEST: PASA <<<' : '>>> FASE 3 TEST: FALLA <<<');
  process.exit(success ? 0 : 1);
}

run().catch((err) => {
  console.error('Error en test Fase 3:', err);
  process.exit(1);
});
