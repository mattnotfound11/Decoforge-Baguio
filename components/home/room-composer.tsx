"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { MaterialArt } from "@/components/material-art";
import { RoomScene, type SceneApi } from "@/components/home/room-scene";
import { formatPeso } from "@/lib/format";
import { getMaterial, type Material } from "@/lib/materials";
import {
  encodeRoom,
  estimate,
  LIMITS,
  optionsFor,
  surfaceArea,
  SURFACES,
  WASTE,
  windowIn,
  type Dims,
  type SurfaceId,
} from "@/lib/room";
import type { Mood, View } from "@/lib/room-stage";

/**
 * Room composer: a physically lit 3D model of the room whose feature wall,
 * ceiling and floor take any finish from the catalog at true scale, with a
 * key plan, and a live peso estimate beside it.
 *
 * The WebGL stage (lib/room-stage.ts) loads on demand; everything else here,
 * including the estimate and the quotation link, works without it.
 */

const DEFAULT_PICKS: Record<SurfaceId, string | null> = {
  wall: "mahogany-fluted-panel",
  ceiling: "matte-white-flat",
  floor: "cedar-composite",
};

const onFullscreenChange = (notify: () => void) => {
  document.addEventListener("fullscreenchange", notify);
  return () => document.removeEventListener("fullscreenchange", notify);
};

const VIEWS: { id: View; label: string; short: string }[] = [
  { id: "eye", label: "Eye level", short: "Eye" },
  { id: "corner", label: "Corner", short: "Corner" },
  { id: "overhead", label: "Overhead", short: "Above" },
];

