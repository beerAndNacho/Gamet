import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(process.cwd());
const required = [
  'index.html',
  'styles.css',
  'styles/base.css',
  'styles/home.css',
  'styles/play.css',
  'styles/results.css',
  'manifest.webmanifest',
  'favicon.svg',
  'sw.js',
  'src/data.js',
  'src/engine.js',
  'src/storage.js',
  'src/audio.js',
  'src/main.js',
];

const missing = required.filter((path) => !existsSync(join(root, path)));
if (missing.length) {
  console.error(`Missing required files: ${missing.join(', ')}`);
  process.exit(1);
}

function collectJavaScript(directory) {
  return readdirSync(directory).flatMap((name) => {
    const fullPath = join(directory, name);
    if (statSync(fullPath).isDirectory()) return collectJavaScript(fullPath);
    return ['.js', '.mjs'].includes(extname(fullPath)) ? [fullPath] : [];
  });
}

for (const file of collectJavaScript(root).filter((path) => !path.includes('node_modules'))) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    process.exit(result.status ?? 1);
  }
}

const html = readFileSync(join(root, 'index.html'), 'utf8');
for (const reference of ['./styles.css', './favicon.svg', './manifest.webmanifest', './src/main.js']) {
  if (!html.includes(reference)) {
    console.error(`index.html does not reference ${reference}`);
    process.exit(1);
  }
}

JSON.parse(readFileSync(join(root, 'manifest.webmanifest'), 'utf8'));
JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8'));
console.log('Static project validation passed.');
