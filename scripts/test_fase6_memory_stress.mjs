import { chromium } from 'playwright';

async function testMemoryStress20x() {
  console.log('--- TEST FASE 6: ESTRÉS DE MEMORIA (20x APERTURAS / CIERRES) ---');
  const browser = await chromium.launch({
    headless: true,
    args: ['--js-flags=--expose-gc'],
  });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.goto('http://127.0.0.1:5173/works', { waitUntil: 'domcontentloaded' });
  // Esperar a que el WebGL de la Tierra y las texturas iniciales terminen de allocar en el heap
  await page.waitForTimeout(2500);

  const section = page.locator('#selected-projects');
  await section.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  const folder1 = page.locator('[data-testid="folder-1"]');

  // Ciclo de warmup para cargar chunks y módulos en memoria
  console.log('Ejecutando ciclo de warmup...');
  await folder1.hover({ position: { x: 120, y: 15 } });
  await page.waitForTimeout(100);
  await folder1.click({ position: { x: 120, y: 15 } });
  await page.waitForTimeout(200);
  await page.keyboard.press('Escape');
  await page.mouse.move(10, 10);
  await page.waitForTimeout(500);

  const client = await page.context().newCDPSession(page);
  await client.send('Performance.enable');

  // Forzar GC inicial y medir heap base estabilizado
  await page.evaluate(() => {
    if (window.gc) window.gc();
  });
  try {
    await client.send('HeapProfiler.collectGarbage');
  } catch (e) {}
  await page.waitForTimeout(600);

  const metricsInitial = await client.send('Performance.getMetrics');
  const heapInitial = metricsInitial.metrics.find((m) => m.name === 'JSHeapUsedSize')?.value || 0;
  console.log(`Heap base estabilizado: ${(heapInitial / (1024 * 1024)).toFixed(2)} MB`);

  console.log('Ejecutando 20 ciclos de apertura y cierre...');
  for (let i = 1; i <= 20; i++) {
    // 1. Hover sobre Carpeta 1
    await folder1.hover({ position: { x: 120, y: 15 } });
    await page.waitForTimeout(100);

    // 2. Click para abrir modal
    await folder1.click({ position: { x: 120, y: 15 } });
    await page.waitForTimeout(180);

    // 3. Cerrar con Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(180);

    if (i % 5 === 0) {
      console.log(`  Ciclo ${i}/20 completado.`);
    }
  }

  // Mover mouse fuera
  await page.mouse.move(10, 10);
  await page.waitForTimeout(500);

  // Forzar GC final y medir heap
  await page.evaluate(() => {
    if (window.gc) window.gc();
  });
  try {
    await client.send('HeapProfiler.collectGarbage');
  } catch (e) {}
  await page.waitForTimeout(600);

  const metricsFinal = await client.send('Performance.getMetrics');
  const heapFinal = metricsFinal.metrics.find((m) => m.name === 'JSHeapUsedSize')?.value || 0;
  console.log(`Heap final post-20x: ${(heapFinal / (1024 * 1024)).toFixed(2)} MB`);

  const deltaBytes = heapFinal - heapInitial;
  const deltaPct = heapInitial > 0 ? (deltaBytes / heapInitial) * 100 : 0;
  console.log(`Delta de Heap: ${deltaPct.toFixed(2)}% (${(deltaBytes / (1024 * 1024)).toFixed(2)} MB)`);

  const memoryPassed = deltaPct < 15.0;
  console.log(`- Prueba de estrés de memoria (Delta < 15%): ${memoryPassed ? 'PASA' : 'FALLA'}`);
  console.log(`- Errores de consola: ${consoleErrors.length}`);

  await browser.close();

  const success = memoryPassed && consoleErrors.length === 0;
  console.log(success ? '\n>>> TEST FASE 6 MEMORIA: PASA <<<' : '\n>>> TEST FASE 6 MEMORIA: FALLA <<<');
  process.exit(success ? 0 : 1);
}

testMemoryStress20x().catch((err) => {
  console.error('Error en test de estrés de memoria:', err);
  process.exit(1);
});
