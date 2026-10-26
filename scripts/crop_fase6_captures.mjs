import sharp from 'sharp';
import path from 'path';

const outDir = 'C:/Users/Tomyp/.gemini/antigravity/brain/863dbce5-1730-4fcc-83dc-6561cdd72ad6';

async function cropAll() {
  const pointsFiles = [
    { src: 'desktop_points_18000.png', out: 'crop_points_18000.png' },
    { src: 'desktop_points_14000.png', out: 'crop_points_14000.png' },
    { src: 'desktop_points_12000.png', out: 'crop_points_12000.png' },
    { src: 'desktop_points_9000.png', out: 'crop_points_9000.png' },
    { src: 'active_wave_debug.png', out: 'crop_active_wave.png' },
  ];

  for (const item of pointsFiles) {
    // Crop planet circle area
    await sharp(path.join(outDir, item.src))
      .extract({ left: 360, top: 130, width: 720, height: 720 })
      .toFile(path.join(outDir, item.out));
    console.log(`Cropped ${item.out}`);
  }

  // Crop HUD from active_wave_debug.png and hud_desktop_normal.png
  await sharp(path.join(outDir, 'active_wave_debug.png'))
    .extract({ left: 290, top: 120, width: 360, height: 150 })
    .toFile(path.join(outDir, 'crop_hud_active_wave.png'));
  console.log('Cropped crop_hud_active_wave.png');

  await sharp(path.join(outDir, 'hud_desktop_normal.png'))
    .extract({ left: 290, top: 120, width: 360, height: 150 })
    .toFile(path.join(outDir, 'crop_hud_normal.png'));
  console.log('Cropped crop_hud_normal.png');
}

cropAll();
