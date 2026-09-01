import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve(process.cwd());
const host = process.env.HOST ?? '0.0.0.0';
const port = Number.parseInt(process.env.PORT ?? '4173', 10);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

function resolveFile(requestUrl = '/') {
  const decoded = decodeURIComponent(requestUrl.split('?')[0]);
  const relative = normalize(decoded).replace(/^[/\\]+/, '');
  const candidate = resolve(join(root, relative));
  return candidate.startsWith(root) ? candidate : null;
}

const server = createServer((request, response) => {
  let file = resolveFile(request.url);
  if (!file) {
    response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Forbidden');
    return;
  }
  if (request.url === '/' || request.url?.startsWith('/?')) file = join(root, 'index.html');
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file) && !extname(file)) file = join(root, 'index.html');
  if (!existsSync(file) || !statSync(file).isFile()) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
    return;
  }
  response.writeHead(200, {
    'Content-Type': types[extname(file).toLowerCase()] ?? 'application/octet-stream',
    'Cache-Control': file.endsWith('sw.js') ? 'no-cache' : 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  createReadStream(file).pipe(response);
});

server.listen(port, host, () => {
  console.log(`Vaultbound: Night Shift running at http://localhost:${port}`);
});
