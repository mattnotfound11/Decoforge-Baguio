/** Single shared bearer token for the staff endpoints. */
import crypto from 'node:crypto';
import { config } from '../config.js';
import { HttpError } from './http.js';

export function isAdmin(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  const expected = Buffer.from(config.adminToken);
  const given = Buffer.from(token);

  // timingSafeEqual throws on a length mismatch, so check length first.
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
}

export function requireAdmin(req) {
  if (!isAdmin(req)) throw new HttpError(401, 'Admin token required.');
}
