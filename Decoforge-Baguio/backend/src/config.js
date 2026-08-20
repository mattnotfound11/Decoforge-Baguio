/**
 * Runtime configuration, read once at import time.
 * Every value has a development-friendly default so `node src/server.js`
 * works with no setup at all.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(here, '..');
const projectRoot = path.resolve(backendRoot, '..');

export const DEFAULT_ADMIN_TOKEN = 'decoforge-dev-token';

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  host: process.env.HOST || '127.0.0.1',

  adminToken: process.env.ADMIN_TOKEN || DEFAULT_ADMIN_TOKEN,
  corsOrigin: process.env.CORS_ORIGIN || '*',

  dataDir: process.env.DATA_DIR || path.join(backendRoot, 'data'),
  publicDir: process.env.PUBLIC_DIR || path.join(projectRoot, 'frontend'),

  /** Largest request body we will read before hanging up. */
  maxBodyBytes: 64 * 1024,

  rateLimits: {
    api: { max: 240, windowMs: 60_000 },
    quote: { max: 5, windowMs: 60_000 },
  },
};

config.dbFile = path.join(config.dataDir, 'db.json');

export const usingDefaultToken = config.adminToken === DEFAULT_ADMIN_TOKEN;
