const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

/** ₱1,200 — the catalog quotes whole pesos, never centavos. */
export const formatPeso = (amount: number) => peso.format(amount);

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

/** Spec sheets quote per-square-foot pricing in USD for export clients. */
export const formatUsd = (amount: number) => usd.format(amount);
