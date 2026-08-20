/** Catalog reads. Filtering and sorting happen here, not in the browser. */
import { send, HttpError } from '../lib/http.js';
import { store } from '../db/store.js';
import { clean } from '../lib/validate.js';
import { CATEGORIES } from '../db/seed.js';

export function list(req, res, { url }) {
  const search = clean(url.searchParams.get('search'), 60).toLowerCase();
  const category = clean(url.searchParams.get('category'), 30).toLowerCase();
  const maxPrice = Number(url.searchParams.get('maxPrice'));
  const sort = clean(url.searchParams.get('sort'), 20);

  let items = store.products.slice();

  if (category && category !== 'all') {
    items = items.filter((p) => p.category === category);
  }

  if (search) {
    items = items.filter((p) =>
      [p.name, p.description, p.category, ...(p.materials || [])]
        .join(' ')
        .toLowerCase()
        .includes(search));
  }

  if (Number.isFinite(maxPrice) && maxPrice > 0) {
    items = items.filter((p) => p.price <= maxPrice);
  }

  switch (sort) {
    case 'price-asc': items.sort((a, b) => a.price - b.price); break;
    case 'price-desc': items.sort((a, b) => b.price - a.price); break;
    case 'lead-time': items.sort((a, b) => a.leadTimeDays - b.leadTimeDays); break;
    case 'name': items.sort((a, b) => a.name.localeCompare(b.name)); break;
    default: items.sort((a, b) => Number(b.featured) - Number(a.featured));
  }

  send(res, 200, { count: items.length, categories: CATEGORIES, items });
}

export function detail(req, res, { params }) {
  const product = store.findProduct(params.id);
  if (!product) throw new HttpError(404, 'No such product.');

  const related = store.products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 3)
    .map(({ id, name, price, emoji, accent }) => ({ id, name, price, emoji, accent }));

  send(res, 200, { item: product, related });
}
