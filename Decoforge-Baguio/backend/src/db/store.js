/**
 * The "database": one JSON object held in memory, mirrored to data/db.json.
 *
 * Writes are serialized through a promise chain and land via temp-file-then-
 * rename, so a crash mid-write cannot leave a truncated store behind.
 *
 * This is deliberately enough for a single workshop on a single process.
 * See the README for when to graduate to SQLite or Postgres.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';
import { logger } from '../logger.js';
import { SEED_PRODUCTS } from './seed.js';

/** @type {{ products: object[], quotes: object[] }} */
let data = { products: [], quotes: [] };
let writeChain = Promise.resolve();

export const store = {
  get products() {
    return data.products;
  },
  get quotes() {
    return data.quotes;
  },

  findProduct(id) {
    return data.products.find((p) => p.id === id);
  },

  findQuote(idOrReference) {
    return data.quotes.find((q) => q.id === idOrReference || q.reference === idOrReference);
  },

  /** Newest first, so the staff view reads top-down. */
  addQuote(quote) {
    data.quotes.unshift(quote);
    return save();
  },

  save,
  load,

  /** Test helper: wipe in-memory state without touching disk semantics. */
  _reset(next = { products: SEED_PRODUCTS, quotes: [] }) {
    data = structuredClone(next);
  },
};

export async function load() {
  await fs.mkdir(config.dataDir, { recursive: true });

  try {
    const parsed = JSON.parse(await fs.readFile(config.dbFile, 'utf8'));
    data = {
      products: Array.isArray(parsed.products) ? parsed.products : [],
      quotes: Array.isArray(parsed.quotes) ? parsed.quotes : [],
    };

    if (data.products.length === 0) {
      data.products = structuredClone(SEED_PRODUCTS);
      await save();
    }
    logger.info(`store: ${data.products.length} products, ${data.quotes.length} quotes`);
    return data;
  } catch (err) {
    if (err.code !== 'ENOENT') {
      logger.warn(`store unreadable (${err.message}); reseeding from db/seed.js`);
    }
    data = { products: structuredClone(SEED_PRODUCTS), quotes: [] };
    await save();
    logger.info(`store: seeded ${data.products.length} products at ${config.dbFile}`);
    return data;
  }
}

export function save() {
  writeChain = writeChain
    .then(async () => {
      const tmp = path.join(config.dataDir, `db.${process.pid}.tmp`);
      await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
      await fs.rename(tmp, config.dbFile);
    })
    .catch((err) => {
      logger.error(`store write failed: ${err.message}`);
    });
  return writeChain;
}

/** Awaited during shutdown so no write is lost on SIGTERM. */
export const pendingWrites = () => writeChain;
