/** The quote drawer: line items, the request form, and the receipt. */
import { api, ApiError } from './api.js';
import {
  state, on, cartLines, cartSubtotal, setQuantity, clearCart,
} from './state.js';
import {
  $, el, field, money, options, swatch, toast, clearFieldErrors, showFieldErrors,
} from './ui.js';

let lastFocused = null;

export function openDrawer() {
  lastFocused = document.activeElement;
  $('#drawer').classList.add('open');
  $('#drawer').setAttribute('aria-hidden', 'false');
  $('#scrim').classList.add('open');
  document.body.style.overflow = 'hidden';
  $('#closeQuote').focus();
}

export function closeDrawer() {
  $('#drawer').classList.remove('open');
  $('#drawer').setAttribute('aria-hidden', 'true');
  $('#scrim').classList.remove('open');
  document.body.style.overflow = '';
  lastFocused?.focus();
}

export function isDrawerOpen() {
  return $('#drawer').classList.contains('open');
}

/* ------------------------------------------------------------ receipt -- */

function receipt() {
  const { reference, estimatedLeadTimeDays } = state.submitted;

  return el('div', { className: 'receipt' },
    el('div', { className: 'tick', ariaHidden: 'true' }, '✓'),
    el('h3', {}, 'Quote request received'),
    el('code', {}, reference),
    el('p', { className: 'note' },
      estimatedLeadTimeDays
        ? `We reply within two business days at the email you gave us. Estimated build time for this list is ${estimatedLeadTimeDays} days.`
        : 'We reply within two business days at the email you gave us.'),
    el('p', { style: 'margin-top:18px' },
      el('button', {
        type: 'button',
        className: 'btn btn-ghost btn-sm',
        onclick: () => { state.submitted = null; renderDrawer(); },
      }, 'Start another quote')));
}

/* --------------------------------------------------------- line items -- */

function lineItem({ product, quantity }) {
  const sw = el('div', { className: 'sw' }, product.emoji || '\u{1FA91}');
  sw.style.background = swatch(product.accent);

  return el('div', { className: 'line-item' },
    sw,
    el('div', { className: 'info' },
      el('strong', {}, product.name),
      el('span', {}, `${money(product.price)} each`)),
    el('div', { className: 'qty' },
      el('button', {
        type: 'button',
        title: `Remove one ${product.name}`,
        onclick: () => setQuantity(product.id, quantity - 1),
      }, '−'),
      el('output', { ariaLabel: `Quantity of ${product.name}` }, String(quantity)),
      el('button', {
        type: 'button',
        title: `Add one ${product.name}`,
        onclick: () => setQuantity(product.id, quantity + 1),
      }, '+')));
}

/* --------------------------------------------------------------- form -- */

function quoteForm() {
  const form = el('form', { id: 'quoteForm', noValidate: true });

  const name = el('input', { type: 'text', id: 'name', name: 'name', autocomplete: 'name', required: true });
  const email = el('input', { type: 'email', id: 'email', name: 'email', autocomplete: 'email', required: true });
  const phone = el('input', { type: 'tel', id: 'phone', name: 'phone', autocomplete: 'tel', placeholder: '+63 917 000 0000' });

  const projectType = el('select', { id: 'projectType', name: 'projectType' },
    el('option', { value: '' }, 'Choose one'), ...options(state.projectTypes));

  const budget = el('select', { id: 'budget', name: 'budget' },
    el('option', { value: '' }, 'Choose one'), ...options(state.budgetRanges));

  const message = el('textarea', {
    id: 'message',
    name: 'message',
    placeholder: 'Room dimensions, preferred wood, deadline, anything you want changed from the catalog piece.',
  });

  const submit = el('button', { type: 'submit', className: 'btn btn-block' }, 'Send quote request');

  form.append(
    el('h3', { className: 'form-title' }, 'Your details'),
    el('div', { id: 'formBanner' }),
    field('name', 'Name', name),
    field('email', 'Email', email),
    field('phone', 'Contact number', phone, { optional: true }),
    el('div', { className: 'row2' },
      field('projectType', 'Project type', projectType, { optional: true }),
      field('budget', 'Budget range', budget, { optional: true })),
    field('message', 'What are we building?', message, { optional: true }),
    submit);

  form.addEventListener('submit', (event) => submitQuote(event, form, submit));
  return form;
}

async function submitQuote(event, form, submit) {
  event.preventDefault();
  clearFieldErrors(form);
  $('#formBanner').replaceChildren();

  const payload = {
    ...Object.fromEntries(new FormData(form).entries()),
    items: [...state.cart.entries()].map(([productId, quantity]) => ({ productId, quantity })),
  };

  submit.disabled = true;
  submit.textContent = 'Sending…';

  try {
    const result = await api.submitQuote(payload);
    state.submitted = result.quote;
    clearCart();                 // triggers a re-render, which shows the receipt
    toast(result.message);
    $('#drawerBody').scrollTo({ top: 0 });
  } catch (err) {
    submit.disabled = false;
    submit.textContent = 'Send quote request';

    if (err instanceof ApiError && err.details) showFieldErrors(err.details);
    $('#formBanner').replaceChildren(el('div', { className: 'banner error' }, err.message));
  }
}

/* ------------------------------------------------------------- render -- */

export function renderDrawer() {
  const body = $('#drawerBody');

  if (state.submitted) {
    body.replaceChildren(receipt());
    return;
  }

  const lines = cartLines();
  const children = [];

  if (lines.length === 0) {
    children.push(el('p', { className: 'note' },
      'Your list is empty. Add pieces from the catalog, or just describe the commission below — both work.'));
  } else {
    children.push(...lines.map(lineItem));
    children.push(el('div', { className: 'totals' },
      el('span', {}, 'Indicative subtotal'),
      el('strong', {}, money(cartSubtotal()))));
    children.push(el('p', { className: 'note' },
      'Catalog prices are for the standard size and finish. Custom dimensions, woods, and delivery outside Benguet are priced in the written quote.'));
  }

  children.push(quoteForm());
  body.replaceChildren(...children);
}

on('cart', renderDrawer);
