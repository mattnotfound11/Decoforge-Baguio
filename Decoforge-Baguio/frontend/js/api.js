/** Thin fetch wrapper. Throws an Error carrying `status` and `details`. */

const BASE = ''; // same origin: the backend serves this folder

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export async function request(path, { method = 'GET', body, token } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(BASE + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Could not reach the server. Check your connection.', 0);
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = payload.error || {};
    throw new ApiError(error.message || `Request failed (${response.status})`,
      response.status, error.details);
  }

  return payload;
}

export const api = {
  meta: () => request('/api/meta'),
  products: (params) => request(`/api/products?${new URLSearchParams(params)}`),
  product: (id) => request(`/api/products/${encodeURIComponent(id)}`),
  submitQuote: (body) => request('/api/quotes', { method: 'POST', body }),
  quotes: (status, token) =>
    request(`/api/quotes?status=${encodeURIComponent(status)}`, { token }),
  updateQuote: (id, status, token) =>
    request(`/api/quotes/${encodeURIComponent(id)}`, { method: 'PATCH', body: { status }, token }),
};
