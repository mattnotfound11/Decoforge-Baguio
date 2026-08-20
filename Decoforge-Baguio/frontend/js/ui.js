/** DOM and formatting helpers shared by every view. */

export const $ = (selector, root = document) => root.querySelector(selector);

/**
 * Terse element builder: el('p', { className: 'note' }, 'text', childNode).
 * Strings become text nodes, so nothing here can inject markup.
 */
export function el(tag, props = {}, ...children) {
  const node = Object.assign(document.createElement(tag), props);
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child?.nodeType ? child : document.createTextNode(String(child)));
  }
  return node;
}

const pesoFormat = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
});

export const money = (amount) => pesoFormat.format(amount || 0);

export const shortDate = (iso) =>
  new Date(iso).toLocaleDateString('en-PH', { dateStyle: 'medium' });

/** Gradient placeholder art, derived from the product's accent color. */
export const swatch = (accent) => `linear-gradient(150deg, ${accent}, ${accent}66)`;

export function toast(message) {
  const node = el('div', { className: 'toast' }, message);
  $('#toasts').append(node);
  setTimeout(() => node.remove(), 3200);
}

/** A labelled form field, wrapped so validation errors have somewhere to land. */
export function field(id, label, control, { optional = false } = {}) {
  return el('div', { className: 'field', id: `field-${id}` },
    el('label', { htmlFor: id },
      label,
      optional ? el('span', { className: 'opt' }, ' (optional)') : null),
    control);
}

export function clearFieldErrors(form) {
  form.querySelectorAll('.field.invalid').forEach((node) => node.classList.remove('invalid'));
  form.querySelectorAll('.err').forEach((node) => node.remove());
}

/** Paints server-side validation messages onto the fields that failed. */
export function showFieldErrors(details = {}) {
  for (const [key, message] of Object.entries(details)) {
    const wrapper = document.getElementById(`field-${key}`);
    if (!wrapper) continue;
    wrapper.classList.add('invalid');
    wrapper.append(el('span', { className: 'err' }, message));
  }
}

export function options(values, selected) {
  return values.map((value) => {
    const [val, label] = Array.isArray(value) ? value : [value, value];
    return el('option', { value: val, selected: val === selected }, label);
  });
}
