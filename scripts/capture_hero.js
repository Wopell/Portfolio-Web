// Temporary script to capture hero section screenshots using puppeteer-core
// Usage: node scripts/capture_hero.js <width> <height> <outputFile>
// Example: node scripts/capture_hero.js 1440 900 hero_1440.png

import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';

async function capture(width, height, outFile) {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-gpu',
      `--window-size=${width},${height}`,
    ],
  });
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.goto('http://127.0.0.1:5173/works', { waitUntil: 'networkidle0' });
  // wait a bit for fonts to load
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: outFile, fullPage: true });
  await browser.close();
}

const args = process.argv.slice(2);
if (args.length !== 3) {
  console.error('Usage: node capture_hero.js <width> <height> <outputFile>');
  process.exit(1);
}
const [w, h, file] = args;
capture(parseInt(w, 10), parseInt(h, 10), path.resolve(file))
  .catch(err => {
    console.error('Capture error:', err);
    process.exit(1);
  });
