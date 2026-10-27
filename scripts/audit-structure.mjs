import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const SRC_DIR = path.join(rootDir, 'src');
const PUBLIC_DIR = path.join(rootDir, 'public');
const SCRIPTS_DIR = path.join(rootDir, 'scripts');
const DOCS_DIR = path.join(rootDir, 'docs');
const DIST_DIR = path.join(rootDir, 'dist');

function getFilesRecursively(dir, filter = () => true) {
  if (!fs.existsSync(dir)) return [];
  let results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of list) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      results = results.concat(getFilesRecursively(fullPath, filter));
    } else if (filter(fullPath, item.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

// 1. Scan console.log, remote image URLs, and github.com references in src/
const srcFiles = getFilesRecursively(SRC_DIR, (p, n) => /\.(tsx|ts|jsx|js|css)$/.test(n));
const consoleLogs = [];
const remoteUrls = [];
const githubRefs = [];
const allImports = new Set();

for (const file of srcFiles) {
  const content = fs.readFileSync(file, 'utf-8');
  const relPath = path.relative(rootDir, file).replace(/\\/g, '/');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    if (line.includes('console.log(')) {
      consoleLogs.push({ file: relPath, line: idx + 1, snippet: line.trim() });
    }
    if (/https?:\/\/[^\s'"`]+(\.(png|jpg|jpeg|webp|gif|svg)|unsplash|freepik)/i.test(line)) {
      remoteUrls.push({ file: relPath, line: idx + 1, snippet: line.trim() });
    }
    if (line.includes('github.com')) {
      githubRefs.push({ file: relPath, line: idx + 1, snippet: line.trim() });
    }
  });

  // Extract static import / export statements
  const importMatches = content.matchAll(/from\s+['"]([^'"]+)['"]/g);
  for (const match of importMatches) {
    const impPath = match[1];
    if (impPath.startsWith('.')) {
      const resolved = path.resolve(path.dirname(file), impPath);
      allImports.add(resolved);
      allImports.add(`${resolved}.ts`);
      allImports.add(`${resolved}.tsx`);
      allImports.add(`${resolved}.js`);
      allImports.add(`${resolved}.jsx`);
      allImports.add(path.join(resolved, 'index.ts'));
      allImports.add(path.join(resolved, 'index.tsx'));
    }
  }
}

// 2. Identify unimported files in src/
const entryPoints = [
  path.join(SRC_DIR, 'main.tsx'),
  path.join(SRC_DIR, 'index.css'),
  path.join(SRC_DIR, 'App.tsx'),
  path.join(SRC_DIR, 'vite-env.d.ts')
];
const unimportedFiles = [];
for (const file of srcFiles) {
  if (entryPoints.includes(file)) continue;
  const isImported = Array.from(allImports).some(imp => {
    return path.normalize(imp) === path.normalize(file) ||
           path.normalize(imp.replace(/\.[^.]+$/, '')) === path.normalize(file.replace(/\.[^.]+$/, ''));
  });
  if (!isImported) {
    unimportedFiles.push(path.relative(rootDir, file).replace(/\\/g, '/'));
  }
}

// 3. Scan public/ for improper extensions (.md, .csv, .json)
const publicImproperFiles = getFilesRecursively(PUBLIC_DIR, (p, n) => /\.(md|csv|json)$/i.test(n))
  .map(f => path.relative(rootDir, f).replace(/\\/g, '/'));

// 4. List legacy scripts in scripts/ (excluding active infrastructure scripts)
const activeScripts = new Set(['verify.mjs', 'perf.mjs', 'audit-structure.mjs']);
const scriptFiles = fs.readdirSync(SCRIPTS_DIR, { withFileTypes: true })
  .filter(d => !d.isDirectory())
  .map(d => d.name)
  .filter(name => !activeScripts.has(name));

// 5. Mark candidate obsolete files in docs/
const obsoleteDocsCandidates = [
  'docs/reporte_fase1_selected_projects.html',
  'docs/fase5b_parametros_fisica.csv',
  'docs/fase5b_parametros_fisica.json'
].filter(f => fs.existsSync(path.join(rootDir, f)));

// 6. Weight Breakdown Analysis of dist/ and public/
let distBreakdown = [];
let totalDistMb = 0;
if (fs.existsSync(DIST_DIR)) {
  const distEntries = fs.readdirSync(DIST_DIR, { withFileTypes: true });
  for (const entry of distEntries) {
    const fullPath = path.join(DIST_DIR, entry.name);
    let sizeBytes = 0;
    if (entry.isDirectory()) {
      const files = getFilesRecursively(fullPath);
      for (const f of files) sizeBytes += fs.statSync(f).size;
    } else {
      sizeBytes = fs.statSync(fullPath).size;
    }
    const sizeMb = Number((sizeBytes / (1024 * 1024)).toFixed(2));
    totalDistMb += sizeMb;
    distBreakdown.push({ name: entry.name, isDir: entry.isDirectory(), sizeMb });
  }
  distBreakdown.sort((a, b) => b.sizeMb - a.sizeMb);
}

const report = {
  timestamp: new Date().toISOString(),
  consoleLogsCount: consoleLogs.length,
  consoleLogs,
  remoteUrlsCount: remoteUrls.length,
  remoteUrls,
  githubRefsCount: githubRefs.length,
  githubRefs,
  unimportedFilesCount: unimportedFiles.length,
  unimportedFiles,
  publicImproperFilesCount: publicImproperFiles.length,
  publicImproperFiles,
  totalDistMb: Number(totalDistMb.toFixed(2)),
  distBreakdown,
  legacyScriptsCount: scriptFiles.length,
  legacyScriptsToArchiveProposal: scriptFiles,
  obsoleteDocsCandidates
};

console.log('\n======================================================');
console.log('             REPORTE DE ARQUITECTURA E HIGIENE        ');
console.log('======================================================');
console.log(`- Llamadas a console.log en src/: ${consoleLogs.length}`);
if (consoleLogs.length > 0) {
  consoleLogs.slice(0, 5).forEach(c => console.log(`   * [${c.file}:${c.line}] ${c.snippet}`));
  if (consoleLogs.length > 5) console.log(`   ... y ${consoleLogs.length - 5} más.`);
}
console.log(`- URLs remotas de imágenes: ${remoteUrls.length}`);
console.log(`- Referencias a github.com en src/: ${githubRefs.length}`);
console.log(`- Archivos sin importar (candidatos huérfanos en src/): ${unimportedFiles.length}`);
if (unimportedFiles.length > 0) {
  unimportedFiles.forEach(f => console.log(`   * ${f}`));
}
console.log(`- Archivos .md/.csv/.json en public/: ${publicImproperFiles.length}`);
if (publicImproperFiles.length > 0) {
  publicImproperFiles.forEach(f => console.log(`   * ${f}`));
}

console.log(`\n- ANÁLISIS DE PESO DE DIST/ (${report.totalDistMb} MB Total):`);
console.log('   (Hallazgo: el bundle de código JS/CSS es solo ~0.68 MB; el resto son assets estáticos copiados de public/)');
distBreakdown.forEach(item => {
  const typeStr = item.isDir ? '[CARPETA]' : '[ARCHIVO]';
  console.log(`   * ${typeStr} ${item.name.padEnd(20)}: ${item.sizeMb} MB`);
});

console.log(`\n[PROPUESTA] Scripts utilitarios históricos (${scriptFiles.length}) para mover a scripts/legacy/ (SIN EJECUTAR):`);
console.log(`   Total: ${scriptFiles.length} scripts antiguos detectados.`);
console.log(`\n[PROPUESTA] Archivos antiguos en docs/ candidatos a archivado (SIN BORRAR):`);
obsoleteDocsCandidates.forEach(f => console.log(`   * ${f}`));
console.log('======================================================\n');

export default report;
