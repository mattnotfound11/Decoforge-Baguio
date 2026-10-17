import { getMaterial, materials, type CategoryId, type Material } from "./materials";

/**
 * The room composer's model: which finishes can go on which surface, how a
 * surface's area turns into pieces and pesos, and how a composed room travels
 * to the contact form as a short, validated `?room=` code.
 */

/** `wall` is the room's walls: the feature wall and, with it, the two sides. */
export type SurfaceId = "wall" | "ceiling" | "floor";

/**
 * How much wall a wall finish covers. Rooms composed today finish all three
 * walls (`all`); quotation links from before that cover the feature wall only
 * (`feature`), and keep meaning exactly what they priced.
 */
export type WallScope = "feature" | "all";

export const SURFACES: { id: SurfaceId; label: string; tab: string; categories: CategoryId[] }[] = [
  { id: "wall", label: "Walls", tab: "Feature wall", categories: ["uv-marble", "fluted-panels"] },
  { id: "ceiling", label: "Ceiling", tab: "Ceiling", categories: ["pvc-ceilings"] },
  { id: "floor", label: "Floor", tab: "Floor", categories: ["decking"] },
];

/** The name a surface goes by on an estimate or quotation. */
export const surfaceLabel = (surface: SurfaceId, walls: WallScope = "all") =>
  surface === "wall" && walls === "feature" ? "Feature wall" : SURFACES.find((s) => s.id === surface)!.label;

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

/**
 * The window in the left-hand wall, in metres: its centre measured from the
 * feature wall, its width, and sill and head heights. Shared by the 3D room
 * and the key plan beside it, so the two always draw the same opening.
 */
export function windowIn(d: Dims) {
  const sill = 0.9;
  return { centre: d.depth * 0.56, width: Math.min(1.6, d.depth * 0.42), sill, head: Math.min(sill + 1.4, d.height - 0.35) };
}

/**
 * Area to cover, in m². All three walls: the feature wall, the side wall, and
 * the window wall net of its opening.
 */
export function surfaceArea(surface: SurfaceId, d: Dims, walls: WallScope = "all") {
  if (surface !== "wall") return d.width * d.depth;
  if (walls === "feature") return d.width * d.height;
  const w = windowIn(d);
  return d.width * d.height + 2 * d.depth * d.height - w.width * (w.head - w.sill);
}

export function estimate(material: Material, areaM2: number) {
  const sqft = areaM2 * SQFT_PER_M2;
  const pieces = Math.ceil((sqft * (1 + WASTE)) / material.coverageSqft);
  return { sqft, pieces, cost: pieces * material.pricePhp };
}

export type RoomPlan = Dims & { picks: Partial<Record<SurfaceId, Material>>; walls: WallScope };

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const snap = (n: number) => Math.round(n * 10) / 10;

/** The canonical `?room=` code for a decoded plan, so equal rooms share one code. */
export const planCode = (plan: RoomPlan) =>
  encodeRoom({ wall: plan.picks.wall?.slug, ceiling: plan.picks.ceiling?.slug, floor: plan.picks.floor?.slug }, plan, plan.walls);

/** Marks a code whose wall finish covers all three walls. */
const ALL_WALLS = "3w";

/**
 * `wall~ceiling~floor~W~D~H~3w`, with `-` for a surface left as it is. Codes
 * without the trailing `3w` predate whole-room walls and price the feature
 * wall alone, so links already sent out keep their figures.
 */
export function encodeRoom(picks: Partial<Record<SurfaceId, string | null>>, d: Dims, walls: WallScope = "all") {
  const parts: (string | number)[] = [picks.wall ?? "-", picks.ceiling ?? "-", picks.floor ?? "-", d.width, d.depth, d.height];
  if (walls === "all") parts.push(ALL_WALLS);
  return parts.map(String).join("~");
}

/** A search param as one string; a repeated key (an array) counts as absent. */
export const oneParam = (value: string | string[] | undefined) => (typeof value === "string" ? value : undefined);

/** Parse a `?room=` code. Anything unknown or out of range is dropped, never trusted. */
export function decodeRoom(code: string | undefined): RoomPlan | null {
  if (typeof code !== "string" || !code || code.length > 200) return null;
  const parts = code.split("~");
  if (parts.length !== 6 && !(parts.length === 7 && parts[6] === ALL_WALLS)) return null;

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
    walls: parts.length === 7 ? "all" : "feature",
    // Snapped to the sliders' 0.1 m step, so the size printed on a quotation is
    // exactly the size its quantities were worked out from.
    width: snap(clamp(w, LIMITS.width.min, LIMITS.width.max)),
    depth: snap(clamp(d, LIMITS.depth.min, LIMITS.depth.max)),
    height: snap(clamp(h, LIMITS.height.min, LIMITS.height.max)),
  };
}
