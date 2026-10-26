import fs from 'fs';
import path from 'path';

function scan(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (f !== 'node_modules' && f !== '.git' && f !== 'dist') scan(full);
    } else if (/\.(tsx|ts|jsx|js|json|css|html)$/.test(f)) {
      const content = fs.readFileSync(full, 'utf8');
      const matches = content.match(/['"`][^'"`]*\.(png|jpg|jpeg|webp|svg|gif)[^'"`]*['"`]/gi);
      if (matches) {
        console.log(full + ':');
        [...new Set(matches)].forEach(m => console.log('  ', m));
      }
    }
  }
}
scan('src');
