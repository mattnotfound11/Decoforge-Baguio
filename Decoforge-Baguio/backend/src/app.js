/**
 * The request handler: security headers, rate limit, route table, static
 * fallback, and one error funnel. Kept separate from server.js so the tests
 * can mount it on an ephemeral port.
 */
import { URL } from 'node:url';
import { config } from './config.js';
import { logger } from './logger.js';
import { fail, HttpError } from './lib/http.js';
import { rateLimited } from './lib/rate-limit.js';
import { serveStatic } from './lib/static.js';
import * as metaRoutes from './routes/meta.routes.js';
import * as productRoutes from './routes/products.routes.js';
import * as quoteRoutes from './routes/quotes.routes.js';

/**
 * Route table. `path` is either a literal string or a RegExp whose named
 * groups become `params`.
 */
const routes = [
  { method: 'GET', path: '/api/health', handler: metaRoutes.health },
  { method: 'GET', path: '/api/meta', handler: metaRoutes.meta },

  { method: 'GET', path: '/api/products', handler: productRoutes.list },
  { method: 'GET', path: /^\/api\/products\/(?<id>[\w-]{1,60})$/, handler: productRoutes.detail },

  { method: 'POST', path: '/api/quotes', handler: quoteRoutes.create },
  { method: 'GET', path: '/api/quotes', handler: quoteRoutes.list },
  { method: 'PATCH', path: /^\/api\/quotes\/(?<id>[\w-]{1,60})$/, handler: quoteRoutes.update },
];

function match(method, pathname) {
  let pathMatched = false;

  for (const route of routes) {
    const found = typeof route.path === 'string'
      ? (route.path === pathname ? {} : null)
      : (pathname.match(route.path)?.groups ?? null);

    if (!found) continue;
    pathMatched = true;
    if (route.method === method) return { handler: route.handler, params: found };
  }

  // A known path with the wrong verb is a 405, not a 404.
  if (pathMatched) throw new HttpError(405, `${method} not allowed on this path.`);
  return null;
}

function applyBaseHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', config.corsOrigin);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Max-Age', '600');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'same-origin');
}

export async function handleRequest(req, res) {
  const startedAt = process.hrtime.bigint();
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const { pathname } = url;

  applyBaseHeaders(res);

  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - startedAt) / 1e6;
    logger.info(`${req.method} ${pathname} -> ${res.statusCode} (${ms.toFixed(1)}ms)`);
  });

  try {
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      return res.end();
    }

    const isApi = pathname === '/api' || pathname.startsWith('/api/');

    if (isApi && rateLimited(req, 'api', config.rateLimits.api)) {
      throw new HttpError(429, 'Too many requests.');
    }

    const route = match(req.method, pathname);
    if (route) return await route.handler(req, res, { url, params: route.params });

    if (isApi) throw new HttpError(404, `No route for ${req.method} ${pathname}.`);

    if (req.method === 'GET' || req.method === 'HEAD') {
      return await serveStatic(req, res, pathname);
    }

    throw new HttpError(405, `${req.method} not allowed here.`);
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;

    if (status >= 500) {
      logger.error(`${req.method} ${pathname}: ${err.stack || err.message}`);
    }

    if (res.headersSent) return res.end();

    fail(res, status,
      status >= 500 ? 'Something went wrong.' : err.message,
      err.details);
  }
}
