import sharp from 'sharp';
import fs from 'fs';

if (!fs.existsSync('public/previews')) {
  fs.mkdirSync('public/previews', { recursive: true });
}

// 1. Work 1: Chibi avatar / illustration
if (fs.existsSync('public/ref/chibi_avatar_clean.png')) {
  await sharp('public/ref/chibi_avatar_clean.png')
    .resize(400, 400, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 90 })
    .toFile('public/previews/work-1.jpg');
} else {
  // Gradient fallback
  const svg = `<svg width="400" height="400"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#2F6F6B"/><stop offset="100%" stop-color="#E2847A"/></linearGradient></defs><rect width="400" height="400" fill="url(#g1)"/><circle cx="200" cy="200" r="100" fill="#ffffff" opacity="0.3"/></svg>`;
  await sharp(Buffer.from(svg)).jpeg().toFile('public/previews/work-1.jpg');
}

// 2. Work 2: Dramatic Cinematic Portrait / 3D Art
if (fs.existsSync('public/ref/portrait_circle.png')) {
  await sharp('public/ref/portrait_circle.png')
    .resize(400, 400, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 90 })
    .toFile('public/previews/work-2.jpg');
} else {
  const svg = `<svg width="400" height="400"><defs><linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1E293B"/><stop offset="100%" stop-color="#475569"/></linearGradient></defs><rect width="400" height="400" fill="url(#g2)"/><circle cx="200" cy="200" r="120" fill="#2F6F6B" opacity="0.4"/></svg>`;
  await sharp(Buffer.from(svg)).jpeg().toFile('public/previews/work-2.jpg');
}

// 3. Work 3: Anime Character Sketch
if (fs.existsSync('public/ref/right_circle.png')) {
  await sharp('public/ref/right_circle.png')
    .resize(400, 400, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 90 })
    .toFile('public/previews/work-3.jpg');
} else {
  const svg = `<svg width="400" height="400"><defs><linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#0F766E"/><stop offset="100%" stop-color="#F59E0B"/></linearGradient></defs><rect width="400" height="400" fill="url(#g3)"/><circle cx="200" cy="200" r="80" fill="#ffffff" opacity="0.25"/></svg>`;
  await sharp(Buffer.from(svg)).jpeg().toFile('public/previews/work-3.jpg');
}

// 4. Work 4: Post Production / Editorial Artwork
if (fs.existsSync('public/ref/tomy_vintage_card.png')) {
  await sharp('public/ref/tomy_vintage_card.png')
    .resize(400, 400, { fit: 'cover', position: 'top' })
    .jpeg({ quality: 90 })
    .toFile('public/previews/work-4.jpg');
} else {
  const svg = `<svg width="400" height="400"><defs><linearGradient id="g4" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#3B82F6"/><stop offset="100%" stop-color="#1E1B4B"/></linearGradient></defs><rect width="400" height="400" fill="url(#g4)"/><circle cx="200" cy="200" r="90" fill="#2F6F6B" opacity="0.5"/></svg>`;
  await sharp(Buffer.from(svg)).jpeg().toFile('public/previews/work-4.jpg');
}

console.log('Previews generated in public/previews/');
