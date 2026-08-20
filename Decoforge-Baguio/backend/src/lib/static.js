/** Static file serving for the frontend/ folder, with traversal guards. */
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';
import { HttpError } from './http.js';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

export async function serveStatic(req, res, pathname) {
  const publicRoot = path.resolve(config.publicDir);
  const relative = pathname === '/' ? 'index.html' : decodeURIComponent(pathname).replace(/^\/+/, '');
  const target = path.resolve(publicRoot, relative);

  // Anything resolving outside frontend/ is refused, including via ../ and symlinks.
  if (target !== publicRoot && !target.startsWith(publicRoot + path.sep)) {
    throw new HttpError(403, 'Forbidden.');
  }

  // Never serve dotfiles. Tooling drops state directories (.git, .gstack, .env)
  // into working folders, and none of it is meant to be public.
  if (target.slice(publicRoot.length).split(path.sep).some((part) => part.startsWith('.'))) {
    throw new HttpError(403, 'Forbidden.');
  }

  let stat;
  try {
    stat = await fsp.stat(target);
  } catch {
    throw new HttpError(404, 'Not found.');
  }
  if (!stat.isFile()) throw new HttpError(404, 'Not found.');

  const etag = `W/"${stat.size.toString(16)}-${Math.trunc(stat.mtimeMs).toString(16)}"`;
  if (req.headers['if-none-match'] === etag) {
    res.writeHead(304, { ETag: etag });
    return res.end();
  }

  const ext = path.extname(target).toLowerCase();
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Content-Length': stat.size,
    // Hashless filenames: revalidate every time rather than serve a stale app.
    'Cache-Control': 'no-cache',
    ETag: etag,
  });

  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(target).pipe(res);
}
