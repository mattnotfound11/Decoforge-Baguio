/** Boot and event wiring. Loaded as a module, so it runs after parse. */
import { api } from './api.js';
import { state, on, restoreCart, cartCount, emit } from './state.js';
import { $ } from './ui.js';
import { renderChips, loadProducts } from './catalog.js';
import { openDrawer, closeDrawer, isDrawerOpen, renderDrawer } from './quote.js';
import { openAdmin } from './admin.js';

/* --------------------------------------------------------------- wire -- */

['#openQuote', '#heroQuote', '#workshopQuote'].forEach((selector) => {
  $(selector).addEventListener('click', openDrawer);
});

$('#closeQuote').addEventListener('click', closeDrawer);
$('#scrim').addEventListener('click', closeDrawer);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && isDrawerOpen()) closeDrawer();
});

let searchTimer;
$('#search').addEventListener('input', (event) => {
  const { value } = event.target;
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    state.filters.search = value;
    loadProducts();
  }, 220);
});

$('#sort').addEventListener('change', (event) => {
  state.filters.sort = event.target.value;
  loadProducts();
});

$('#adminOpen').addEventListener('click', openAdmin);
$('#adminClose').addEventListener('click', () => $('#adminDialog').close());

// Header badge follows the cart.
on('cart', () => { $('#cartCount').textContent = String(cartCount()); });

/* --------------------------------------------------------------- boot -- */

async function init() {
  restoreCart();

  try {
    const meta = await api.meta();
    state.categories = meta.categories;
    state.projectTypes = meta.projectTypes;
    state.budgetRanges = meta.budgetRanges;
    state.quoteStatuses = meta.quoteStatuses;
  } catch {
    // The page still works if /api/meta is unreachable; forms fall back.
    state.projectTypes = ['Single piece', 'Full room', 'Whole home'];
    state.budgetRanges = ['Not sure yet'];
    state.quoteStatuses = ['new', 'reviewing', 'quoted', 'won', 'closed'];
  }

  renderChips();
  await loadProducts();

  renderDrawer();
  emit('cart');   // paint the badge and card states from the restored cart
}

init();
