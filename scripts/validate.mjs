import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(process.cwd());
const required = [
  'index.html', 'styles.css', 'styles/advanced.css', 'favicon.svg', 'manifest.webmanifest', 'vercel.json',
  'sw.js', 'src/main.js', 'src/game.js', 'src/pixel.js', 'src/audio.js',
  'src/content.js', 'src/state.js', 'src/advanced.js', 'src/advanced-system.js',
  'scripts/dev-server.mjs', 'scripts/simulate.mjs', 'scripts/simulate-advanced.mjs',
  'tests/pixel-game.test.js', 'tests/advanced-system.test.js',
  'docs/GAME_DESIGN.md', 'docs/ADVANCED_SYSTEMS.md', 'README.md',
];

const missing = required.filter((path) => !existsSync(join(root, path)));
if (missing.length) {
  console.error(`Missing required files: ${missing.join(', ')}`);
  process.exit(1);
}

function walk(directory) {
  return readdirSync(directory).flatMap((name) => {
    if (['.git', 'node_modules', '.vercel'].includes(name)) return [];
    const full = join(directory, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const files = walk(root);
const scripts = files.filter((file) => ['.js', '.mjs'].includes(extname(file)));
for (const file of scripts) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    console.error(`Syntax error in ${relative(root, file)}\n${result.stderr || result.stdout}`);
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

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
if (duplicates.length) {
  console.error(`Duplicate HTML IDs: ${duplicates.join(', ')}`);
  process.exit(1);
}

const game = readFileSync(join(root, 'src/game.js'), 'utf8');
const queriedIds = [...game.matchAll(/\$\('#([^']+)'\)/g)].map((match) => match[1]);
const missingIds = [...new Set(queriedIds.filter((id) => !ids.includes(id)))];
if (missingIds.length) {
  console.error(`src/game.js references missing HTML IDs: ${missingIds.join(', ')}`);
  process.exit(1);
}

for (const file of scripts) {
  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(/(?:from\s+|import\s*)['"](\.{1,2}\/[^'"]+)['"]/g)) {
    const target = resolve(dirname(file), match[1]);
    const candidates = [target, `${target}.js`, `${target}.mjs`, join(target, 'index.js')];
    if (!candidates.some(existsSync)) {
      console.error(`${relative(root, file)} imports missing module ${match[1]}`);
      process.exit(1);
    }
  }
}

const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const manifest = JSON.parse(readFileSync(join(root, 'manifest.webmanifest'), 'utf8'));
JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8'));
if (!packageJson.scripts?.test || !packageJson.scripts?.simulate || !manifest.name || !manifest.icons?.length) {
  console.error('Project metadata is incomplete.');
  process.exit(1);
}

const css = readFileSync(join(root, 'styles.css'), 'utf8');
const advancedCss = readFileSync(join(root, 'styles/advanced.css'), 'utf8');
if (!css.includes('image-rendering: pixelated') || (!css.includes('@font-face') && !css.includes('font-family'))) {
  console.error('Pixel rendering or typography rules are missing.');
  process.exit(1);
}
if (!advancedCss.includes('.boss-protocol-hud') || !advancedCss.includes('.bond-episode')) {
  console.error('Advanced boss or relationship presentation styles are missing.');
  process.exit(1);
}

const main = readFileSync(join(root, 'src/main.js'), 'utf8');
if (!main.includes('installAdvancedSystems(game)')) {
  console.error('Advanced systems are not installed from src/main.js.');
  process.exit(1);
}

const advanced = readFileSync(join(root, 'src/advanced.js'), 'utf8');
if (!advanced.includes("href = './styles/advanced.css'") || !advanced.includes('startGamepadLoop')) {
  console.error('Advanced stylesheet or gamepad integration is missing.');
  process.exit(1);
}

const sw = readFileSync(join(root, 'sw.js'), 'utf8');
for (const path of [
  'index.html', 'styles.css', 'styles/advanced.css', 'src/main.js', 'src/game.js',
  'src/pixel.js', 'src/content.js', 'src/state.js', 'src/advanced.js', 'src/advanced-system.js',
]) {
  if (!sw.includes(`./${path}`)) {
    console.error(`Service worker cache is missing ./${path}`);
    process.exit(1);
  }
}

console.log(`Static validation passed: ${scripts.length} scripts, ${ids.length} unique DOM IDs, ${files.length} files.`);
