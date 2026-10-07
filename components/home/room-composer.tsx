"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { MaterialArt } from "@/components/material-art";
import { formatPeso } from "@/lib/format";
import { getMaterial, type Material, type Surface } from "@/lib/materials";
import { getLenis } from "@/lib/smooth";
import {
  encodeRoom,
  estimate,
  LIMITS,
  optionsFor,
  surfaceArea,
  SURFACES,
  WASTE,
  type Dims,
  type SurfaceId,
} from "@/lib/room";

/**
 * Room composer: a real CSS 3D room whose wall, ceiling and floor take any
 * finish from the catalog, at true scale, with a live peso estimate beside it.
 *
 * The room is built from six transformed planes around a zero-size origin, so
 * the browser does the perspective — no canvas, no WebGL, and every sample is
 * the same SVG the catalog draws.
 */

/** Real-world size, in metres, of one MaterialArt tile for each surface type. */
const TILE_M: Record<Surface, [number, number]> = {
  marble: [1.22, 2.44], // one full 8 × 4 ft sheet
  fluted: [1.0, 0.75],
  ceiling: [1.2, 0.9],
  deck: [1.13, 0.85],
};

const DEFAULT_PICKS: Record<SurfaceId, string | null> = {
  wall: "mahogany-fluted-panel",
  ceiling: "matte-white-flat",
  floor: "cedar-composite",
};

/** Largest room, in px, before the stage scales it to fit. */
const BOX = { w: 600, h: 380, d: 600 };
/** Stage size the room is composed for; larger or smaller stages scale it (capped at 1.25×). */
const STAGE = { w: 680, h: 400, maxScale: 1.25 };

