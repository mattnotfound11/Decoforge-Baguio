/** Input cleaning and quote validation. Nothing here trusts the client. */
import { store } from '../db/store.js';
import { PROJECT_TYPES } from '../db/seed.js';

/** Collapse whitespace, trim, and cap length. Non-strings become ''. */
export const clean = (value, max) =>
  typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, max) : '';

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

// Philippine shapes we actually receive: +63 917 123 4567, 09171234567, (074) 442-1234
export const PHONE_RE = /^[+(\d][\d\s()+-]{6,19}$/;

const MAX_ITEMS = 20;
const MAX_QTY = 50;

/**
 * @returns {{ errors: Record<string,string>, value: object }}
 * Line prices are recomputed from the catalog, so a tampered payload cannot
 * set its own price.
 */
export function validateQuote(body) {
  const errors = {};

  const name = clean(body.name, 80);
  const email = clean(body.email, 120).toLowerCase();
  const phone = clean(body.phone, 24);
  const projectType = clean(body.projectType, 40);
  const budget = clean(body.budget, 40);
  const message = typeof body.message === 'string' ? body.message.trim().slice(0, 2000) : '';

  if (name.length < 2) errors.name = 'Tell us who to address the quote to.';
  if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address.';
  if (phone && !PHONE_RE.test(phone)) errors.phone = 'Enter a valid contact number.';
  if (projectType && !PROJECT_TYPES.includes(projectType)) {
    errors.projectType = 'Choose one of the listed project types.';
  }

  const items = [];
  const submitted = Array.isArray(body.items) ? body.items.slice(0, MAX_ITEMS) : [];

  for (const entry of submitted) {
    const product = store.findProduct(clean(entry && entry.productId, 60));
    if (!product) continue;

    const quantity = Math.min(Math.max(Math.trunc(Number(entry.quantity) || 1), 1), MAX_QTY);
    items.push({
      productId: product.id,
      name: product.name,
      unitPrice: product.price,
      quantity,
      lineTotal: product.price * quantity,
    });
  }

  if (items.length === 0 && message.length < 10) {
    errors.message = 'Pick at least one piece, or describe what you have in mind.';
  }

  return { errors, value: { name, email, phone, projectType, budget, message, items } };
}
