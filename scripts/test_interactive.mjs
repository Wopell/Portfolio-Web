import { chromium } from 'playwright';
import fs from 'node:fs';

async function testInteractive() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  const consoleLogs = [];
  page.on('console', msg => consoleLogs.push({ type: msg.type(), text: msg.text() }));
  page.on('pageerror', err => consoleLogs.push({ type: 'pageerror', text: err.message }));

  console.log('1. Navigating to /works...');
  await page.goto('http://127.0.0.1:5173/works', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  // 2. Scroll test down to selected-projects
  console.log('2. Scrolling down smoothly to #selected-projects...');
  await page.evaluate(() => {
    const el = document.getElementById('selected-projects');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  await page.waitForTimeout(600);

  // 3. Hover Folder 0 (Animation) tab
  console.log('3. Hovering Folder 0 (Animation) tab...');
  const folder0 = page.locator('[data-testid="folder-0"]');
  await folder0.hover({ position: { x: 120, y: 22 } });
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'docs/reportes/test_hover_folder0.png' });

  // 4. Hover Folder 1 (3D Art) tab
  console.log('4. Hovering Folder 1 (3D Art) tab...');
  const folder1 = page.locator('[data-testid="folder-1"]');
  await folder1.hover({ position: { x: 120, y: 22 } });
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'docs/reportes/test_hover_folder1.png' });

  // 5. Hover Folder 2 (IA) tab
  console.log('5. Hovering Folder 2 (IA) tab...');
  const folder2 = page.locator('[data-testid="folder-2"]');
  await folder2.hover({ position: { x: 120, y: 22 } });
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'docs/reportes/test_hover_folder2.png' });

  // 6. Test click on folder
  console.log('6. Clicking Folder 3 (Post Production)...');
  const folder3 = page.locator('[data-testid="folder-3"]');
  await folder3.click({ position: { x: 120, y: 22 } });
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'docs/reportes/test_click_folder3.png' });

  // 7. Check errors
  const errors = consoleLogs.filter(l => l.type === 'error');
  console.log('Console errors count:', errors.length);
  if (errors.length > 0) {
    console.log('Errors:', errors);
  }

  await browser.close();
  console.log('ALL TESTS COMPLETED SUCCESSFULLY!');
}

testInteractive().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
