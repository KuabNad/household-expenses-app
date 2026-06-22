import { spawn } from 'node:child_process';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../offline-dist', import.meta.url));
const port = 8765;
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.webp': 'image/webp',
};

if (!existsSync(join(root, 'index.html'))) {
  console.error('No se encontró la versión offline. Ejecuta: npm run build:offline:mac');
  process.exit(1);
}

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const relative = normalize(decoded).replace(/^(\.\.(\/|\\|$))+/, '').replace(/^[/\\]+/, '');
  const candidate = join(root, relative || 'index.html');
  if (candidate.startsWith(root) && existsSync(candidate) && statSync(candidate).isFile()) {
    return candidate;
  }
  return join(root, 'index.html');
}

const server = createServer((request, response) => {
  const path = safePath(request.url ?? '/');
  response.writeHead(200, {
    'Cache-Control': path.endsWith('index.html') ? 'no-cache' : 'public, max-age=31536000',
    'Content-Type': mimeTypes[extname(path)] ?? 'application/octet-stream',
  });
  createReadStream(path).pipe(response);
});

server.listen(port, '127.0.0.1', () => {
  const url = `http://127.0.0.1:${port}`;
  console.log(`Gastos del hogar está disponible en ${url}`);
  console.log('Mantén esta ventana abierta. Pulsa Control+C para cerrar la aplicación.');
  spawn('open', [url], { detached: true, stdio: 'ignore' }).unref();
});

server.on('error', (error) => {
  if ('code' in error && error.code === 'EADDRINUSE') {
    spawn('open', [`http://127.0.0.1:${port}`], { detached: true, stdio: 'ignore' }).unref();
    process.exit(0);
  }
  throw error;
});
