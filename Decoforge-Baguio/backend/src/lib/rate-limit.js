/**
 * In-memory sliding window, keyed by bucket name and client IP.
 *
 * Per process and reset on restart: behind more than one instance, enforce
 * limits at the proxy instead.
 */
const hits = new Map();

export function rateLimited(req, bucket, { max, windowMs }) {
  const ip = req.socket.remoteAddress || 'unknown';
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);

  if (recent.length >= max) {
    hits.set(key, recent);
    return true;
  }

  recent.push(now);
  hits.set(key, recent);
  return false;
}

/** Periodic sweep so the map cannot grow without bound. */
const sweeper = setInterval(() => {
  const cutoff = Date.now() - 10 * 60 * 1000;
  for (const [key, stamps] of hits) {
    const live = stamps.filter((t) => t > cutoff);
    if (live.length) hits.set(key, live);
    else hits.delete(key);
  }
}, 5 * 60 * 1000);
sweeper.unref();

export const _clear = () => hits.clear();
