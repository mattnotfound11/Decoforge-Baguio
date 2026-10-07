"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The intro: an architect's drawing sheet. A one-point-perspective interior
 * draws itself in hairlines on a drafting grid, dimension lines measure it,
 * then a fluted feature wall is "installed" rib by rib. On exit the camera dollies
 * into that wall and its slats turn open like louvers to uncover the page.
 *
 * Whether it plays is decided before first paint by the inline script in
 * app/layout.tsx (`<html data-intro="play|skip">`). It plays only when a visit
 * starts on the home page, so shared quotation and product links open
 * straight away; returning visitors in the same session and reduced-motion
 * users never see a flash of it. Without JavaScript it never renders at all.
 */

const MIN_MS = 2100;
const MAX_MS = 4600;

/*
 * Exit choreography, in ms from the start of the exit (see globals.css):
 *   0–800    dolly into the drawing until the fluted wall fills the screen;
 *            the louvers fade in over it as it arrives
 *   800      the page behind is revealed and the hero starts rising
 *   800–2000 the louvers rotate open, centre first (0.9s each, 40ms stagger)
 */
const REVEAL_AT = 800;
const GONE_AT = 2100;
const LOUVERS = 16;

/* ------------------------------------------------------------ geometry -- */
// viewBox 0 0 800 500. Front opening and back wall of the room.
const F = { l: 70, r: 730, t: 50, b: 450 };
const W = { l: 260, r: 540, t: 165, b: 335 };

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** A point on the left wall at depth `t` (0 front → 1 back), `h` down from the top (0 → 1). */
function leftWall(t: number, h: number) {
  const x = lerp(F.l, W.l, t);
  const top = lerp(F.t, W.t, t);
  const bottom = lerp(F.b, W.b, t);
  return `${x.toFixed(1)},${lerp(top, bottom, h).toFixed(1)}`;
}

const PLANKS = Array.from({ length: 9 }, (_, i) => (i + 1) / 10);
const CEILING = Array.from({ length: 5 }, (_, i) => (i + 1) / 6);
const RIBS = Array.from({ length: 27 }, (_, i) => W.l + 5 + i * ((W.r - W.l - 10) / 26));
const WINDOW = [leftWall(0.32, 0.26), leftWall(0.68, 0.26), leftWall(0.68, 0.62), leftWall(0.32, 0.62), leftWall(0.32, 0.26)].join(" ");
const WINDOW_MULLION = `${leftWall(0.5, 0.26)} ${leftWall(0.5, 0.62)}`;

/** Draw order: each stroke waits `d` seconds, then draws over `s`. */
type Stroke = { el: "line" | "polyline"; p: Record<string, string | number>; d: number; s?: number; accent?: boolean };

/**
 * Closed outlines as open polylines that return to their first point. With
 * pathLength=1, Chrome leaves the closing edge of a <rect>/<polygon> partly
 * undrawn; an explicit last segment draws in full.
 */
const box = (l: number, t: number, r: number, b: number) => `${l},${t} ${r},${t} ${r},${b} ${l},${b} ${l},${t}`;

const STROKES: Stroke[] = [
  // Front opening, then the back wall.
  { el: "polyline", p: { points: box(F.l, F.t, F.r, F.b) }, d: 0.05, s: 1.1 },
  { el: "polyline", p: { points: box(W.l, W.t, W.r, W.b) }, d: 0.3, s: 0.9 },
  // Corner rays that make the perspective.
  { el: "line", p: { x1: F.l, y1: F.t, x2: W.l, y2: W.t }, d: 0.55 },
  { el: "line", p: { x1: F.r, y1: F.t, x2: W.r, y2: W.t }, d: 0.6 },
  { el: "line", p: { x1: F.l, y1: F.b, x2: W.l, y2: W.b }, d: 0.65 },
  { el: "line", p: { x1: F.r, y1: F.b, x2: W.r, y2: W.b }, d: 0.7 },
  // Floor planks and ceiling boards converge on the back wall.
  ...PLANKS.map((t, i) => ({
    el: "line" as const,
    p: { x1: lerp(F.l, F.r, t), y1: F.b, x2: lerp(W.l, W.r, t), y2: W.b },
    d: 0.8 + i * 0.035,
    s: 0.55,
  })),
  ...CEILING.map((t, i) => ({
    el: "line" as const,
    p: { x1: lerp(F.l, F.r, t), y1: F.t, x2: lerp(W.l, W.r, t), y2: W.t },
    d: 0.85 + i * 0.04,
    s: 0.55,
  })),
  // Window on the left wall, and the pendant on its cord.
  { el: "polyline", p: { points: WINDOW }, d: 1.0, s: 0.6 },
  { el: "polyline", p: { points: WINDOW_MULLION }, d: 1.15, s: 0.4 },
  { el: "line", p: { x1: 400, y1: W.t - 40, x2: 400, y2: W.t + 38 }, d: 1.05, s: 0.4 },
  { el: "polyline", p: { points: "384,206 400,194 416,206 384,206" }, d: 1.2, s: 0.4 },
  // Dimension lines, in ember.
  { el: "line", p: { x1: F.l, y1: 26, x2: F.r, y2: 26 }, d: 1.0, s: 0.7, accent: true },
  { el: "line", p: { x1: 756, y1: F.t, x2: 756, y2: F.b }, d: 1.1, s: 0.7, accent: true },
];

