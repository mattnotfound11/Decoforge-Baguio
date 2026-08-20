"use client";

import { useEffect, useState } from "react";
import type { StockSnapshot } from "./stock";

/**
 * One poller for the whole page.
 *
 * Every badge and product page subscribes to the same module-level snapshot,
 * so ten cards on screen still make one request every REFRESH_MS.
 */

const REFRESH_MS = 30_000;

let snapshot: StockSnapshot | null = null;
let inFlight: Promise<void> | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
const subscribers = new Set<(s: StockSnapshot | null) => void>();

async function refresh() {
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const res = await fetch("/api/stock", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      snapshot = (await res.json()) as StockSnapshot;
      subscribers.forEach((fn) => fn(snapshot));
    } catch {
      // Keep showing the last good snapshot rather than blanking the badges.
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

export function useStock() {
  const [value, setValue] = useState<StockSnapshot | null>(snapshot);

  useEffect(() => {
    subscribers.add(setValue);
    void refresh();

    if (!timer) timer = setInterval(() => void refresh(), REFRESH_MS);

    return () => {
      subscribers.delete(setValue);
      if (subscribers.size === 0 && timer) {
        clearInterval(timer);
        timer = null;
      }
    };
  }, []);

  return value;
}

/** "just now" / "2m ago" — shown next to the live availability readout. */
export function useAgo(iso: string | undefined) {
  const [, tick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 10_000);
    return () => clearInterval(id);
  }, []);

  if (!iso) return "";
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 20) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  return minutes < 60 ? `${minutes}m ago` : `${Math.round(minutes / 60)}h ago`;
}