export function RoomComposer() {
  const [picks, setPicks] = useState(DEFAULT_PICKS);
  const [dims, setDims] = useState<Dims>({ width: 4.2, depth: 5, height: 2.7 });
  const [tab, setTab] = useState<SurfaceId>("wall");

  const stageRef = useRef<HTMLDivElement>(null);
  const roomRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(1);

  // "Try it in the room" from the sample book lands here.
  useEffect(() => {
    const onCompose = (e: Event) => {
      const { surface, slug } = (e as CustomEvent<{ surface: SurfaceId; slug: string }>).detail;
      if (!optionsFor(surface).some((m) => m.slug === slug)) return;
      setTab(surface);
      setPicks((p) => ({ ...p, [surface]: slug }));
      const target = document.getElementById("composer");
      if (!target) return;
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(target, { offset: -40, duration: 1.6 });
      else target.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    window.addEventListener("df:compose", onCompose);
    return () => window.removeEventListener("df:compose", onCompose);
  }, []);

  // Fit the room into whatever width the stage has.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setFit(Math.min(STAGE.maxScale, entry.contentRect.width / STAGE.w, entry.contentRect.height / STAGE.h)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Pointer parallax, eased toward the cursor. The loop only runs while the
  // room is still moving and stops once it settles, so scrolling past it
  // costs nothing. Writes the rotation straight to its own element (not via
  // inherited custom properties), so a frame restyles one node, not the room.
  useEffect(() => {
    const stage = stageRef.current;
    const room = roomRef.current;
    if (!stage || !room) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let tx = 0, ty = 0, x = 0, y = 0, raf = 0;

    const frame = () => {
      x += (tx - x) * 0.09;
      y += (ty - y) * 0.09;
      room.style.transform = `rotateX(${(-4 - y * 5).toFixed(3)}deg) rotateY(${(x * 11).toFixed(3)}deg)`;
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.002 ? requestAnimationFrame(frame) : 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return; // touch drags are for scrolling
      const r = stage.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      kick();
    };
    const onLeave = () => {
      tx = 0;
      ty = 0;
      kick();
    };

    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  // Keep the room's proportions true to the dimensions, inside a fixed box.
  const pxPerM = Math.min(BOX.w / dims.width, BOX.h / dims.height, BOX.d / dims.depth);
  const W = dims.width * pxPerM;
  const H = dims.height * pxPerM;
  const D = dims.depth * pxPerM;

  const chosen = useMemo(() => {
    const out: Partial<Record<SurfaceId, Material>> = {};
    for (const s of SURFACES) {
      const m = picks[s.id] ? getMaterial(picks[s.id]!) : undefined;
      if (m) out[s.id] = m;
    }
    return out;
  }, [picks]);

  const lines = SURFACES.map((s) => {
    const m = chosen[s.id];
    return { surface: s, material: m, ...(m ? estimate(m, surfaceArea(s.id, dims)) : null) };
  });
  const total = lines.reduce((sum, l) => sum + (l.cost ?? 0), 0);
  const quoteHref = `/quote?room=${encodeURIComponent(encodeRoom(picks, dims))}`;

  const activeSurface = SURFACES.find((s) => s.id === tab)!;

  return (
    <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr] lg:gap-6">
      {/* ------------------------------------------------------- stage -- */}
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-2 lg:h-[620px]" data-reveal>
        <div
          ref={stageRef}
          className="relative h-[clamp(320px,56vw,460px)] overflow-hidden lg:h-full rounded-[calc(2rem-0.5rem)] bg-[radial-gradient(120%_90%_at_50%_30%,#2b211c_0%,#120d0b_70%)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] [perspective:900px]"
          role="group"
          aria-label="3D preview of the composed room"
        >
          <div className="absolute left-1/2 top-[calc(50%-16px)] [transform-style:preserve-3d]" style={{ transform: `scale(${fit})` }}>
            <div className="[transform-style:preserve-3d]" style={{ transform: `translateZ(-${D * 0.18}px)` }}>
            <div ref={roomRef} className="room [transform-style:preserve-3d]" style={{ transform: "rotateX(-4deg)" }}>
              {/* Back wall: the feature wall. */}
              <Plane w={W} h={H} transform={`translateZ(${-D / 2}px)`}>
                <Finish material={chosen.wall} w={W} h={H} pxPerM={pxPerM} fallback="plaster" />
                <div className="absolute inset-0 bg-[radial-gradient(90%_80%_at_20%_10%,rgba(255,236,210,0.22),transparent_60%),linear-gradient(to_bottom,transparent_70%,rgba(0,0,0,0.35))]" />
                <Hotspot label="Feature wall" active={tab === "wall"} onClick={() => setTab("wall")} className="left-[62%] top-[30%]" />
              </Plane>

              {/* Floor. */}
              <Plane w={W} h={D} transform={`rotateX(90deg) translateZ(${-H / 2}px)`}>
                <Finish material={chosen.floor} w={W} h={D} pxPerM={pxPerM} fallback="screed" />
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.5),transparent_45%,rgba(255,230,200,0.08))]" />
                {/* Rug, for scale. */}
                <div
                  className="absolute rounded-[3px] bg-[#d9cbb6]/85 shadow-[0_0_0_6px_rgba(217,203,182,0.25)]"
                  style={{ left: W / 2 - 1.1 * pxPerM, width: 2.2 * pxPerM, top: 0.95 * pxPerM, height: 1.5 * pxPerM }}
                />
                <Hotspot label="Floor" active={tab === "floor"} onClick={() => setTab("floor")} className="left-[22%] top-[72%]" flat />
              </Plane>

              {/* Ceiling. */}
              <Plane w={W} h={D} transform={`rotateX(-90deg) translateZ(${-H / 2}px)`}>
                <Finish material={chosen.ceiling} w={W} h={D} pxPerM={pxPerM} fallback="plaster" />
                <div className="absolute inset-0 bg-[radial-gradient(50%_40%_at_50%_45%,rgba(255,220,170,0.35),transparent_70%),linear-gradient(to_top,rgba(0,0,0,0.45),transparent_50%)]" />
                <Hotspot label="Ceiling" active={tab === "ceiling"} onClick={() => setTab("ceiling")} className="left-[70%] top-[40%]" flat />
              </Plane>

              {/* Side walls, plastered. The left one has a window onto the pines. */}
              <Plane w={D} h={H} transform={`rotateY(90deg) translateZ(${-W / 2}px)`}>
                <div className="absolute inset-0 bg-[linear-gradient(90deg,#9b8f80,#d8cfc2_70%,#cfc5b7)]" />
                <PineWindow pxPerM={pxPerM} D={D} H={H} />
              </Plane>
              <Plane w={D} h={H} transform={`rotateY(-90deg) translateZ(${-W / 2}px)`}>
                <div className="absolute inset-0 bg-[linear-gradient(270deg,#7d7266,#c6bcae_70%,#bfb4a6)]" />
              </Plane>

              {/* Sofa, standing a little off the feature wall. */}
              <Plane
                w={2.1 * pxPerM}
                h={0.85 * pxPerM}
                transform={`translate3d(0, ${H / 2 - 0.425 * pxPerM}px, ${-D / 2 + 0.55 * pxPerM}px)`}
              >
                <Sofa />
              </Plane>

              {/* Pendant light. */}
              <Plane
                w={0.5 * pxPerM}
                h={0.9 * pxPerM}
                transform={`translate3d(0, ${-H / 2 + 0.45 * pxPerM}px, ${-D / 2 + 1.6 * pxPerM}px)`}
              >
                <Pendant />
              </Plane>
            </div>
            </div>
          </div>

          {/* Caption: dimensions, floating over the stage. */}
          <div className="pointer-events-none absolute inset-x-5 bottom-4 flex items-end justify-between [text-shadow:0_1px_10px_rgba(0,0,0,0.9)] text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
            <span>
              {dims.width.toFixed(1)} × {dims.depth.toFixed(1)} m · {dims.height.toFixed(1)} m high
            </span>
            <span className="hidden sm:inline">Move to look around</span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------- panel -- */}
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-2 lg:h-[620px]" data-reveal style={{ transitionDelay: "90ms" }}>
        <div className="flex h-full flex-col justify-between gap-4 rounded-[calc(2rem-0.5rem)] bg-ink-2 p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] sm:p-6">
          {/* Surface tabs. */}
          <div role="tablist" aria-label="Surface" className="grid grid-cols-3 gap-1 rounded-full bg-white/[0.05] p-1">
            {SURFACES.map((s) => (
              <button
                key={s.id}
                role="tab"
                id={`tab-${s.id}`}
                aria-selected={tab === s.id}
                aria-controls="surface-panel"
                onClick={() => setTab(s.id)}
                className={[
                  "rounded-full px-3 py-2 text-[13px] font-semibold pointer-coarse:py-3 transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                  tab === s.id ? "bg-cream text-ink shadow-[0_6px_16px_-8px_rgba(0,0,0,0.6)]" : "text-white/60 hover:text-white",
                ].join(" ")}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div id="surface-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
            <fieldset>
              <legend className="flex w-full items-baseline justify-between text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
                <span>Finish</span>
                <span className="normal-case tracking-normal text-white/70">
                  {chosen[tab] ? `${chosen[tab]!.finish}` : "Leave as is"}
                </span>
              </legend>
              <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-8">
                {optionsFor(tab).map((m) => (
                  <Swatch
                    key={m.slug}
                    material={m}
                    name={`pick-${tab}`}
                    checked={picks[tab] === m.slug}
                    onChange={() => setPicks((p) => ({ ...p, [tab]: m.slug }))}
                  />
                ))}
                <label
                  className={[
                    "relative flex aspect-square cursor-pointer items-center justify-center rounded-xl border border-dashed text-center text-[10.5px] font-semibold leading-tight transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-white has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-ink-2",
                    picks[tab] === null
                      ? "border-ember text-white"
                      : "border-white/25 text-white/65 hover:border-white/40 hover:text-white/80",
                  ].join(" ")}
                >
                  <input
                    type="radio"
                    name={`pick-${tab}`}
                    className="sr-only"
                    checked={picks[tab] === null}
                    onChange={() => setPicks((p) => ({ ...p, [tab]: null }))}
                  />
                  Leave
                  <br />
                  as is
                </label>
              </div>
              <p className="mt-2.5 text-[12px] text-white/60">
                {activeSurface.label} · {surfaceArea(tab, dims).toFixed(1)} m²
              </p>
            </fieldset>
          </div>

          {/* Dimensions. */}
          <fieldset className="space-y-2.5 border-t border-white/10 pt-4">
            <legend className="sr-only">Room size</legend>
            {(["width", "depth", "height"] as const).map((key) => (
              <Slider
                key={key}
                label={key === "width" ? "Width" : key === "depth" ? "Depth" : "Ceiling height"}
                value={dims[key]}
                {...LIMITS[key]}
                onChange={(v) => setDims((d) => ({ ...d, [key]: v }))}
              />
            ))}
          </fieldset>

          {/* Estimate. */}
          <div className="border-t border-white/10 pt-4">
            <ul className="space-y-1 text-[13px]">
              {lines.map((l) => (
                <li key={l.surface.id} className="flex items-baseline gap-3">
                  <span className="text-white/50">{l.surface.label}</span>
                  <span className="min-w-0 flex-1 truncate text-white/50">
                    {l.material ? `${l.pieces} ${l.material.unit}s` : "—"}
                  </span>
                  <span className="tabular text-white/80">{l.material ? formatPeso(l.cost!) : "—"}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">Estimate</p>
                <p className="mt-1 font-display text-[clamp(2rem,3.2vw,2.5rem)] leading-none tabular" aria-live="polite">
                  {formatPeso(total)}
                </p>
              </div>
              <p className="max-w-[17ch] text-right text-[11.5px] leading-snug text-white/60">
                Materials only, +{Math.round(WASTE * 100)}% for cuts. Final price after a free measure.
              </p>
            </div>

            <Link
              href={quoteHref}
              aria-disabled={total === 0}
              tabIndex={total === 0 ? -1 : undefined}
              className={[
                "group mt-4 flex items-center justify-between rounded-full bg-rust py-1.5 pl-6 pr-1.5 text-[15px] font-semibold transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-rust-2 hover:shadow-[0_18px_40px_-16px_rgba(226,106,42,0.75)] active:scale-[0.98]",
                total === 0 ? "pointer-events-none opacity-40" : "",
              ].join(" ")}
            >
              View your quotation
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-px">
                <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M5 15L15 5M7 5h8v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- 3D -- */

/** One face of the room, centred on the origin, then moved into place. */
function Plane({ w, h, transform, children }: { w: number; h: number; transform: string; children: React.ReactNode }) {
  return (
    <div
      className="absolute overflow-hidden [backface-visibility:visible]"
      style={{ width: w, height: h, left: -w / 2, top: -h / 2, transform }}
    >
      {children}
    </div>
  );
}

/**
 * Tiles a finish across a surface at real-world scale. When the finish
 * changes, the new one is wiped on over the old like a fresh coat.
 */
function Finish({
  material,
  w,
  h,
  pxPerM,
  fallback,
}: {
  material?: Material;
  w: number;
  h: number;
  pxPerM: number;
  fallback: "plaster" | "screed";
}) {
  // Each layer keeps a stable id, so the surviving layer isn't remounted when
  // the next finish arrives, and the covered one is dropped once paint-on ends.
  const [layers, setLayers] = useState([{ id: 0, m: material }]);
  const top = layers[layers.length - 1];
  if (top.m?.slug !== material?.slug) {
    // Without the paint-on animation nothing would ever drop the covered layer.
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setLayers(calm ? [{ id: top.id + 1, m: material }] : [top, { id: top.id + 1, m: material }]);
  }

  return (
    <>
      {layers.map(({ id, m }, i) => (
        <div
          key={id}
          className={i > 0 ? "paint-on absolute inset-0" : "absolute inset-0"}
          onAnimationEnd={i > 0 ? () => setLayers((ls) => ls.slice(-1)) : undefined}
        >
          {m ? (
            <Tiles material={m} w={w} h={h} pxPerM={pxPerM} />
          ) : (
            <div
              className={
                fallback === "plaster"
                  ? "h-full w-full bg-[linear-gradient(160deg,#e2d9cc,#c9bfb1)]"
                  : "h-full w-full bg-[linear-gradient(180deg,#6f665c,#8d8378)]"
              }
            />
          )}
        </div>
      ))}
    </>
  );
}

function Tiles({ material, w, h, pxPerM }: { material: Material; w: number; h: number; pxPerM: number }) {
  const [tw, th] = TILE_M[material.surface].map((m) => m * pxPerM);
  const cols = Math.ceil(w / tw);
  const rows = Math.ceil(h / th);
  return (
    <div className="grid" style={{ gridTemplateColumns: `repeat(${cols}, ${tw}px)`, gridAutoRows: `${th}px` }}>
      {Array.from({ length: cols * rows }, (_, i) => (
        <MaterialArt key={i} surface={material.surface} tone={material.tone} className="block h-[calc(100%+1px)] w-[calc(100%+1px)]" />
      ))}
    </div>
  );
}

function Hotspot({
  label,
  active,
  onClick,
  className,
  flat,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  className: string;
  flat?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Edit ${label.toLowerCase()}`}
      className={`group absolute -ml-2 -mt-2 flex h-11 w-11 items-center justify-center ${className}`}
      style={flat ? { transform: "rotateX(180deg)" } : undefined}
    >
      <span className="relative flex h-7 w-7 items-center justify-center">
        <span className={`absolute inset-0 rounded-full ${active ? "animate-ping bg-ember/60" : "bg-white/0"}`} />
        <span
          className={[
            "relative h-3.5 w-3.5 rounded-full ring-[3px] transition-transform duration-300 group-hover:scale-125",
            active ? "bg-ember ring-white" : "bg-white ring-ink/40",
          ].join(" ")}
        />
      </span>
    </button>
  );
}

function PineWindow({ pxPerM, D, H }: { pxPerM: number; D: number; H: number }) {
  const w = Math.min(1.6 * pxPerM, D * 0.4);
  const h = Math.min(1.3 * pxPerM, H * 0.45);
  return (
    <div
      className="absolute overflow-hidden rounded-[2px] ring-[5px] ring-[#efe8dc]"
      style={{ width: w, height: h, left: D * 0.38, top: H * 0.24 }}
    >
      <svg viewBox="0 0 160 130" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
        <defs>
          <linearGradient id="dusk" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#f3c58f" />
            <stop offset="60%" stopColor="#e79461" />
            <stop offset="100%" stopColor="#a8583a" />
          </linearGradient>
        </defs>
        <rect width="160" height="130" fill="url(#dusk)" />
        {/* Benguet pines on a ridge. */}
        <path d="M0 110 Q40 92 80 102 T160 96 V130 H0Z" fill="#3a2a22" />
        {[18, 46, 70, 104, 132].map((x, i) => (
          <path
            key={x}
            d={`M${x} ${60 + (i % 2) * 12} l-10 ${42 - (i % 2) * 10} h20z M${x} ${72 + (i % 2) * 12} l-13 ${34 - (i % 2) * 8} h26z`}
            fill="#2a1d17"
          />
        ))}
        <rect x="78" width="4" height="130" fill="#efe8dc" />
        <rect y="62" width="160" height="4" fill="#efe8dc" />
      </svg>
    </div>
  );
}

function Sofa() {
  return (
    <svg viewBox="0 0 210 85" preserveAspectRatio="none" className="h-full w-full drop-shadow-[0_10px_8px_rgba(0,0,0,0.45)]">
      <rect x="6" y="6" width="198" height="46" rx="12" fill="#3b4238" />
      <rect x="0" y="34" width="28" height="44" rx="10" fill="#333a31" />
      <rect x="182" y="34" width="28" height="44" rx="10" fill="#333a31" />
      <rect x="22" y="44" width="166" height="30" rx="8" fill="#465046" />
      <line x1="105" y1="46" x2="105" y2="72" stroke="#363e35" strokeWidth="2" />
      <rect x="20" y="76" width="5" height="9" fill="#1c1410" />
      <rect x="185" y="76" width="5" height="9" fill="#1c1410" />
      <rect x="36" y="18" width="34" height="26" rx="7" fill="#c47a4b" />
    </svg>
  );
}

function Pendant() {
  return (
    <svg viewBox="0 0 50 90" className="h-full w-full overflow-visible">
      <line x1="25" y1="0" x2="25" y2="58" stroke="#1c1410" strokeWidth="1" />
      <circle cx="25" cy="78" r="26" fill="#ffd9a0" opacity="0.18" />
      <path d="M10 72 Q25 52 40 72 Z" fill="#1c1410" />
      <ellipse cx="25" cy="72" rx="15" ry="3" fill="#ffe4b8" />
    </svg>
  );
}

/* ----------------------------------------------------------- controls -- */

function Swatch({
  material,
  name,
  checked,
  onChange,
}: {
  material: Material;
  name: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="group relative cursor-pointer" title={`${material.finish} · ${formatPeso(material.pricePhp)}/${material.unit}`}>
      <input type="radio" name={name} className="peer sr-only" checked={checked} onChange={onChange} />
      <span
        className={[
          "block aspect-square overflow-hidden rounded-xl ring-offset-2 ring-offset-ink-2 transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] peer-focus-visible:ring-2 peer-focus-visible:ring-white",
          checked ? "scale-100 ring-2 ring-ember" : "ring-1 ring-white/10 group-hover:scale-[1.06]",
        ].join(" ")}
      >
        <MaterialArt surface={material.surface} tone={material.tone} className="h-full w-full" />
      </span>
      <span className="sr-only">
        {material.name} {material.finish}, {formatPeso(material.pricePhp)} per {material.unit}
      </span>
    </label>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="grid grid-cols-[6.5rem_1fr_3rem] items-center gap-3 text-[13px]">
      <span className="text-white/55">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="range w-full"
        style={{ "--pct": `${pct}%` } as React.CSSProperties}
      />
      <span className="text-right tabular font-semibold text-white">{value.toFixed(1)} m</span>
    </label>
  );
}