/** Tick marks at the ends of each dimension line. */
const TICKS = [
  [F.l, 26, "h"], [F.r, 26, "h"], [756, F.t, "v"], [756, F.b, "v"],
] as const;

export function IntroLoader() {
  // Stays mounted but display:none (see globals.css) unless the intro plays.
  const [phase, setPhase] = useState<"build" | "exit" | "gone">("build");
  const countRef = useRef<HTMLSpanElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const drawingRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (root.dataset.intro !== "play") return;
    // The inline script's 9s failsafe is only for when this never runs.
    window.clearTimeout((window as Window & { __dfIntroFailsafe?: number }).__dfIntroFailsafe);

    const t0 = performance.now();
    let loaded = document.readyState === "complete";
    const onLoad = () => (loaded = true);
    window.addEventListener("load", onLoad, { once: true });

    let raf = 0;
    let shown = 0;
    let exitTimer = 0;
    let revealTimer = 0;
    let doneTimer = 0;

    // Aim the dolly: centre the back wall on screen and scale it to cover the
    // viewport, whatever shape the viewport is.
    const aim = () => {
      const svg = drawingRef.current;
      const el = loaderRef.current;
      if (!svg || !el) return;
      const r = svg.getBoundingClientRect();
      const sx = r.width / 800;
      const sy = r.height / 500;
      const wallW = (W.r - W.l) * sx;
      const wallH = (W.b - W.t) * sy;
      const cx = r.left + ((W.l + W.r) / 2) * sx;
      const cy = r.top + ((W.t + W.b) / 2) * sy;
      const zoom = Math.max(innerWidth / wallW, innerHeight / wallH) * 1.06;
      el.style.setProperty("--zx", `${innerWidth / 2 - cx}px`);
      el.style.setProperty("--zy", `${innerHeight / 2 - cy}px`);
      el.style.setProperty("--zs", zoom.toFixed(3));
      el.style.setProperty("--zo", `${(cx - r.left).toFixed(1)}px ${(cy - r.top).toFixed(1)}px`);
    };

    // The counter eases toward 92 on a timer, and only finishes once the page
    // has actually loaded (or the cap is hit) — so it never lies by much.
    const tick = (now: number) => {
      // Skipped meanwhile (the failsafe fired, e.g. in a background tab): stay gone.
      if (root.dataset.intro !== "play") return setPhase("gone");
      const elapsed = now - t0;
      const ready = (loaded && elapsed >= MIN_MS) || elapsed >= MAX_MS;
      const target = ready ? 100 : 92 * (1 - Math.pow(1 - Math.min(1, elapsed / MIN_MS), 3));
      shown += (target - shown) * (ready ? 0.2 : 0.16);
      if (ready && 100 - shown < 0.6) shown = 100;
      if (countRef.current) countRef.current.textContent = String(Math.round(shown)).padStart(3, "0");

      if (shown === 100) {
        exitTimer = window.setTimeout(() => {
          if (root.dataset.intro !== "play") return setPhase("gone");
          aim();
          setPhase("exit");
          try {
            sessionStorage.setItem("df-intro", "1");
          } catch {}
          // The hero rises as the louvers begin to part, not before.
          revealTimer = window.setTimeout(() => {
            root.dataset.intro = "done";
            window.dispatchEvent(new Event("df:intro-done"));
          }, REVEAL_AT);
          doneTimer = window.setTimeout(() => setPhase("gone"), GONE_AT);
        }, 360);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(exitTimer);
      window.clearTimeout(revealTimer);
      window.clearTimeout(doneTimer);
      window.removeEventListener("load", onLoad);
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      ref={loaderRef}
      className="df-loader"
      data-phase={phase}
      role="status"
      aria-live="polite"
      aria-label="Loading Decoforge"
    >
      {/* The counter changes every frame; screen readers get the status label only. */}
      <div className="df-sheet" aria-hidden="true">
        <svg ref={drawingRef} viewBox="0 0 800 500" className="df-sheet__drawing" aria-hidden="true">
          <defs>
            <linearGradient id="df-rib" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#31140c" />
              <stop offset="40%" stopColor="#954d32" />
              <stop offset="70%" stopColor="#703522" />
              <stop offset="100%" stopColor="#31140c" />
            </linearGradient>
          </defs>

          {/* Registration crosshairs at the sheet corners. */}
          {[
            [14, 14],
            [786, 14],
            [14, 486],
            [786, 486],
          ].map(([x, y]) => (
            <g key={`${x}-${y}`} className="df-reg">
              <line x1={x - 8} y1={y} x2={x + 8} y2={y} />
              <line x1={x} y1={y - 8} x2={x} y2={y + 8} />
              <circle cx={x} cy={y} r="3.5" />
            </g>
          ))}

          {/* The fluted feature wall, installed rib by rib after the drawing. */}
          <g className="df-ribs">
            {RIBS.map((x, i) => (
              <rect
                key={x}
                x={x - 4.6}
                y={W.t + 1}
                width="9.2"
                height={W.b - W.t - 2}
                fill="url(#df-rib)"
                style={{ animationDelay: `${1.35 + Math.abs(i - 13) * 0.028}s` }}
              />
            ))}
          </g>

          {/* Hairline drawing. pathLength=1 lets every stroke draw with one dash rule. */}
          <g className="df-lines">
            {STROKES.map(({ el: El, p, d, s = 0.8, accent }, i) => (
              <El
                key={i}
                {...p}
                pathLength={1}
                className={accent ? "df-line df-line--accent" : "df-line"}
                style={{ animationDelay: `${d}s`, animationDuration: `${s}s` }}
              />
            ))}
            {TICKS.map(([x, y, dir]) => (
              <line
                key={`${x}-${y}`}
                className="df-tick"
                x1={dir === "h" ? x : x - 6}
                y1={dir === "h" ? y - 6 : y}
                x2={dir === "h" ? x : x + 6}
                y2={dir === "h" ? y + 6 : y}
              />
            ))}
          </g>

          {/* Pendant glow, lit once the wall is in. */}
          <ellipse className="df-glow" cx="400" cy="214" rx="70" ry="44" />

          {/* Dimension labels. */}
          <text className="df-dim" x="400" y="20" textAnchor="middle">4.20 m</text>
          <text className="df-dim" x="772" y="254" textAnchor="middle" transform="rotate(90 772 254)">2.70 m</text>
        </svg>

        <div className="df-sheet__foot">
          <p className="df-sheet__word">
            Deco<em>forge</em>
          </p>

          {/* Architectural title block. */}
          <dl className="df-block">
            <div className="df-block__hide-sm">
              <dt>Project</dt>
              <dd>Home &amp; Aesthetics</dd>
            </div>
            <div>
              <dt>Sheet</dt>
              <dd>A-01 · Interior elevation</dd>
            </div>
            <div className="df-block__hide-sm">
              <dt>Scale</dt>
              <dd>1 : 50</dd>
            </div>
            <div className="df-block__hide-sm">
              <dt>Site</dt>
              <dd>Irisan, Baguio City</dd>
            </div>
            <div className="df-block__count">
              <dt>Drawing</dt>
              <dd>
                <span ref={countRef} className="tabular">000</span>
                <span>%</span>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* The fluted wall at full scale. Its slats rotate open to reveal the page. */}
      <div className="df-louvers" aria-hidden="true">
        {Array.from({ length: LOUVERS }, (_, i) => (
          <span key={i} style={{ "--o": Math.abs(i - (LOUVERS - 1) / 2) } as React.CSSProperties} />
        ))}
      </div>
    </div>
  );
}
