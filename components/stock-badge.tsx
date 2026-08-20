"use client";

import { statusFor, type StockStatus } from "@/lib/stock";
import { useStock } from "@/lib/use-stock";

const STYLES: Record<StockStatus, string> = {
  "in-stock": "bg-white/95 text-ink ring-1 ring-black/5",
  "low-stock": "bg-[#fde7e3] text-[#9c3013] ring-1 ring-[#9c3013]/15",
  "out-of-stock": "bg-ink/85 text-white/90 ring-1 ring-white/10",
};

const DOT: Record<StockStatus, string> = {
  "in-stock": "bg-[#2f8f5b]",
  "low-stock": "bg-[#c2410c]",
  "out-of-stock": "bg-white/50",
};

/**
 * Falls back to the server-rendered baseline until the live poll lands, so the
 * badge never flashes empty on first paint.
 */
export function StockBadge({
  slug,
  fallback,
  showCount = false,
}: {
  slug: string;
  fallback: number;
  showCount?: boolean;
}) {
  const snapshot = useStock();
  const level = snapshot?.levels[slug];

  const onHand = level?.onHand ?? fallback;
  const status = level?.status ?? statusFor(fallback);
  const label = level?.label ?? (status === "in-stock" ? "In Stock" : status === "low-stock" ? "Low Stock" : "Out of Stock");

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold ${STYLES[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[status]}`} aria-hidden="true" />
      {label}
      {showCount && status !== "out-of-stock" && (
        <span className="font-normal opacity-70">· {onHand} pcs</span>
      )}
    </span>
  );
}
