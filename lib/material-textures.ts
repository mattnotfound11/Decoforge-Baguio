import * as THREE from "three";
import { TONES, type Ramp } from "@/components/material-art";
import type { Material, Surface } from "./materials";

/**
 * Physically based textures for the room composer, drawn procedurally per
 * finish — the same colour ramps as the catalog drawings, so a finish looks
 * the same in the 3D room as on its card.
 *
 * Each finish gets an albedo (colour) map and, where the surface has relief, a
 * tangent-space normal map. Shading comes from the scene's lights acting on
 * those normals, not from shadows painted into the colour: the ribs of a
 * fluted panel catch a grazing wall-wash, the grooves of decking cast a line.
 *
 * Only imported by lib/room-stage.ts, which the page loads on demand.
 */

/** Real-world size, in metres, of one texture tile for each surface type. */
export const TILE_M: Record<Surface, [number, number]> = {
  marble: [1.22, 2.44], // one full 8 × 4 ft sheet
  fluted: [1.0, 0.75],
  ceiling: [1.2, 0.9],
  deck: [1.13, 0.85],
};

/** How each surface type answers light. Marble boards carry a hard UV-cured coat. */
export const SURFACE_FINISH: Record<Surface, { roughness: number; clearcoat?: number; normalScale: number }> = {
  marble: { roughness: 0.22, clearcoat: 0.85, normalScale: 0.6 },
  fluted: { roughness: 0.62, normalScale: 1.6 },
  ceiling: { roughness: 0.48, normalScale: 0.9 },
  deck: { roughness: 0.74, normalScale: 1.1 },
};

const PX_PER_M = 512;

export interface FinishTextures {
  map: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture | null;
}

/* ------------------------------------------------------------ helpers -- */

/** Deterministic noise, so a finish always draws the same between visits. */
function rng(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const hex = (c: string) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const mix = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * t);
const css = (c: number[]) => `rgb(${c.map((v) => Math.round(Math.max(0, Math.min(255, v)))).join(",")})`;

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!] as const;
}

