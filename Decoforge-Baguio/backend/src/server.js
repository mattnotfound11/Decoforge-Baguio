#!/usr/bin/env node
/**
 * Entry point.
 *
 *   node src/server.js
 *
 * Loads the JSON store, serves the API and the frontend/ folder, and shuts
 * down without dropping a pending write.
 */
import http from 'node:http';
import { config, usingDefaultToken } from './config.js';
import { logger } from './logger.js';
import { handleRequest } from './app.js';
import { load, pendingWrites } from './db/store.js';

const server = http.createServer(handleRequest);

/** Exported for the test suite, which starts its own listener on port 0. */
export { server, handleRequest };

function shutdown(signal) {
  logger.info(`${signal} received, closing server`);
  server.close(() => {
    pendingWrites().finally(() => process.exit(0));
  });
  // Do not hang forever on a stuck keep-alive connection.
  setTimeout(() => process.exit(1), 5000).unref();
}

async function main() {
  await load();

  server.listen(config.port, config.host, () => {
    logger.info(`Decoforge Baguio listening on http://${config.host}:${config.port} (${config.env})`);
    logger.info(`serving frontend from ${config.publicDir}`);

    if (usingDefaultToken) {
      logger.warn('ADMIN_TOKEN is unset — staff endpoints accept the development default "decoforge-dev-token". Set ADMIN_TOKEN before deploying.');
    }
  });

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('unhandledRejection', (reason) => {
    logger.error(`unhandled rejection: ${reason instanceof Error ? reason.stack : reason}`);
  });
}

// Only boot when run directly, so importing the module in tests is side-effect free.
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    logger.error(`startup failed: ${err.stack || err.message}`);
    process.exit(1);
  });
}
