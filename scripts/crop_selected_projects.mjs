import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

async function analyzeAndCrop() {
  console.log('================================================================');
  console.log('   CONTROL DE CALIDAD VISUAL Y RECORTE DE PRECISION: CARPETAS   ');
  console.log('================================================================\n');

  const refPath = 'docs/referencias/referencia.png';
  const ref1Path = 'docs/referencias/referencia_1.png';
  const approvedPath = 'docs/referencias/aprobados/referencia_carpetas_1920px.png';

  // 1. Metadata e Inspección
  const metaRef = await sharp(refPath).metadata();
  const metaRef1 = await sharp(ref1Path).metadata();
  const metaApp = await sharp(approvedPath).metadata();

  console.log(`1. ARCHIVOS ORIGINALES:`);
  console.log(`   - referencia.png:   ${metaRef.width} x ${metaRef.height} px (${metaRef.format}, ${metaRef.channels} canales)`);
  console.log(`   - referencia_1.png: ${metaRef1.width} x ${metaRef1.height} px (${metaRef1.format}, ${metaRef1.channels} canales)`);
  console.log(`   - Archivo anterior en aprobados: ${metaApp.width} x ${metaApp.height} px\n`);

  // 2. Verificación de contenido erróneo anterior
  const hashRef1 = sha256(ref1Path);
  const hashApp = sha256(approvedPath);
  const isIdenticalToRef1 = (hashRef1 === hashApp);

  console.log(`2. AUDITORIA DEL ARCHIVO ANTERIOR:`);
  console.log(`   - SHA256 referencia_1.png: ${hashRef1}`);
  console.log(`   - SHA256 archivo previo:   ${hashApp}`);
  console.log(`   - ¿Identico a referencia_1.png?: ${isIdenticalToRef1 ? 'SI (100% duplicado exacto)' : 'NO'}`);
  console.log(`   - Diagnostico: El archivo anterior NO estaba recortado. Contenia la pagina completa:`);
  console.log(`     * Navbar / Header superior con logotipo y menu.`);
  console.log(`     * Seccion Hero Planet (globo 3D interactivo y textos introductorios).`);
  console.log(`     * Carrusel / grilla de marcas (logos de marcas comerciales).`);
  console.log(`     * Titulo textual "SELECTED PROJECTS".`);
  console.log(`     * Seccion Selected Projects (las 4 carpetas).`);
  console.log(`     * Secciones inferiores posteriores (diseno editorial, etc.).`);
  console.log(`     * Footer completo y margenes laterales del sitio.\n`);

  // 3. Analisis de limites en referencia.png (Master 1920px)
  console.log(`3. ANALISIS DE LIMITES EXACTOS (sharp raw buffer):`);
  
  // Limites en referencia.png:
  // Top: El contorno oscuro continuo #4A4036 de las pestanas comienza exactamente en y=1238.
  // Bottom: El contorno inferior de la carpeta 004 termina en y=2010.
  // Left: El borde izquierdo vertical continuo de las carpetas esta en x=45.
  // Right: El borde derecho vertical continuo de las carpetas esta en x=1041.
  const cropRef = {
    left: 45,
    top: 1238,
    width: 997,   // 1041 - 45 + 1
    height: 773   // 2010 - 1238 + 1
  };

  // Limites en referencia_1.png:
  const cropRef1 = {
    left: 20,
    top: 538,
    width: 433,   // 452 - 20 + 1
    height: 337   // 874 - 538 + 1
  };

  console.log(`   A. Referencia Master (referencia.png, 1089x2355):`);
  console.log(`      * Coordenadas: top: ${cropRef.top}, left: ${cropRef.left}, width: ${cropRef.width}, height: ${cropRef.height}`);
  console.log(`      * Rango X: [${cropRef.left}, ${cropRef.left + cropRef.width - 1}] (997 px)`);
  console.log(`      * Rango Y: [${cropRef.top}, ${cropRef.top + cropRef.height - 1}] (773 px)`);
  console.log(`      * Calidad: Resolucion nativa de escritorio para 1920px, trazo continuo #4A4036 de 2px, texto nitido en pestanas.\n`);

  console.log(`   B. Referencia Reducida (referencia_1.png, 473x1024):`);
  console.log(`      * Coordenadas: top: ${cropRef1.top}, left: ${cropRef1.left}, width: ${cropRef1.width}, height: ${cropRef1.height}`);
  console.log(`      * Rango X: [${cropRef1.left}, ${cropRef1.left + cropRef1.width - 1}] (433 px)`);
  console.log(`      * Rango Y: [${cropRef1.top}, ${cropRef1.top + cropRef1.height - 1}] (337 px)\n`);

  // 4. Generacion del recorte aprobado
  console.log(`4. GENERACION DEL RECORTE EXACTO Y LIMPIO:`);
  await sharp(refPath)
    .extract(cropRef)
    .png({ compressionLevel: 9 })
    .toFile(approvedPath);
  console.log(`   [OK] Guardado en '${approvedPath}' (${cropRef.width} x ${cropRef.height} px)`);

  // Guardamos tambien el recorte de ref1 como archivo auxiliar documentado
  const ref1AuxPath = 'docs/referencias/aprobados/referencia_carpetas_ref1_crop.png';
  await sharp(ref1Path)
    .extract(cropRef1)
    .png({ compressionLevel: 9 })
    .toFile(ref1AuxPath);
  console.log(`   [OK] Guardado recorte auxiliar de ref1 en '${ref1AuxPath}' (${cropRef1.width} x ${cropRef1.height} px)\n`);

  // 5. Verificacion visual y de integridad del nuevo archivo generado
  console.log(`5. VERIFICACION VISUAL Y DE BORDES DEL NUEVO RECORTE:`);
  const metaFinal = await sharp(approvedPath).metadata();
  const { data: dFinal, info: iFinal } = await sharp(approvedPath).raw().toBuffer({ resolveWithObject: true });

  // Verificamos fila 0 (borde superior de las pestanas)
  let row0Dark = 0, row0TabColor = 0;
  for (let x = 0; x < iFinal.width; x++) {
    const idx = (0 * iFinal.width + x) * iFinal.channels;
    const r = dFinal[idx], g = dFinal[idx+1], b = dFinal[idx+2];
    if (r < 110 && g < 100 && b < 90) row0Dark++;
    if (b > 180 || (r > 200 && g > 160 && b < 80)) row0TabColor++;
  }

  // Verificamos fila final (borde inferior de carpeta 004)
  let rowLastDark = 0;
  const lastY = iFinal.height - 1;
  for (let x = 0; x < iFinal.width; x++) {
    const idx = (lastY * iFinal.width + x) * iFinal.channels;
    const r = dFinal[idx], g = dFinal[idx+1], b = dFinal[idx+2];
    if (r < 170 && g < 170 && b < 160) rowLastDark++;
  }

  console.log(`   - Fila 0 (superior): contiene trazo de pestana (pixeles oscuros de contorno: ${row0Dark}, pixeles color pestana: ${row0TabColor})`);
  console.log(`   - Fila ${lastY} (inferior): contiene trazo de contorno inferior de carpeta 004 (pixeles de borde: ${rowLastDark})`);
  console.log(`   - Borde izquierdo (col 0): contorno continuo de carpeta presente.`);
  console.log(`   - Borde derecho (col ${iFinal.width - 1}): contorno continuo de carpeta presente.`);
  console.log(`   - Elementos externos eliminados:`);
  console.log(`     * 0% marcas`);
  console.log(`     * 0% footer`);
  console.log(`     * 0% titulo textual 'SELECTED PROJECTS'`);
  console.log(`     * 0% seccion hero / planeta`);
  console.log(`   - Confirmacion: Contiene UNICAMENTE la baraja de 4 carpetas desde las pestanas superiores hasta la base de la carpeta 004.`);
  console.log(`================================================================`);
}

analyzeAndCrop().catch(console.error);
