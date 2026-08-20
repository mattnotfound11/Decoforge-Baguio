/**
 * Live stock availability.
 *
 * By default this serves the baseline counts held in lib/materials.ts. Point
 * INVENTORY_URL at an endpoint that returns `{ "<slug>": <count>, ... }` and
 * this module will read from it instead — that is the only change needed to
 * put the site on a real inventory system.
 */
import { materials } from "./materials";

export type StockStatus = "in-stock" | "low-stock" | "out-of-stock";

export interface StockLevel {
  slug: string;
  onHand: number;
  status: StockStatus;
  label: string;
}

export interface StockSnapshot {
  levels: Record<string, StockLevel>;
  /** ISO timestamp the snapshot was taken; the UI shows this as "updated Xs ago". */
  checkedAt: string;
  source: "inventory-api" | "baseline";
}

const LOW_STOCK_AT = 12;

export function statusFor(onHand: number): StockStatus {
  if (onHand <= 0) return "out-of-stock";
  if (onHand <= LOW_STOCK_AT) return "low-stock";
  return "in-stock";
}

const LABEL: Record<StockStatus, string> = {
  "in-stock": "In Stock",
  "low-stock": "Low Stock",
  "out-of-stock": "Out of Stock",
};

const toLevel = (slug: string, onHand: number): StockLevel => {
  const status = statusFor(onHand);
  return { slug, onHand, status, label: LABEL[status] };
};

/** Reads the upstream inventory feed, or falls back to the catalog baseline. */
export async function getStockSnapshot(): Promise<StockSnapshot> {
  const baseline = Object.fromEntries(
    materials.map((m) => [m.slug, toLevel(m.slug, m.baselineStock)]),
  );

  const url = process.env.INVENTORY_URL;
  if (!url) {
    return { levels: baseline, checkedAt: new Date().toISOString(), source: "baseline" };
  }

  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: process.env.INVENTORY_TOKEN
        ? { Authorization: `Bearer ${process.env.INVENTORY_TOKEN}` }
        : undefined,
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error(`inventory feed responded ${res.status}`);

    const counts = (await res.json()) as Record<string, number>;
    const levels = { ...baseline };
    for (const [slug, onHand] of Object.entries(counts)) {
      if (levels[slug] && Number.isFinite(onHand)) levels[slug] = toLevel(slug, Number(onHand));
    }
    return { levels, checkedAt: new Date().toISOString(), source: "inventory-api" };
  } catch {
    // A feed outage must never take the catalog down; fall back to baseline.
    return { levels: baseline, checkedAt: new Date().toISOString(), source: "baseline" };
  }
}