export function RoomComposer() {
  const [picks, setPicks] = useState(DEFAULT_PICKS);
  const [dims, setDims] = useState<Dims>({ width: 4.2, depth: 5, height: 2.7 });
  const [tab, setTab] = useState<SurfaceId>("wall");
  const [mood, setMood] = useState<Mood>("day");
  const [view, setView] = useState({ id: "corner" as View, nonce: 0 });
  const [heading, setHeading] = useState(0);
  const [flat, setFlat] = useState(false);
  const [hover, setHover] = useState<{ surface: SurfaceId; x: number; y: number } | null>(null);
  const [zoomHint, setZoomHint] = useState(false);
  const scene = useRef<SceneApi | null>(null);
  const stageEl = useRef<HTMLDivElement>(null);

  const chosen = useMemo(
    () => Object.fromEntries(SURFACES.map((s) => [s.id, (picks[s.id] && getMaterial(picks[s.id]!)) || null])) as Record<SurfaceId, Material | null>,
    [picks],
  );

  // Fullscreen only where the browser can do it for an element (not iPhone).
  const canFull = useSyncExternalStore(onFullscreenChange, () => document.fullscreenEnabled, () => false);
  const full = useSyncExternalStore(onFullscreenChange, () => !!stageEl.current && document.fullscreenElement === stageEl.current, () => false);
  const toggleFull = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void stageEl.current?.requestFullscreen();
  };

  useEffect(() => {
    if (!zoomHint) return;
    const t = window.setTimeout(() => setZoomHint(false), 1800);
    return () => window.clearTimeout(t);
  }, [zoomHint]);
  const onHover = useCallback((surface: SurfaceId | null, x: number, y: number) => setHover(surface ? { surface, x, y } : null), []);
  const onView = useCallback((v: View) => setView((cur) => ({ id: v, nonce: cur.nonce })), []);
  const onZoomHint = useCallback(() => setZoomHint(true), []);

  const lines = SURFACES.map((s) => {
    const m = chosen[s.id];
    return { surface: s, material: m, ...(m ? estimate(m, surfaceArea(s.id, dims)) : null) };
  });
  const total = lines.reduce((sum, l) => sum + (l.cost ?? 0), 0);
  const quoteHref = `/quote?room=${encodeURIComponent(encodeRoom(picks, dims))}`;

  const activeSurface = SURFACES.find((s) => s.id === tab)!;

  // The stage swings round on its own if the camera can't see the surface.
  const selectTab = useCallback((surface: SurfaceId) => setTab(surface), []);


  const label = `3D view of a ${dims.width.toFixed(1)} by ${dims.depth.toFixed(1)} metre room, ${dims.height.toFixed(1)} metres high. ${SURFACES.map(
    (s) => `${s.label}: ${chosen[s.id] ? `${chosen[s.id]!.name} ${chosen[s.id]!.finish}` : "left as is"}`,
  ).join(". ")}.`;

  return (
    <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr] lg:gap-6">
      {/* ------------------------------------------------------- stage -- */}
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-2 lg:h-[620px]" data-reveal>
        <div
          ref={stageEl}
          className="relative h-[clamp(400px,96vw,540px)] overflow-hidden rounded-[calc(2rem-0.5rem)] bg-[radial-gradient(120%_90%_at_50%_35%,#2e241e_0%,#120d0b_72%)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] lg:h-full [&:fullscreen]:rounded-none"
        >
          <RoomScene
            dims={dims}
            finishes={chosen}
            mood={mood}
            view={view.id}
            viewNonce={view.nonce}
            focus={tab}
            label={label}
            api={scene}
            onPick={selectTab}
            onHover={onHover}
            onHeading={setHeading}
            onView={onView}
            onZoomHint={onZoomHint}
            fallback={<Elevation material={chosen.wall} />}
            onFallback={() => setFlat(true)}
          />

          {/* What the pointer is over, and what it's finished in. */}
          {hover && (
            <div
              className="pointer-events-none absolute z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/10 bg-ink/75 px-3 py-1.5 text-[12px] font-semibold text-white shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)] backdrop-blur-md"
              style={{ left: hover.x, top: hover.y + 22 }}
              aria-hidden="true"
            >
              {SURFACES.find((s) => s.id === hover.surface)!.label}
              <span className="font-normal text-white/60"> · {chosen[hover.surface]?.finish ?? "As is"}</span>
            </div>
          )}

          {/* How to zoom, when someone scrolls over the room. */}
          <div
            className={`pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink/80 px-4 py-2 text-[12.5px] font-semibold text-white backdrop-blur-md transition-opacity duration-300 ${zoomHint ? "opacity-100" : "opacity-0"}`}
            aria-hidden="true"
          >
            Pinch, or hold Ctrl and scroll, to zoom
          </div>

          {/* View and light. */}
          <div className={`pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2 ${flat ? "hidden" : ""}`}>
            <Segmented label="View">
              {VIEWS.map((v) => (
                <SegButton key={v.id} pressed={view.id === v.id} onClick={() => setView((cur) => ({ id: v.id, nonce: cur.nonce + 1 }))}>
                  <span className="sm:hidden">{v.short}</span>
                  <span className="hidden sm:inline">{v.label}</span>
                </SegButton>
              ))}
            </Segmented>
            <Segmented label="Light">
              <SegButton pressed={mood === "day"} onClick={() => setMood("day")} title="Daylight">
                <SunIcon />
                <span className="sr-only sm:not-sr-only">Day</span>
              </SegButton>
              <SegButton pressed={mood === "evening"} onClick={() => setMood("evening")} title="Evening, lamps on">
                <MoonIcon />
                <span className="sr-only sm:not-sr-only">Evening</span>
              </SegButton>
            </Segmented>
          </div>

          {/* Key plan, caption, zoom. */}
          <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-end justify-between gap-3">
            <KeyPlan dims={dims} heading={heading} active={tab} finished={picks} />
            <p className={`ml-auto hidden text-right text-[11px] font-semibold uppercase leading-relaxed tracking-[0.16em] text-white/45 [text-shadow:0_1px_10px_rgba(0,0,0,0.9)] ${flat ? "" : "pointer-fine:md:block"}`}>
              Drag to look around · Pinch to zoom
              <br />
              Click a surface to change it
            </p>
            <div
              role="group"
              aria-label="Zoom"
              className={`pointer-events-auto ml-auto flex flex-col gap-0.5 rounded-full border border-white/10 bg-ink/60 p-1 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.7)] backdrop-blur-md md:ml-0 ${flat ? "hidden" : ""}`}
            >
              <IconButton label="Zoom in" onClick={() => scene.current?.zoomBy(0.7)}>
                <path d="M10 4.5v11M4.5 10h11" />
              </IconButton>
              <IconButton label="Zoom out" onClick={() => scene.current?.zoomBy(1 / 0.7)}>
                <path d="M4.5 10h11" />
              </IconButton>
              {canFull && (
                <IconButton label={full ? "Exit full screen" : "Full screen"} onClick={toggleFull}>
                  {full ? <path d="M8 3.5V8H3.5M12 3.5V8h4.5M8 16.5V12H3.5M12 16.5V12h4.5" /> : <path d="M3.5 8V3.5H8M16.5 8V3.5H12M3.5 12v4.5H8M16.5 12v4.5H12" />}
                </IconButton>
              )}
            </div>
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
                onClick={() => selectTab(s.id)}
                className={[
                  "rounded-full px-3 py-2 text-[13px] font-semibold pointer-coarse:py-3 transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                  tab === s.id ? "bg-cream text-ink shadow-[0_6px_16px_-8px_rgba(0,0,0,0.6)]" : "text-white/60 hover:text-white",
                ].join(" ")}
              >
                {s.tab}
              </button>
            ))}
          </div>

          <div id="surface-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
            <fieldset>
              <legend className="flex w-full items-baseline justify-between text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
                <span>Finish</span>
                <span className="normal-case tracking-normal text-white/70">
                  {chosen[tab]?.finish ?? "Leave as is"}
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
                {tab === "wall" ? "Feature wall, window wall and side wall" : activeSurface.label} · {surfaceArea(tab, dims).toFixed(1)} m²
                {tab === "wall" && ", less the window"}
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
            <ul className="space-y-0.5 text-[12.5px]">
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

