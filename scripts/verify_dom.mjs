import { execFileSync } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const out = execFileSync(chromePath, [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--dump-dom',
  'http://127.0.0.1:5173/works?freeze=1&time=0'
], { encoding: 'utf8' });

const buttons = (out.match(/<button[^>]*aria-label="[^"]+"/g) || []);
console.log('Found circle buttons:', buttons);

const anchors = (out.match(/<a[^>]*aria-label="[^"]+"/g) || []);
console.log('Found circle anchors:', anchors);

const githubLinks = (out.match(/github\.com/g) || []);
console.log('Found github.com in DOM:', githubLinks.length);
