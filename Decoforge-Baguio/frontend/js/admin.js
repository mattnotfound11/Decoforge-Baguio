/** Staff dialog: sign in with the shared token, then work the pipeline. */
import { api, ApiError } from './api.js';
import { state, setAdminToken } from './state.js';
import { $, el, field, money, options, shortDate, toast } from './ui.js';

export function openAdmin() {
  $('#adminDialog').showModal();
  if (state.adminToken) loadQuotes();
  else renderSignIn();
}

function renderSignIn(message) {
  const body = $('#adminBody');
  const input = el('input', {
    type: 'password', id: 'adminToken', autocomplete: 'off', placeholder: 'Admin token',
  });

  const form = el('form', {},
    message ? el('div', { className: 'banner error' }, message) : null,
    el('p', { className: 'note', style: 'margin-bottom:14px' },
      'Staff only. In development the token is "decoforge-dev-token"; in production the server reads ADMIN_TOKEN from its environment.'),
    field('adminToken', 'Token', input),
    el('button', { type: 'submit', className: 'btn' }, 'Sign in'));

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    setAdminToken(input.value.trim());
    loadQuotes();
  });

  body.replaceChildren(form);
  input.focus();
}

async function loadQuotes(status = 'all') {
  const body = $('#adminBody');
  body.replaceChildren(el('p', { className: 'note' }, 'Loading quotes…'));

  try {
    renderPipeline(await api.quotes(status, state.adminToken), status);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      setAdminToken('');
      renderSignIn('That token was not accepted.');
    } else {
      body.replaceChildren(el('div', { className: 'banner error' }, err.message));
    }
  }
}

function statusSelect(quote) {
  const select = el('select', {}, ...options(state.quoteStatuses, quote.status));

  select.addEventListener('change', async () => {
    const previous = quote.status;
    select.disabled = true;
    try {
      const result = await api.updateQuote(quote.id, select.value, state.adminToken);
      quote.status = select.value;
      toast(result.message);
    } catch (err) {
      select.value = previous;
      toast(err.message);
    } finally {
      select.disabled = false;
    }
  });

  return select;
}

function quoteRow(quote) {
  const summary = quote.items.length
    ? quote.items.map((item) => `${item.quantity}× ${item.name}`).join(', ')
    : '— custom brief —';

  return el('tr', {},
    el('td', {},
      el('strong', {}, quote.reference),
      el('div', { className: 'sub' }, shortDate(quote.createdAt))),
    el('td', {},
      el('strong', {}, quote.name),
      el('div', { className: 'sub' }, quote.email),
      quote.phone ? el('div', { className: 'sub' }, quote.phone) : null),
    el('td', {},
      el('div', {}, summary),
      quote.message ? el('div', { className: 'sub', style: 'margin-top:4px' }, quote.message) : null),
    el('td', {}, money(quote.subtotal)),
    el('td', {}, statusSelect(quote)));
}

function renderPipeline(data, activeStatus) {
  const summary = el('div', { className: 'pipeline' },
    el('span', { className: 'pill' }, `${data.count} shown`),
    el('span', { className: 'pill' }, `${money(data.pipelineValue)} indicative value`),
    ...Object.entries(data.totals).map(([status, n]) =>
      el('span', { className: 'pill' }, `${status}: ${n}`)));

  const filter = el('select', { style: 'max-width:200px;margin-bottom:16px' },
    ...options([['all', 'All statuses'], ...state.quoteStatuses], activeStatus));
  filter.addEventListener('change', () => loadQuotes(filter.value));

  const rows = data.items.map(quoteRow);
  const table = el('table', {},
    el('thead', {}, el('tr', {},
      ...['Reference', 'Client', 'Request', 'Subtotal', 'Status']
        .map((heading) => el('th', {}, heading)))),
    el('tbody', {}, ...(rows.length
      ? rows
      : [el('tr', {}, el('td', { colSpan: 5 }, 'No quotes with that status yet.'))])));

  $('#adminBody').replaceChildren(summary, filter, el('div', { className: 'table-scroll' }, table));
}