/** Height field → tangent-space normal map (central differences, wrapping edges). */
function normalFromHeight(height: Float32Array, w: number, h: number, strength: number) {
  const [c, ctx] = canvas(w, h);
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const l = height[y * w + ((x - 1 + w) % w)];
      const r = height[y * w + ((x + 1) % w)];
      const u = height[((y - 1 + h) % h) * w + x];
      const d = height[((y + 1) % h) * w + x];
      let nx = (l - r) * strength;
      let ny = (d - u) * strength;
      let nz = 1;
      const len = Math.hypot(nx, ny, nz);
      nx /= len;
      ny /= len;
      nz /= len;
      const i = (y * w + x) * 4;
      img.data[i] = (nx * 0.5 + 0.5) * 255;
      img.data[i + 1] = (ny * 0.5 + 0.5) * 255;
      img.data[i + 2] = (nz * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

/** Long, low-contrast streaks: wood grain or the print of a composite board. */
function grain(ctx: CanvasRenderingContext2D, w: number, h: number, ramp: Ramp, rand: () => number, vertical: boolean, count: number) {
  const deep = hex(ramp.deep);
  const light = hex(ramp.light);
  for (let i = 0; i < count; i++) {
    const dark = rand() > 0.45;
    ctx.strokeStyle = css(dark ? deep : light);
    ctx.globalAlpha = 0.04 + rand() * 0.09;
    ctx.lineWidth = 0.6 + rand() * 1.8;
    ctx.beginPath();
    const a = rand() * (vertical ? w : h);
    const wobble = 2 + rand() * 6;
    const phase = rand() * 6;
    const len = vertical ? h : w;
    for (let t = 0; t <= len; t += 8) {
      const off = a + Math.sin(t / (40 + rand() * 4) + phase) * wobble;
      if (vertical) ctx.lineTo(off, t);
      else ctx.lineTo(t, off);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/* ----------------------------------------------------------- surfaces -- */

/** Vertical rounded ribs with a shadowed valley: the profile is in the normal map. */
function fluted(ramp: Ramp, rand: () => number, w: number, h: number) {
  const [c, ctx] = canvas(w, h);
  const base = hex(ramp.base);
  const dark = hex(ramp.dark);
  const ribs = 17;
  const pitch = w / ribs;
  const height = new Float32Array(w * h);
  for (let x = 0; x < w; x++) {
    const p = (x % pitch) / pitch;
    const onRib = p < 0.82;
    const t = onRib ? p / 0.82 : 0;
    const hgt = onRib ? Math.sin(Math.PI * t) : 0;
    // Slight darkening deep in the valley stands in for ambient occlusion.
    ctx.fillStyle = css(onRib ? mix(dark, base, 0.55 + 0.45 * Math.sqrt(hgt)) : dark);
    ctx.fillRect(x, 0, 1, h);
    for (let y = 0; y < h; y++) height[y * w + x] = hgt;
  }
  grain(ctx, w, h, ramp, rand, true, 140);
  return { color: c, normal: normalFromHeight(height, w, h, 6) };
}

/** Composite deck boards: grain along the length, a machined groove and a bevelled seam. */
function deck(ramp: Ramp, rand: () => number, w: number, h: number) {
  const [c, ctx] = canvas(w, h);
  const boards = 6;
  const pitch = h / boards;
  const height = new Float32Array(w * h);
  for (let b = 0; b < boards; b++) {
    const shade = mix(hex(ramp.base), hex(ramp.light), rand() * 0.35);
    ctx.fillStyle = css(shade);
    ctx.fillRect(0, b * pitch, w, pitch);
  }
  grain(ctx, w, h, ramp, rand, false, 260);
  for (let y = 0; y < h; y++) {
    const p = (y % pitch) / pitch;
    const seam = p > 0.94;
    const bevel = p < 0.03 ? p / 0.03 : p > 0.9 && !seam ? (0.94 - p) / 0.04 : 1;
    // Fine machined ribs on the walking face, for grip.
    const ribs = 0.08 * Math.sin(p * Math.PI * 22);
    const hgt = seam ? 0 : Math.min(1, bevel) + ribs;
    if (seam) {
      ctx.fillStyle = css(hex(ramp.deep));
      ctx.fillRect(0, y, w, 1);
    }
    for (let x = 0; x < w; x++) height[y * w + x] = hgt;
  }
  return { color: c, normal: normalFromHeight(height, w, h, 5) };
}

/** PVC ceiling boards: alternate boards a hair apart in tone, V-grooved joints. */
function ceiling(ramp: Ramp, rand: () => number, w: number, h: number) {
  const [c, ctx] = canvas(w, h);
  const boards = 6;
  const pitch = w / boards;
  const height = new Float32Array(w * h);
  for (let b = 0; b < boards; b++) {
    ctx.fillStyle = css(mix(hex(ramp.base), hex(ramp.light), b % 2 ? 0.25 : 0.45 + rand() * 0.1));
    ctx.fillRect(b * pitch, 0, pitch, h);
  }
  for (let x = 0; x < w; x++) {
    const p = (x % pitch) / pitch;
    const groove = p > 0.985 || p < 0.015;
    if (groove) {
      ctx.fillStyle = css(hex(ramp.dark));
      ctx.fillRect(x, 0, 1, h);
    }
    const hgt = groove ? 0 : 1;
    for (let y = 0; y < h; y++) height[y * w + x] = hgt;
  }
  return { color: c, normal: normalFromHeight(height, w, h, 4) };
}

/**
 * A full marble sheet: tonal clouds, then veins that wander diagonally across
 * it and branch, each a sharp core in a soft halo. The board is polished, so
 * the only relief is the V-groove where one sheet meets the next.
 */
function marble(ramp: Ramp, rand: () => number, w: number, h: number, tone: string) {
  const [c, ctx] = canvas(w, h);
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, ramp.light);
  g.addColorStop(0.5, ramp.base);
  g.addColorStop(1, ramp.light);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 12; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const r = (0.2 + rand() * 0.45) * w;
    const cloud = ctx.createRadialGradient(x, y, 0, x, y, r);
    cloud.addColorStop(0, `${ramp.dark}44`);
    cloud.addColorStop(1, `${ramp.dark}00`);
    ctx.fillStyle = cloud;
    ctx.fillRect(0, 0, w, h);
  }

  const look = {
    carrara: { vein: "#77746e", halo: "#b4b1ab", majors: 5, width: 2.2, glow: 0.4 },
    calacatta: { vein: "#9c7533", halo: "#cfb27a", majors: 3, width: 4.5, glow: 0.55 },
    nero: { vein: "#e4dfd6", halo: "#77736c", majors: 4, width: 1.8, glow: 0.35 },
  }[tone as "carrara" | "calacatta" | "nero"] ?? { vein: ramp.deep, halo: ramp.dark, majors: 4, width: 2, glow: 0.4 };

  // A vein is a random walk held to a diagonal, throwing off thinner branches.
  const heading = Math.PI / 3;
  type Vein = { pts: [number, number][]; width: number };
  const veins: Vein[] = [];
  const walk = (x: number, y: number, angle: number, steps: number, width: number, depth: number) => {
    const pts: [number, number][] = [[x, y]];
    for (let i = 0; i < steps; i++) {
      angle += (rand() - 0.5) * 0.4;
      angle = angle * 0.9 + (heading + (depth ? 0.5 : 0)) * 0.1;
      x += Math.cos(angle) * 9;
      y += Math.sin(angle) * 9;
      pts.push([x, y]);
      if (depth < 2 && rand() < 0.02) walk(x, y, angle + (rand() < 0.5 ? -1 : 1) * (0.5 + rand() * 0.5), Math.floor(steps * 0.35), width * 0.5, depth + 1);
    }
    veins.push({ pts, width });
  };
  for (let i = 0; i < look.majors; i++) walk(-0.3 * w + rand() * w, -0.15 * h + rand() * h * 0.8, heading, 170, look.width * (0.6 + rand() * 0.6), 0);
  for (let i = 0; i < 16; i++) walk(rand() * w - 0.2 * w, rand() * h - 0.1 * h, heading + (rand() - 0.5) * 0.8, 60 + Math.floor(rand() * 60), 0.5 + rand() * 0.6, 2);

  ctx.lineCap = ctx.lineJoin = "round";
  for (const { pts, width } of veins) {
    const line = () => {
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    };
    if (width > 1) {
      ctx.filter = `blur(${Math.round(width * 2)}px)`;
      line();
      ctx.strokeStyle = look.halo;
      ctx.globalAlpha = look.glow;
      ctx.lineWidth = width * 5;
      ctx.stroke();
      ctx.filter = "none";
    }
    // The core thickens and thins along its length.
    ctx.strokeStyle = look.vein;
    for (let i = 1; i < pts.length; i++) {
      ctx.globalAlpha = width > 1 ? 0.85 : 0.45;
      ctx.lineWidth = width * (0.45 + Math.abs(Math.sin(i * 0.11 + width)) * 0.8);
      ctx.beginPath();
      ctx.moveTo(pts[i - 1][0], pts[i - 1][1]);
      ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;

  // Flat, but for a fine V-groove along the sheet edges.
  const height = new Float32Array(w * h).fill(1);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) if (x < 2 || x >= w - 2 || y < 2 || y >= h - 2) height[y * w + x] = 0;
  return { color: c, normal: normalFromHeight(height, w, h, 3) };
}

/** A finish's mid-tone, for light that bounces off it. */
export const finishColor = (material: Material) => TONES[material.tone].base;

/* -------------------------------------------------------------- cache -- */

const cache = new Map<string, FinishTextures>();

/**
 * Textures for a finish, built once per page and shared. Callers clone them
 * per surface (clones share the image, so only repeat differs).
 */
export function finishTextures(material: Material, maxAnisotropy: number): FinishTextures {
  const hit = cache.get(material.slug);
  if (hit) return hit;

  const ramp = TONES[material.tone];
  const rand = rng(material.slug);
  const [tw, th] = TILE_M[material.surface];
  const w = Math.round(tw * PX_PER_M);
  const h = Math.round(th * PX_PER_M);

  const drawn =
    material.surface === "fluted"
      ? fluted(ramp, rand, w, h)
      : material.surface === "deck"
        ? deck(ramp, rand, w, h)
        : material.surface === "ceiling"
          ? ceiling(ramp, rand, w, h)
          : marble(ramp, rand, w, h, material.tone);

  const map = new THREE.CanvasTexture(drawn.color);
  map.colorSpace = THREE.SRGBColorSpace;
  const normalMap = drawn.normal ? new THREE.CanvasTexture(drawn.normal) : null;
  for (const t of [map, normalMap]) {
    if (!t) continue;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = maxAnisotropy;
  }

  const out = { map, normalMap };
  cache.set(material.slug, out);
  return out;
}
