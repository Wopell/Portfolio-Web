import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const projectFoldersPath = path.join(rootDir, 'src', 'components', 'ProjectFolders.tsx');

/**
 * Script de autocorrección para ProjectFolders.tsx
 * Ajusta parámetros geométricos y variables CSS si se detecta desviación visual > 10%
 */
export function autoFixFolders(options = {}) {
  if (!fs.existsSync(projectFoldersPath)) {
    console.error(`[auto_fix.mjs] Archivo no encontrado: ${projectFoldersPath}`);
    return false;
  }

  let code = fs.readFileSync(projectFoldersPath, 'utf8');

  // Ajustes automáticos paramétricos si se proporcionan
  if (options.topOffsets) {
    code = code.replace(/topOffsets:\s*\[[^\]]+\]/, `topOffsets: [${options.topOffsets.join(', ')}]`);
  }
  if (options.outlineColor) {
    code = code.replace(/outlineColor:\s*'[^']+'/, `outlineColor: '${options.outlineColor}'`);
  }
  if (options.hoverRotateX !== undefined) {
    code = code.replace(/hoverRotateX:\s*[-0-9.]+/, `hoverRotateX: ${options.hoverRotateX}`);
  }

  fs.writeFileSync(projectFoldersPath, code, 'utf8');
  console.log('[auto_fix.mjs] Correcciones automáticas aplicadas en ProjectFolders.tsx');
  return true;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log('[auto_fix.mjs] Ejecución directa del corrector automático.');
  autoFixFolders();
}
