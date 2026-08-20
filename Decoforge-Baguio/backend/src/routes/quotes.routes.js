/** Quote requests: public submission, staff pipeline. */
import crypto from 'node:crypto';
import { send, fail, readJSONBody, HttpError } from '../lib/http.js';
import { rateLimited } from '../lib/rate-limit.js';
import { requireAdmin } from '../lib/auth.js';
import { validateQuote, clean } from '../lib/validate.js';
import { store } from '../db/store.js';
import { QUOTE_STATUSES } from '../db/seed.js';
import { config } from '../config.js';
import { logger } from '../logger.js';

/** Human-quotable reference: DFB-YYMMDD-XXXX. */
function makeReference() {
  const stamp = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  return `DFB-${stamp}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
}

export async function create(req, res) {
  if (rateLimited(req, 'quote', config.rateLimits.quote)) {
    throw new HttpError(429, 'Too many requests. Please try again in a minute.');
  }

  const body = await readJSONBody(req);
  const { errors, value } = validateQuote(body);

  if (Object.keys(errors).length > 0) {
    return fail(res, 422, 'Some fields need attention.', errors);
  }

  const subtotal = value.items.reduce((sum, item) => sum + item.lineTotal, 0);
  const estimatedLeadTimeDays = value.items.reduce((max, item) => {
    const product = store.findProduct(item.productId);
    return Math.max(max, product ? product.leadTimeDays : 0);
  }, 0);

  const now = new Date().toISOString();
  const quote = {
    id: crypto.randomUUID(),
    reference: makeReference(),
    ...value,
    subtotal,
    currency: 'PHP',
    estimatedLeadTimeDays,
    status: 'new',
    createdAt: now,
    updatedAt: now,
  };

  await store.addQuote(quote);
  logger.info(`quote ${quote.reference} from ${quote.email} (PHP ${subtotal.toLocaleString('en-PH')})`);

  // Deliberately narrow: the client gets back only what it needs to confirm.
  send(res, 201, {
    message: 'Quote request received. We reply within two business days.',
    quote: {
      reference: quote.reference,
      subtotal: quote.subtotal,
      estimatedLeadTimeDays: quote.estimatedLeadTimeDays,
      itemCount: quote.items.length,
      createdAt: quote.createdAt,
    },
  });
}

export function list(req, res, { url }) {
  requireAdmin(req);

  const status = clean(url.searchParams.get('status'), 20);
  const items = status && status !== 'all'
    ? store.quotes.filter((q) => q.status === status)
    : store.quotes;

  const totals = Object.fromEntries(
    QUOTE_STATUSES.map((s) => [s, store.quotes.filter((q) => q.status === s).length]));

  send(res, 200, {
    count: items.length,
    totals,
    pipelineValue: items.reduce((sum, q) => sum + q.subtotal, 0),
    items: items.slice(0, 200),
  });
}

export async function update(req, res, { params }) {
  requireAdmin(req);

  const quote = store.findQuote(params.id);
  if (!quote) throw new HttpError(404, 'No such quote.');

  const body = await readJSONBody(req);
  const status = clean(body.status, 20);
  if (!QUOTE_STATUSES.includes(status)) {
    throw new HttpError(422, 'Unknown status.', { allowed: QUOTE_STATUSES });
  }

  quote.status = status;
  quote.updatedAt = new Date().toISOString();
  await store.save();

  send(res, 200, { message: `Quote ${quote.reference} marked ${status}.`, quote });
}
