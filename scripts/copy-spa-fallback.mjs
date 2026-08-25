import { copyFileSync } from 'node:fs';
import { join } from 'node:path';

const outDir = join('dist', 'lecheleaderboard', 'browser');
const index = join(outDir, 'index.html');
const fallback = join(outDir, '404.html');

copyFileSync(index, fallback);
console.log('Copied index.html -> 404.html for GitHub Pages SPA routing');
