import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const aprobadosDir = path.join(rootDir, 'docs', 'referencias', 'aprobados');
fs.mkdirSync(aprobadosDir, { recursive: true });

const targetWidths = [1920, 1440, 768, 390, 360];

async function captureSignals() {
  console.log('--- CAPTURA DE SEÑALES VISUALES PARA CARPETAS ---');
  const browser = await chromium.launch({ headless: true });

  for (const width of targetWidths) {
    const height = width >= 1024 ? 1000 : (width >= 768 ? 1024 : 844);
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 1
    });

    const page = await context.newPage();
    const targetUrl = 'http://127.0.0.1:5173/works';
    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    const destPath = path.join(aprobadosDir, `senal_carpetas_${width}px.png`);

    if (width === 1920) {
      // Ocultar nav fija y alinear h2 en y=51px para máxima consistencia
      await page.evaluate(() => {
        const nav = document.querySelector('nav');
        if (nav) nav.style.display = 'none';
      });

      await page.evaluate(() => {
        const h2 = document.querySelector('#selected-projects h2');
        if (h2) {
          const rect = h2.getBoundingClientRect();
          const targetScrollY = window.scrollY + rect.y - 51;
          window.scrollTo(0, targetScrollY);
        }
      });
      await page.waitForTimeout(400);

      await page.screenshot({
        path: destPath,
        clip: { x: 0, y: 0, width: 1920, height: 800 }
      });
      console.log(`[1920px] Guardado en: ${destPath} (1920x800 clip)`);
    } else {
      const element = await page.$('#selected-projects');
      if (element) {
        await element.scrollIntoViewIfNeeded();
        await page.waitForTimeout(300);
        await element.screenshot({ path: destPath });
        console.log(`[${width}px] Guardado en: ${destPath} (elemento #selected-projects)`);
      } else {
        console.error(`[${width}px] Elemento #selected-projects no encontrado!`);
      }
    }

    await context.close();
  }

  await browser.close();
  console.log('--- TODAS LAS SEÑALES CAPTURADAS CON ÉXITO ---');
}

captureSignals().catch(err => {
  console.error('Error al capturar señales:', err);
  process.exit(1);
});
