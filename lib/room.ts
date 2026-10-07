import { getMaterial, materials, type CategoryId, type Material } from "./materials";

/**
 * The room composer's model: which finishes can go on which surface, how a
 * surface's area turns into pieces and pesos, and how a composed room travels
 * to the contact form as a short, validated `?room=` code.
 */

export type SurfaceId = "wall" | "ceiling" | "floor";

export const SURFACES: { id: SurfaceId; label: string; categories: CategoryId[] }[] = [
  { id: "wall", label: "Feature wall", categories: ["uv-marble", "fluted-panels"] },
  { id: "ceiling", label: "Ceiling", categories: ["pvc-ceilings"] },
  { id: "floor", label: "Floor", categories: ["decking"] },
];

/** Finishes that can be laid on a surface. Linear trims have no coverage, so they are left out. */
export const optionsFor = (surface: SurfaceId): Material[] => {
  const cats = SURFACES.find((s) => s.id === surface)!.categories;
  return materials.filter((m) => cats.includes(m.category) && m.coverageSqft > 0);
};

export const LIMITS = {
  width: { min: 2, max: 8, step: 0.1 },
  depth: { min: 2, max: 8, step: 0.1 },
  height: { min: 2.2, max: 4, step: 0.1 },
} as const;

export type Dims = { width: number; depth: number; height: number };

export const SQFT_PER_M2 = 10.7639;
/** Cutting and fitting allowance on top of the bare area. */
export const WASTE = 0.08;

export function surfaceArea(surface: SurfaceId, d: Dims) {
  return surface === "wall" ? d.width * d.height : d.width * d.depth;
}

export function estimate(material: Material, areaM2: number) {
  const sqft = areaM2 * SQFT_PER_M2;
  const pieces = Math.ceil((sqft * (1 + WASTE)) / material.coverageSqft);
  return { sqft, pieces, cost: pieces * material.pricePhp };
}

export type RoomPlan = Dims & { picks: Partial<Record<SurfaceId, Material>> };

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const snap = (n: number) => Math.round(n * 10) / 10;

/** The canonical `?room=` code for a decoded plan, so equal rooms share one code. */
export const planCode = (plan: RoomPlan) =>
  encodeRoom(
    { wall: plan.picks.wall?.slug ?? null, ceiling: plan.picks.ceiling?.slug ?? null, floor: plan.picks.floor?.slug ?? null },
    plan,
  );

/** `wall~ceiling~floor~W~D~H`, with `-` for a surface left as it is. */
export function encodeRoom(picks: Partial<Record<SurfaceId, string | null>>, d: Dims) {
  return [picks.wall ?? "-", picks.ceiling ?? "-", picks.floor ?? "-", d.width, d.depth, d.height]
    .map(String)
    .join("~");
}

/** A search param as one string; a repeated key (an array) counts as absent. */
export const oneParam = (value: string | string[] | undefined) => (typeof value === "string" ? value : undefined);

/** Parse a `?room=` code. Anything unknown or out of range is dropped, never trusted. */
export function decodeRoom(code: string | undefined): RoomPlan | null {
  if (typeof code !== "string" || !code || code.length > 200) return null;
  const parts = code.split("~");
  if (parts.length !== 6) return null;

  const [w, d, h] = parts.slice(3).map(Number);
  if (![w, d, h].every(Number.isFinite)) return null;

  const picks: RoomPlan["picks"] = {};
  (["wall", "ceiling", "floor"] as const).forEach((surface, i) => {
    const m = getMaterial(parts[i]);
    if (m && optionsFor(surface).includes(m)) picks[surface] = m;
  });
  if (Object.keys(picks).length === 0) return null;

  return {
    picks,
    // Snapped to the sliders' 0.1 m step, so the size printed on a quotation is
    // exactly the size its quantities were worked out from.
    width: snap(clamp(w, LIMITS.width.min, LIMITS.width.max)),
    depth: snap(clamp(d, LIMITS.depth.min, LIMITS.depth.max)),
    height: snap(clamp(h, LIMITS.height.min, LIMITS.height.max)),
  };
}
