/** Category chips, the product grid, and the filtered fetch behind them. */
import { api } from './api.js';
import { state, addToCart, on } from './state.js';
import { $, el, money, swatch, toast } from './ui.js';

export function renderChips() {
  const container = $('#categoryChips');
  const all = [{ id: 'all', label: 'Everything' }, ...state.categories];

  container.replaceChildren(...all.map((category) => {
    const chip = el('button', {
      type: 'button',
      className: 'chip',
      onclick: () => {
        state.filters.category = category.id;
        renderChips();
        loadProducts();
      },
    }, category.label);

    chip.setAttribute('aria-pressed', String(state.filters.category === category.id));
    return chip;
  }));
}

function categoryLabel(id) {
  return state.categories.find((c) => c.id === id)?.label || id;
}

function productCard(product) {
  const inCart = state.cart.has(product.id);

  const thumb = el('div', { className: 'thumb' },
    el('span', { className: 'tag' }, categoryLabel(product.category)),
    el('span', { ariaHidden: 'true' }, product.emoji || '\u{1FA91}'));
  thumb.style.background = swatch(product.accent);

  const action = el('button', {
    type: 'button',
    className: inCart ? 'btn btn-ghost btn-sm' : 'btn btn-sm',
    onclick: () => {
      addToCart(product.id);
      toast(`${product.name} added to your quote list.`);
    },
  }, inCart ? 'In your list' : 'Add to quote');

  return el('article', { className: 'card' },
    thumb,
    el('div', { className: 'card-body' },
      el('h3', {}, product.name),
      el('p', { className: 'desc' }, product.description),
      el('div', { className: 'meta' },
        el('span', {}, `${product.leadTimeDays} day lead time`),
        el('span', {}, product.dimensions)),
      el('div', { className: 'meta' }, (product.materials || []).join(' · ')),
      el('div', { className: 'card-foot' },
        el('span', { className: 'price' }, money(product.price)),
        action)));
}

export function renderGrid() {
  const grid = $('#grid');
  grid.setAttribute('aria-busy', 'false');

  if (state.products.length === 0) {
    grid.replaceChildren(el('div', { className: 'empty' },
      el('p', {}, 'Nothing matches those filters yet.'),
      el('p', {}, 'We build outside the catalog too — start a quote and describe it.')));
    return;
  }

  grid.replaceChildren(...state.products.map(productCard));
}

/** Guards against a slow response overwriting a newer one. */
let requestToken = 0;

export async function loadProducts() {
  const mine = ++requestToken;
  const grid = $('#grid');
  grid.setAttribute('aria-busy', 'true');

  const params = {};
  if (state.filters.category !== 'all') params.category = state.filters.category;
  if (state.filters.search) params.search = state.filters.search;
  if (state.filters.sort) params.sort = state.filters.sort;

  try {
    const data = await api.products(params);
    if (mine !== requestToken) return;

    state.products = data.items;
    data.items.forEach((product) => state.catalogById.set(product.id, product));
    if (data.categories?.length) state.categories = data.categories;

    renderGrid();
  } catch (err) {
    if (mine !== requestToken) return;

    grid.setAttribute('aria-busy', 'false');
    grid.replaceChildren(el('div', { className: 'empty' },
      el('p', {}, 'The catalog could not be loaded.'),
      el('p', {}, err.message),
      el('button', { type: 'button', className: 'btn btn-sm', onclick: loadProducts }, 'Try again')));
  }
}

// Card buttons show whether a piece is already in the list.
on('cart', renderGrid);
