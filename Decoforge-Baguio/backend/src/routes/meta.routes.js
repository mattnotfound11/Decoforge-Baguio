/** Health and the reference data the frontend needs to render its forms. */
import { send } from '../lib/http.js';
import { store } from '../db/store.js';
import { CATEGORIES, PROJECT_TYPES, QUOTE_STATUSES, BUDGET_RANGES } from '../db/seed.js';

export function health(req, res) {
  send(res, 200, {
    status: 'ok',
    uptimeSeconds: Math.round(process.uptime()),
    products: store.products.length,
    quotes: store.quotes.length,
  });
}

export function meta(req, res) {
  send(res, 200, {
    studio: 'Decoforge Baguio',
    city: 'Baguio City, Benguet, Philippines',
    currency: 'PHP',
    categories: CATEGORIES,
    projectTypes: PROJECT_TYPES,
    budgetRanges: BUDGET_RANGES,
    quoteStatuses: QUOTE_STATUSES,
  });
}
