import fs from 'node:fs';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

async function alignAndDiff() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  await page.goto('http://127.0.0.1:5173/works', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Ocultar la barra fija de navegación para comparar exclusivamente la sección de diseño
  await page.evaluate(() => {
    const nav = document.querySelector('nav');
    if (nav) nav.style.display = 'none';
  });

  // Encontrar la posición exacta de '#selected-projects'
  const section = page.locator('#selected-projects');
  await section.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);

  // Obtener la posición del título h2 'SELECTED PROJECTS' en la página
  const titleBox = await page.locator('#selected-projects h2').boundingBox();
  console.log('Title bounding box:', titleBox);

  // En la referencia, el top del h2 está en y = 51px (centro en y = 74.5px) para que Tab 1 quede en y = 156px
  const scrollOffset = await page.evaluate(() => {
    const title = document.querySelector('#selected-projects h2');
    const rect = title.getBoundingClientRect();
    const currentScrollY = window.scrollY;
    const targetScrollY = currentScrollY + rect.y - 51;
    window.scrollTo(0, targetScrollY);
    return { targetScrollY, currentScrollY, rectY: rect.y };
  });
  console.log('Scroll ajustado:', scrollOffset);
  await page.waitForTimeout(500);

  // Captura exacta de 1920x800
  const capturePath = 'docs/reportes/test_aligned_1920x800.png';
  await page.screenshot({
    path: capturePath,
    clip: { x: 0, y: 0, width: 1920, height: 800 }
  });
  console.log('Captura guardada en:', capturePath);

  // Comparar con docs/referencias/aprobados/referencia_carpetas_1920px.png
  const refPath = 'docs/referencias/aprobados/referencia_carpetas_1920px.png';
  const imgCurrent = PNG.sync.read(fs.readFileSync(capturePath));
  const imgRef = PNG.sync.read(fs.readFileSync(refPath));

  const diff = new PNG({ width: 1920, height: 800 });
  const diffPixels = pixelmatch(
    imgCurrent.data,
    imgRef.data,
    diff.data,
    1920,
    800,
    { threshold: 0.15 }
  );

  const diffPct = ((diffPixels / (1920 * 800)) * 100).toFixed(2);
  const diffPath = 'docs/reportes/test_diff_1920x800.png';
  fs.writeFileSync(diffPath, PNG.sync.write(diff));
  console.log(`Diff de píxeles: ${diffPct}% (${diffPixels} píxeles diferentes). Guardado en ${diffPath}`);

  await browser.close();
}

alignAndDiff().catch(err => {
  console.error('Error en alignAndDiff:', err);
  process.exit(1);
});