/* ------------------------------------------------------------ stage -- */

function Segmented({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      role="group"
      aria-label={label}
      className="pointer-events-auto flex gap-0.5 rounded-full border border-white/10 bg-ink/60 p-1 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.7)] backdrop-blur-md"
    >
      {children}
    </div>
  );
}

function SegButton({ pressed, onClick, title, children }: { pressed: boolean; onClick: () => void; title?: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      title={title}
      onClick={onClick}
      className={[
        "flex items-center gap-1.5 rounded-full px-2.5 py-1.5 sm:px-3 text-[12px] font-semibold whitespace-nowrap pointer-coarse:py-2.5 transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
        pressed ? "bg-cream text-ink" : "text-white/65 hover:text-white",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-full text-white/75 transition duration-300 hover:bg-white/10 hover:text-white active:scale-90 pointer-coarse:h-11 pointer-coarse:w-11 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
    >
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
      </svg>
    </button>
  );
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <circle cx="10" cy="10" r="3.5" />
      <path d="M10 1.5v2M10 16.5v2M1.5 10h2M16.5 10h2M4 4l1.4 1.4M14.6 14.6L16 16M4 16l1.4-1.4M14.6 5.4L16 4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
      <path d="M16.5 12.5A7 7 0 017.5 3.5a7 7 0 109 9z" />
    </svg>
  );
}

/**
 * Key plan, drawn the way an architect would: walls in plan with the window
 * opening, the open side as a section line, dimension strings with ticks, and
 * a cone showing where the camera stands.
 */
function KeyPlan({
  dims,
  heading,
  active,
  finished,
}: {
  dims: Dims;
  heading: number;
  active: SurfaceId;
  finished: Record<SurfaceId, string | null>;
}) {
  const s = 70 / Math.max(dims.width, dims.depth);
  const w = dims.width * s;
  const d = dims.depth * s;
  const x0 = 10 + (70 - w) / 2;
  const y0 = 18 + (70 - d) / 2;
  const win = windowIn(dims);
  const wy = y0 + (win.centre - win.width / 2) * s;
  const wh = win.width * s;

  // The camera, out beyond the open side, looking back at the room's centre.
  const cx = x0 + w / 2;
  const cy = y0 + d / 2;
  const r = Math.max(w, d) / 2 + 9;
  const px = cx + Math.sin(heading) * r;
  const py = cy + Math.cos(heading) * r;
  const ray = (spread: number) => {
    const a = Math.atan2(cx - px, cy - py) + spread;
    return `${(px + Math.sin(a) * 14).toFixed(1)} ${(py + Math.cos(a) * 14).toFixed(1)}`;
  };

  const tick = (x: number, y: number) => `M${x - 2} ${y + 2}L${x + 2} ${y - 2}`;
  const hot = "stroke-ember";
  // Walls being edited are ember; finished ones solid cream; bare ones faint.
  const wall = (id: SurfaceId) => ({
    className: active === id ? hot : finished[id] ? "stroke-cream" : "stroke-white/40",
    strokeWidth: active === id ? 4 : finished[id] ? 3 : 2,
  });

  return (
    <div className="hidden rounded-xl border border-white/10 bg-ink/60 p-1.5 backdrop-blur-md sm:block" aria-hidden="true">
      <svg viewBox="0 0 110 110" className="block h-[112px] w-[112px]" fill="none">
        {/* Floor, tinted when it's the surface being edited; the ceiling as a dashed reflected outline. */}
        <rect x={x0} y={y0} width={w} height={d} className={active === "floor" ? "fill-ember/20" : "fill-white/[0.04]"} />
        {active === "ceiling" && <rect x={x0 + 3} y={y0 + 3} width={w - 6} height={d - 6} className={hot} strokeWidth="1" strokeDasharray="2.5 2" />}

        {/* Walls: feature wall at the top, window wall on the left; one finish covers all three. */}
        <path d={`M${x0} ${y0}H${x0 + w}`} {...wall("wall")} />
        <path d={`M${x0 + w} ${y0}V${y0 + d}`} {...wall("wall")} />
        <path d={`M${x0} ${y0}V${wy}M${x0} ${wy + wh}V${y0 + d}`} {...wall("wall")} />
        <path d={`M${x0 - 1.2} ${wy}V${wy + wh}M${x0 + 1.2} ${wy}V${wy + wh}`} className="stroke-white/70" strokeWidth="0.6" />
        {/* The open side, as a section cut. */}
        <path d={`M${x0} ${y0 + d}H${x0 + w}`} className="stroke-white/35" strokeWidth="0.8" strokeDasharray="4 2 1 2" />

        {/* Dimension strings. */}
        <g className="stroke-white/45" strokeWidth="0.6">
          <path d={`M${x0} ${y0 - 7}H${x0 + w}M${x0} ${y0 - 10}v6M${x0 + w} ${y0 - 10}v6`} />
          <path d={tick(x0, y0 - 7) + tick(x0 + w, y0 - 7)} strokeWidth="1" />
          <path d={`M${x0 + w + 7} ${y0}V${y0 + d}M${x0 + w + 4} ${y0}h6M${x0 + w + 4} ${y0 + d}h6`} />
          <path d={tick(x0 + w + 7, y0) + tick(x0 + w + 7, y0 + d)} strokeWidth="1" />
        </g>
        <g className="fill-white/70 font-sans text-[6.5px] font-semibold tabular-nums">
          <text x={x0 + w / 2} y={y0 - 10} textAnchor="middle">{dims.width.toFixed(1)}</text>
          <text x={x0 + w + 15} y={y0 + d / 2} textAnchor="middle" transform={`rotate(-90 ${x0 + w + 15} ${y0 + d / 2})`}>
            {dims.depth.toFixed(1)}
          </text>
        </g>

        {/* Camera. */}
        <path d={`M${px.toFixed(1)} ${py.toFixed(1)}L${ray(-0.3)}L${ray(0.3)}Z`} className="fill-ember/35 stroke-ember" strokeWidth="0.7" strokeLinejoin="round" />
        <circle cx={px} cy={py} r="1.8" className="fill-ember" />
      </svg>
    </div>
  );
}

/** Flat elevation of the feature wall, for devices that can't draw the 3D room. */
function Elevation({ material }: { material: Material | null }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-10">
      <div className="aspect-[16/9] w-full max-w-md overflow-hidden rounded-md shadow-[0_30px_60px_-30px_rgba(0,0,0,0.8)]">
        {material ? (
          <MaterialArt surface={material.surface} tone={material.tone} className="h-full w-full" />
        ) : (
          <div className="h-full w-full bg-[linear-gradient(160deg,#e2d9cc,#c9bfb1)]" />
        )}
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">Feature wall elevation</p>
    </div>
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
