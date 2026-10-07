import { todayInManila } from "./booking";
import { estimate, surfaceArea, SURFACES, SQFT_PER_M2, type RoomPlan } from "./room";
import type { Material } from "./materials";

/**
 * The online quotation: line items for a composed room, priced from the same
 * estimate the room composer and the contact form use, so all three agree.
 *
 * A quotation is an offer, not proof of payment. It is deliberately not styled
 * or numbered as a BIR Official Receipt — those must be registered and are
 * issued only after payment.
 */

/** Days a quotation holds its prices. */
export const QUOTE_VALID_DAYS = 15;

export interface QuoteLine {
  n: number;
  surface: string;
  material: Material;
  areaM2: number;
  areaSqft: number;
  qty: number;
  unitLabel: string;
  unitPrice: number;
  amount: number;
}

export interface Quotation {
  reference: string;
  /** YYYY-MM-DD, Manila time. */
  issued: string;
  validUntil: string;
  plan: RoomPlan;
  lines: QuoteLine[];
  subtotal: number;
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;

const toDate = (iso: string) => new Date(`${iso}T12:00:00Z`);
const toIso = (d: Date) => d.toISOString().slice(0, 10);

export function addDays(iso: string, days: number) {
  const d = toDate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return toIso(d);
}

/**
 * The issue date carried in a quotation link. Anything malformed, impossible,
 * in the future, or older than the validity window falls back to today, so a
 * link can't be edited into a backdated or future-dated quotation.
 */
export function parseIssued(value: string | undefined) {
  const today = todayInManila();
  // The round trip rejects impossible dates such as 2026-02-30, which Date
  // would otherwise roll over into March.
  if (!value || !ISO.test(value) || Number.isNaN(toDate(value).getTime()) || toIso(toDate(value)) !== value) return today;
  // A quotation can't be dated in the future, or further back than it stays valid.
  if (value > today || value < addDays(today, -QUOTE_VALID_DAYS)) return today;
  return value;
}

/** No 0/O, 1/I/L or U, so a reference reads back unambiguously over the phone. */
const REF_ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";

/** Short, stable reference: same plan and date, same number. */
export function quoteReference(roomCode: string, issued: string) {
  let h = 0x811c9dc5;
  for (const ch of `${roomCode}|${issued}`) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += REF_ALPHABET[h % REF_ALPHABET.length];
    h = Math.floor(h / REF_ALPHABET.length);
  }
  return `DFQ-${issued.slice(2).replace(/-/g, "")}-${code}`;
}

/**
 * True when `reference` is the one this room code was issued under: the date
 * is read back out of the reference and the hash recomputed.
 */
export function referenceMatches(roomCode: string, reference: string) {
  const d = /^DFQ-(\d{2})(\d{2})(\d{2})-/.exec(reference);
  return !!d && quoteReference(roomCode, `20${d[1]}-${d[2]}-${d[3]}`) === reference;
}

/** Accepts only a reference in the exact shape `quoteReference` produces. */
export const isQuoteReference = (value: string | undefined): value is string =>
  !!value && /^DFQ-\d{6}-[2-9A-HJKMNP-TV-Z]{5}$/.test(value);

const plural = (unit: string, n: number) => (n === 1 ? unit : unit === "pc" ? "pcs" : `${unit}s`);

export function buildQuotation(plan: RoomPlan, roomCode: string, issued: string): Quotation {
  const lines: QuoteLine[] = [];
  for (const s of SURFACES) {
    const m = plan.picks[s.id];
    if (!m) continue;
    const areaM2 = surfaceArea(s.id, plan);
    const e = estimate(m, areaM2);
    lines.push({
      n: lines.length + 1,
      surface: s.label,
      material: m,
      areaM2,
      areaSqft: areaM2 * SQFT_PER_M2,
      qty: e.pieces,
      unitLabel: plural(m.unit, e.pieces),
      unitPrice: m.pricePhp,
      amount: e.cost,
    });
  }

  return {
    reference: quoteReference(roomCode, issued),
    issued,
    validUntil: addDays(issued, QUOTE_VALID_DAYS),
    plan,
    lines,
    subtotal: lines.reduce((sum, l) => sum + l.amount, 0),
  };
}

/** October 7, 2026 — the long form used on Philippine business documents. */
export const formatLongDate = (iso: string) =>
  new Intl.DateTimeFormat("en-PH", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(toDate(iso));
