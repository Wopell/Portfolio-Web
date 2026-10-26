import sharp from 'sharp';

const dir = 'C:/Users/Tomyp/.gemini/antigravity/brain/863dbce5-1730-4fcc-83dc-6561cdd72ad6';

// Resize each frame to 600x515
const f0 = await sharp(`${dir}/orbit_t0.png`).resize(600, 515).toBuffer();
const f6 = await sharp(`${dir}/orbit_t6.png`).resize(600, 515).toBuffer();
const f14 = await sharp(`${dir}/orbit_t14.png`).resize(600, 515).toBuffer();
const f22 = await sharp(`${dir}/orbit_t22.png`).resize(600, 515).toBuffer();

await sharp({
  create: {
    width: 1220,
    height: 1050,
    channels: 4,
    background: '#EAE6DC'
  }
})
.composite([
  { input: f0, left: 10, top: 10 },
  { input: f6, left: 620, top: 10 },
  { input: f14, left: 10, top: 535 },
  { input: f22, left: 620, top: 535 },
])
.png()
.toFile(`${dir}/phase3_orbit_composite.png`);

console.log('Saved phase3_orbit_composite.png');
