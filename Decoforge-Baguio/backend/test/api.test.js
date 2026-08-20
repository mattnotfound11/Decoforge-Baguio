/**
 * End-to-end tests against a real listener on an ephemeral port.
 *
 *   npm test        (from backend/)
 *
 * DATA_DIR is redirected to a temp folder so a test run never touches the
 * development store.
 */
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import os from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';

const tmpData = await fs.mkdtemp(path.join(os.tmpdir(), 'decoforge-test-'));
process.env.DATA_DIR = tmpData;
process.env.ADMIN_TOKEN = 'test-token';

const { handleRequest } = await import('../src/app.js');
const { load } = await import('../src/db/store.js');
const { _clear: clearRateLimits } = await import('../src/lib/rate-limit.js');

let server;
let base;

before(async () => {
  await load();
  server = http.createServer(handleRequest);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await fs.rm(tmpData, { recursive: true, force: true });
});

const call = async (path, options = {}) => {
  const res = await fetch(base + path, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  return { status: res.status, body: await res.json().catch(() => null) };
};

describe('meta', () => {
  test('health reports seeded counts', async () => {
    const { status, body } = await call('/api/health');
    assert.equal(status, 200);
    assert.equal(body.status, 'ok');
    assert.equal(body.products, 10);
  });

  test('meta lists categories and project types', async () => {
    const { body } = await call('/api/meta');
    assert.ok(body.categories.some((c) => c.id === 'lighting'));
    assert.ok(body.projectTypes.includes('Full room'));
  });
});

describe('products', () => {
  test('returns every product, featured first', async () => {
    const { body } = await call('/api/products');
    assert.equal(body.count, 10);
    assert.equal(body.items[0].featured, true);
  });

  test('filters by category and sorts by price', async () => {
    const { body } = await call('/api/products?category=lighting&sort=price-asc');
    assert.equal(body.count, 2);
    assert.ok(body.items[0].price < body.items[1].price);
  });

  test('search matches materials, not just names', async () => {
    const { body } = await call('/api/products?search=rattan');
    assert.equal(body.count, 1);
    assert.equal(body.items[0].id, 'p-highland-sideboard');
  });

  test('detail includes related pieces from the same category', async () => {
    const { status, body } = await call('/api/products/p-capiz-pendant');
    assert.equal(status, 200);
    assert.equal(body.item.name, 'Capiz Cascade Pendant');
    assert.ok(body.related.every((r) => r.id !== 'p-capiz-pendant'));
  });

  test('unknown product is a 404', async () => {
    const { status } = await call('/api/products/does-not-exist');
    assert.equal(status, 404);
  });
});

describe('quote submission', () => {
  test('rejects a bad payload with per-field details', async () => {
    const { status, body } = await call('/api/quotes', {
      method: 'POST',
      body: JSON.stringify({ name: 'x', email: 'not-an-email', message: 'hi' }),
    });
    assert.equal(status, 422);
    assert.ok(body.error.details.name);
    assert.ok(body.error.details.email);
    assert.ok(body.error.details.message);
  });

  test('accepts a valid request and returns a reference', async () => {
    const { status, body } = await call('/api/quotes', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Marites Bautista',
        email: 'marites@example.com',
        phone: '+63 917 555 0123',
        projectType: 'Full room',
        message: 'Dining set for a 20 sqm room in Camp 7.',
        items: [
          { productId: 'p-cordillera-dining-table', quantity: 1 },
          { productId: 'p-capiz-pendant', quantity: 2 },
        ],
      }),
    });

    assert.equal(status, 201);
    assert.match(body.quote.reference, /^DFB-\d{6}-[0-9A-F]{4}$/);
    assert.equal(body.quote.subtotal, 46000 + 15400 * 2);
    assert.equal(body.quote.estimatedLeadTimeDays, 35); // slowest item wins
  });

  test('ignores a client-supplied price', async () => {
    const { body } = await call('/api/quotes', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Tamper Test',
        email: 'tamper@example.com',
        message: 'Trying to set my own price.',
        items: [{ productId: 'p-capiz-pendant', quantity: 1, unitPrice: 1, lineTotal: 1 }],
      }),
    });
    assert.equal(body.quote.subtotal, 15400);
  });

  test('a description alone is enough, with no catalog items', async () => {
    const { status } = await call('/api/quotes', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Custom Only',
        email: 'custom@example.com',
        message: 'A built-in window seat for a 2.4 m bay, pine.',
      }),
    });
    assert.equal(status, 201);
  });

  test('rate limit trips after five submissions in a minute', async () => {
    const send = () => call('/api/quotes', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Flood Test', email: 'flood@example.com', message: 'Same request repeatedly.',
      }),
    });
    let last;
    for (let i = 0; i < 6; i += 1) last = await send();
    assert.equal(last.status, 429);
  });
});

