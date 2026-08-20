const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

/** ₱1,200 — every price on the site is quoted in Philippine pesos. */
export const formatPeso = (amount: number) => peso.format(amount);

/** ₱62 — rounded to the nearest peso for per-square-foot rates. */
export const formatPesoRate = (amount: number) => peso.format(Math.round(amount));

/**
 * Rate per square foot, derived from the piece price and the panel's coverage
 * so the two figures can never drift apart.
 */
export const pesoPerSqft = (pricePhp: number, coverageSqft: number) =>
  coverageSqft > 0 ? pricePhp / coverageSqft : 0;
