import { spawn } from 'node:child_process';
import {
  createReadStream,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { createServer } from 'node:http';
import { networkInterfaces } from 'node:os';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../offline-dist', import.meta.url));
const dataDirectory = fileURLToPath(new URL('../offline-data', import.meta.url));
const dataFile = join(dataDirectory, 'household-data.json');
const temporaryDataFile = join(dataDirectory, 'household-data.tmp.json');
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
mkdirSync(dataDirectory, { recursive: true });

function readData() {
  if (!existsSync(dataFile)) return { data: null, updatedAt: 0 };
  const data = JSON.parse(readFileSync(dataFile, 'utf8'));
  return { data, updatedAt: statSync(dataFile).mtimeMs };
}

function writeData(data) {
  writeFileSync(temporaryDataFile, JSON.stringify(data, null, 2), 'utf8');
  renameSync(temporaryDataFile, dataFile);
  return statSync(dataFile).mtimeMs;
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    request.on('data', (chunk) => {
      size += chunk.length;
      if (size > 25 * 1024 * 1024) {
        reject(new Error('La base de datos local es demasiado grande.'));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch (error) {
        reject(error);
      }
    });
    request.on('error', reject);
  });
}

function json(response, status, value) {
  response.writeHead(status, {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
  });
  response.end(JSON.stringify(value));
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

const server = createServer(async (request, response) => {
  if (request.url?.split('?')[0] === '/api/data') {
    try {
      if (request.method === 'GET') {
        json(response, 200, readData());
        return;
      }
      if (request.method === 'PUT') {
        const data = await readRequestBody(request);
        json(response, 200, { updatedAt: writeData(data) });
        return;
      }
      json(response, 405, { error: 'Método no permitido.' });
    } catch (error) {
      json(response, 400, {
        error: error instanceof Error ? error.message : 'No se pudo guardar.',
      });
    }
    return;
  }
  const path = safePath(request.url ?? '/');
  response.writeHead(200, {
    'Cache-Control': path.endsWith('index.html') ? 'no-cache' : 'public, max-age=31536000',
    'Content-Type': mimeTypes[extname(path)] ?? 'application/octet-stream',
  });
  createReadStream(path).pipe(response);
});

server.listen(port, '0.0.0.0', () => {
  const localUrl = `http://127.0.0.1:${port}`;
  console.log(`Gastos del hogar está disponible en este Mac: ${localUrl}`);
  const addresses = Object.values(networkInterfaces())
    .flat()
    .filter((item) => item?.family === 'IPv4' && !item.internal)
    .map((item) => `http://${item.address}:${port}`);
  if (addresses.length) {
    console.log('En un iPhone conectado a la misma Wi-Fi, abre:');
    addresses.forEach((address) => console.log(`  ${address}`));
  }
  console.log('Cualquier persona en esa Wi-Fi con la dirección puede ver y editar los datos.');
  console.log('Mantén esta ventana abierta. Pulsa Control+C para cerrar la aplicación.');
  spawn('open', [localUrl], { detached: true, stdio: 'ignore' }).unref();
});

server.on('error', (error) => {
  if ('code' in error && error.code === 'EADDRINUSE') {
    spawn('open', [`http://127.0.0.1:${port}`], { detached: true, stdio: 'ignore' }).unref();
    process.exit(0);
  }
  throw error;
});