describe('staff endpoints', () => {
  const auth = { headers: { Authorization: 'Bearer test-token' } };

  test('reject a missing or wrong token', async () => {
    assert.equal((await call('/api/quotes')).status, 401);
    assert.equal((await call('/api/quotes', { headers: { Authorization: 'Bearer nope' } })).status, 401);
  });

  test('list the pipeline with totals', async () => {
    const { status, body } = await call('/api/quotes', auth);
    assert.equal(status, 200);
    assert.ok(body.count >= 3);
    assert.ok(body.pipelineValue > 0);
    assert.equal(body.totals.new, body.count);
  });

  test('update a status by reference', async () => {
    const { body: listed } = await call('/api/quotes', auth);
    const target = listed.items[0];

    const { status, body } = await call(`/api/quotes/${target.reference}`, {
      method: 'PATCH', ...auth, body: JSON.stringify({ status: 'quoted' }),
    });
    assert.equal(status, 200);
    assert.equal(body.quote.status, 'quoted');
    assert.notEqual(body.quote.updatedAt, target.updatedAt);
  });

  test('reject an unknown status', async () => {
    const { body: listed } = await call('/api/quotes', auth);
    const { status } = await call(`/api/quotes/${listed.items[0].id}`, {
      method: 'PATCH', ...auth, body: JSON.stringify({ status: 'invented' }),
    });
    assert.equal(status, 422);
  });
});

describe('static files and errors', () => {
  // The rate-limit test above exhausted this IP's quote bucket; the 400 case
  // below posts a quote and would otherwise be answered with a 429.
  before(() => clearRateLimits());

  test('serves the frontend index', async () => {
    const res = await fetch(base + '/');
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /text\/html/);
    assert.match(await res.text(), /Decoforge/);
  });

  test('honours If-None-Match with a 304', async () => {
    const first = await fetch(base + '/');
    const again = await fetch(base + '/', { headers: { 'If-None-Match': first.headers.get('etag') } });
    assert.equal(again.status, 304);
  });

  test('refuses path traversal', async () => {
    // WHATWG URL parsing resolves a literal ../ away before we ever see it,
    // so this one lands as a plain miss inside frontend/.
    const plain = await fetch(base + '/../src/config.js');
    assert.equal(plain.status, 404);

    // Percent-encoded separators survive that normalization and have to be
    // caught by the resolved-path check in lib/static.js.
    const encoded = await fetch(base + '/..%2f..%2fetc%2fpasswd');
    assert.equal(encoded.status, 403);
  });

  test('refuses dotfiles, whatever tooling drops in frontend/', async () => {
    const publicDir = path.resolve(import.meta.dirname, '..', '..', 'frontend');
    const secret = path.join(publicDir, '.tooling-state', 'token');
    await fs.mkdir(path.dirname(secret), { recursive: true });
    await fs.writeFile(secret, 'do-not-serve-me');

    try {
      const res = await fetch(base + '/.tooling-state/token');
      assert.equal(res.status, 403);
    } finally {
      await fs.rm(path.dirname(secret), { recursive: true, force: true });
    }
  });

  test('unknown api route is a 404, wrong verb is a 405', async () => {
    assert.equal((await call('/api/nothing-here')).status, 404);
    assert.equal((await call('/api/products', { method: 'PATCH' })).status, 405);
  });

  test('malformed JSON is a 400', async () => {
    const res = await fetch(base + '/api/quotes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{ nope',
    });
    assert.equal(res.status, 400);
  });
});
