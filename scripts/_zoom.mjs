import sharp from 'sharp';
const [,, src, out, l, t, w, h, scale] = process.argv;
await sharp(src).extract({ left: +l, top: +t, width: +w, height: +h })
  .resize(Math.round(+w * +scale), Math.round(+h * +scale), { kernel: 'nearest' })
  .png().toFile(out);
