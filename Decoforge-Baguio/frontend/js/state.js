/**
 * Shared client state plus a two-line pub/sub, so the catalog and the quote
 * drawer can react to the same cart without importing each other.
 */

const CART_KEY = 'dfb_cart';
const TOKEN_KEY = 'dfb_admin';

export const state = {
  /** Products currently shown (filtering replaces this list). */
  products: [],
  /** Every product seen this session, so the cart can render filtered-out items. */
  catalogById: new Map(),

  categories: [],
  projectTypes: [],
  budgetRanges: [],
  quoteStatuses: [],

  filters: { category: 'all', search: '', sort: '' },

  /** productId -> quantity */
  cart: new Map(),
  /** Set after a successful submission, so the drawer shows a receipt. */
  submitted: null,

  adminToken: sessionStorage.getItem(TOKEN_KEY) || '',
};

/* ------------------------------------------------------------ pub/sub -- */

const listeners = new Map();

export function on(event, handler) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(handler);
}

export function emit(event, payload) {
  listeners.get(event)?.forEach((handler) => handler(payload));
}

/* --------------------------------------------------------------- cart -- */

export const MAX_QTY = 50;

export function cartCount() {
  return [...state.cart.values()].reduce((total, qty) => total + qty, 0);
}

export function cartLines() {
  return [...state.cart.entries()]
    .map(([id, quantity]) => {
      const product = state.catalogById.get(id);
      return product ? { product, quantity } : null;
    })
    .filter(Boolean);
}

export function cartSubtotal() {
  return cartLines().reduce((sum, { product, quantity }) => sum + product.price * quantity, 0);
}

export function addToCart(id) {
  setQuantity(id, (state.cart.get(id) || 0) + 1);
}

export function setQuantity(id, quantity) {
  if (quantity <= 0) state.cart.delete(id);
  else state.cart.set(id, Math.min(quantity, MAX_QTY));

  state.submitted = null;
  persistCart();
  emit('cart');
}

export function clearCart() {
  state.cart.clear();
  persistCart();
  emit('cart');
}

function persistCart() {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify([...state.cart]));
  } catch {
    /* private browsing: keep the cart in memory only */
  }
}

export function restoreCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    if (Array.isArray(saved)) {
      state.cart = new Map(
        saved.filter((entry) => Array.isArray(entry) && entry.length === 2 && entry[1] > 0));
    }
  } catch {
    /* malformed storage: start empty */
  }
}

/* -------------------------------------------------------------- admin -- */

export function setAdminToken(token) {
  state.adminToken = token;
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
  else sessionStorage.removeItem(TOKEN_KEY);
}
