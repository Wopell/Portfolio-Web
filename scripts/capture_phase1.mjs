import { execFileSync } from 'child_process';
import sharp from 'sharp';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const fullScreenshotPath = path.resolve('public/phase1_screenshot_live.png');
const artifactCropPath = 'C:/Users/Tomyp/.gemini/antigravity/brain/863dbce5-1730-4fcc-83dc-6561cdd72ad6/phase1_live_crop.png';
const artifactFullPath = 'C:/Users/Tomyp/.gemini/antigravity/brain/863dbce5-1730-4fcc-83dc-6561cdd72ad6/phase1_live_full.png';

console.log('Capturing screenshot with Chrome headless...');
execFileSync(chromePath, [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--screenshot=' + fullScreenshotPath,
  '--window-size=1280,1250',
  '--virtual-time-budget=4000',
  'http://127.0.0.1:5173/works'
]);

console.log('Screenshot captured. Cropping hero area...');
const image = sharp(fullScreenshotPath);
const metadata = await image.metadata();
console.log('Image dimensions:', metadata.width, metadata.height);

// Crop top hero area (0 to ~1060px down)
await image
  .clone()
  .extract({ left: 100, top: 0, width: 1080, height: 1060 })
  .toFile(artifactCropPath);

await image
  .toFile(artifactFullPath);

console.log('Crop saved to:', artifactCropPath);
