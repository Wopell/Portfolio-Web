import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

/**
 * Script de pre-procesamiento para generar versiones ultra-ligeras y pre-desenfocadas
 * de imágenes para el efecto de glassmorphism sin costo de cálculo en el navegador.
 *
 * Configuración:
 * - Ancho: 48px (escalable por CSS a cualquier tamaño de tarjeta)
 * - Blur radio: 2
 * - Formato: WebP
 * - Calidad: 60
 */

const inputDir = process.argv[2] || path.resolve('public/landscapes');
const outputDir = process.argv[3] || inputDir;

if (!fs.existsSync(inputDir)) {
  console.error(`Error: El directorio de entrada "${inputDir}" no existe.`);
  process.exit(1);
}

const supportedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

async function processImages() {
  const files = fs.readdirSync(inputDir);
  console.log(`Buscando imágenes en: ${inputDir}`);

  const results = {};

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    const base = path.basename(file, ext);

    // Ignorar si no es imagen soportada o si ya es una versión -blur
    if (!supportedExtensions.has(ext) || base.endsWith('-blur')) {
      continue;
    }

    const inputPath = path.join(inputDir, file);
    const outputFilename = `${base}-blur.webp`;
    const outputPath = path.join(outputDir, outputFilename);

    console.log(`Procesando: ${file} -> ${outputFilename}`);

    try {
      const buffer = await sharp(inputPath)
        .resize(48, null, { withoutEnlargement: false })
        .blur(2)
        .webp({ quality: 60 })
        .toBuffer();

      fs.writeFileSync(outputPath, buffer);

      const sizeKb = (buffer.length / 1024).toFixed(2);
      console.log(`  ✓ Guardado: ${outputPath} (${sizeKb} KB)`);

      // Guardar también como data URI para uso instantáneo / inline
      const base64 = `data:image/webp;base64,${buffer.toString('base64')}`;
      results[base] = {
        file: `/landscapes/${outputFilename}`,
        dataUri: base64,
        sizeBytes: buffer.length,
      };
    } catch (err) {
      console.error(`  ✗ Error procesando ${file}:`, err.message);
    }
  }

  // Generar manifiesto JSON si hay resultados
  const manifestDir = path.resolve('src/data');
  if (!fs.existsSync(manifestDir)) {
    fs.mkdirSync(manifestDir, { recursive: true });
  }

  const manifestPath = path.join(manifestDir, 'blur-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\nManifiesto generado en: ${manifestPath}`);
  console.log('¡Pre-desenfoque completado con éxito!');
}

processImages();
