"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { MaterialArt } from "@/components/material-art";
import { formatPeso } from "@/lib/format";
import { categoryLabel, getMaterial, type Material, type Surface } from "@/lib/materials";
import { SURFACES } from "@/lib/room";
import { PageTurn } from "@/components/home/page-turn";

/**
 * The sample book: nine finishes bound as illustrated plates. Pages turn with
 * a curl, a brass loupe can be dragged over any plate to inspect the surface
 * up close, and the index on the left jumps straight to a plate.
 *
 * Every plate is the same vector drawing the catalog uses, so the loupe is not
 * enlarging pixels — it redraws the finish at the higher magnification.
 */

const PLATES = [
  "uv-marble-carrara-white",
  "uv-marble-calacatta-gold",
  "uv-marble-nero-charcoal",
  "terracotta-ribbed",
  "natural-oak-slats",
  "mahogany-fluted-panel",
  "dust-grey-profile",
  "espresso-linear-ceiling",
  "cedar-composite",
]
  .map(getMaterial)
  .filter((m): m is Material => Boolean(m));

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];

/**
 * Pencil notes beside each kind of plate, with where their leader lands. The
 * label runs toward the middle of the plate from its point, so it never leaves the page.
 */
const NOTES: Record<Surface, { text: string; x: number; y: number }[]> = {
  marble: [
    { text: "UV-cured coat — wipes clean", x: 12, y: 30 },
    { text: "veins run on a long repeat", x: 88, y: 72 },
  ],
  fluted: [
    { text: "rib crown catches the light", x: 14, y: 26 },
    { text: "shadow valley", x: 84, y: 74 },
  ],
  ceiling: [
    { text: "bevelled joint, no fixings", x: 18, y: 30 },
    { text: "light falls across the run", x: 86, y: 70 },
  ],
  deck: [
    { text: "machined groove for grip", x: 12, y: 22 },
    { text: "low-contrast grain", x: 86, y: 66 },
  ],
};

const ZOOMS = [2, 3, 4, 6];
const TURN_MS = 1150;

type Turn = { dir: 1 | -1; to: number } | null;

export function SampleBook() {
  const [index, setIndex] = useState(0);
  const [turn, setTurn] = useState<Turn>(null);
  const [spread, setSpread] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [loupeOn, setLoupeOn] = useState(true);
  const [zoom, setZoom] = useState(1); // index into ZOOMS

  useEffect(() => {
    const wide = window.matchMedia("(min-width: 900px)");
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setSpread(wide.matches);
      setReduced(calm.matches);
    };
    sync();
    wide.addEventListener("change", sync);
    calm.addEventListener("change", sync);
    return () => {
      wide.removeEventListener("change", sync);
      calm.removeEventListener("change", sync);
    };
  }, []);

  const go = useCallback(
    (to: number) => {
      if (turn || to === index || to < 0 || to >= PLATES.length) return;
      if (reduced) {
        setIndex(to);
        return;
      }
      setTurn({ dir: to > index ? 1 : -1, to });
    },
    [index, reduced, turn],
  );

  // The page lands: commit the new spread.
  const land = useCallback(() => {
    if (!turn) return;
    setIndex(turn.to);
    setTurn(null);
  }, [turn]);

  /** One plate as a phone-width sheet: illustration above, notes below. */
  const sheet = (i: number, withLoupe = false) => (
    <div className="[&>.page]:h-auto">
      <Page side="single">
        <PlatePage material={PLATES[i]} n={i} />
        {withLoupe && <Loupe material={PLATES[i]} magnification={ZOOMS[zoom]} />}
      </Page>
      <Page side="single">
        <NotesPage material={PLATES[i]} n={i} />
      </Page>
    </div>
  );

  // Arrow keys turn pages while the book has focus.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") go(index + 1);
    if (e.key === "ArrowLeft") go(index - 1);
  };

  // Click (or tap) a page to turn it: the right half goes forward, the left
  // half back. A horizontal swipe does the same on touch screens. Links,
  // buttons and the loupe keep their own behaviour.
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest("[data-loupe], a, button")) return;
    swipe.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      go(index + (dx < 0 ? 1 : -1));
      return;
    }
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) return; // a scroll or a drag, not a click
    const box = e.currentTarget.getBoundingClientRect();
    go(index + (e.clientX < box.left + box.width / 2 ? -1 : 1));
  };

  // Which half the mouse is over, for the page-edge hint. Updates only when
  // the side changes, and never for touch or over the loupe or a control.
  const [hoverSide, setHoverSide] = useState<"l" | "r" | null>(null);
  const onPointerMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const overControl = (e.target as HTMLElement).closest("[data-loupe], a, button");
    const box = e.currentTarget.getBoundingClientRect();
    const side = overControl ? null : e.clientX < box.left + box.width / 2 ? "l" : "r";
    if (side !== hoverSide) setHoverSide(side);
  };

  const plate = PLATES[index];
  // What sits under the turning leaf.
  const leftIdx = turn?.dir === -1 ? turn.to : index;
  const rightIdx = turn?.dir === 1 ? turn.to : index;

  return (
    <div className="grid gap-10 xl:grid-cols-[220px_1fr] xl:gap-12">
      {/* ------------------------------------------------------- index -- */}
      <nav aria-label="Sample book plates" className="order-2 mx-auto w-full max-w-[min(1060px,calc((100dvh-200px)*1.48))] xl:order-1" data-reveal="left">
        <p className="font-book text-[13px] italic text-graphite/70">Index of plates</p>
        <ol className="mt-4 grid grid-cols-1 gap-x-8 gap-y-0.5 border-t border-graphite/15 pt-3 sm:grid-cols-3 xl:grid-cols-1">
          {PLATES.map((m, i) => {
            const active = i === (turn?.to ?? index);
            return (
              <li key={m.slug}>
                <button
                  type="button"
                  onClick={() => go(i)}
                  aria-current={active ? "true" : undefined}
                  className="group flex w-full items-baseline gap-3 py-1.5 text-left"
                >
                  <span className={`w-8 shrink-0 font-display text-[15px] italic transition-colors ${active ? "text-rust" : "text-graphite/65"}`}>
                    {ROMAN[i]}.
                  </span>
                  <span className="relative font-book text-[16px] text-graphite">
                    {m.finish}
                    <svg
                      viewBox="0 0 100 8"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                      className={`absolute -bottom-1 left-0 h-[6px] w-full text-rust transition-[clip-path] duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                        active ? "[clip-path:inset(0_0_0_0)]" : "[clip-path:inset(0_100%_0_0)] group-hover:[clip-path:inset(0_0_0_0)]"
                      }`}
                    >
                      <path d="M1 5 C 20 2, 45 7, 70 3 S 95 4, 99 2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <p className="mt-6 hidden max-w-[24ch] font-book text-[14px] italic leading-relaxed text-graphite/70 xl:block">
          Click a page to turn it. Drag the loupe across a plate to see the surface up close.
        </p>
      </nav>

      {/* -------------------------------------------------------- book -- */}
      <div className="order-1 min-w-0 xl:order-2" data-reveal="scale">
        <div
          tabIndex={0}
          role="region"
          aria-roledescription="book"
          aria-label={`Sample book, plate ${index + 1} of ${PLATES.length}: ${plate.name}, ${plate.finish}`}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerMove={onPointerMove}
          onPointerLeave={() => setHoverSide(null)}
          className="book relative mx-auto max-w-[min(1060px,calc((100dvh-200px)*1.48))] cursor-pointer touch-pan-y select-none rounded-[6px] outline-none focus-visible:ring-2 focus-visible:ring-rust/50 focus-visible:ring-offset-8 focus-visible:ring-offset-paper"
        >
          {/* Page-edge hints: a soft arrow fades in on whichever side would turn. */}
          {index > 0 && !turn && <TurnHint side="l" active={hoverSide === "l"} />}
          {index < PLATES.length - 1 && !turn && <TurnHint side="r" active={hoverSide === "r"} />}
          {spread ? (
            <div className="book-spread relative grid aspect-[1.48/1] grid-cols-2">
              <Page side="l">
                <PlatePage material={PLATES[leftIdx]} n={leftIdx} />
              </Page>
              <Page side="r">
                <NotesPage material={PLATES[rightIdx]} n={rightIdx} onTurn={() => go(rightIdx + 1)} last={rightIdx === PLATES.length - 1} />
              </Page>

              {/* The turning page, bent over the spine (see page-turn.tsx). */}
              {turn && (
                <div
                  className={`absolute inset-y-0 z-10 w-1/2 [perspective:2400px] ${
                    turn.dir === 1 ? "left-1/2 [perspective-origin:0%_50%]" : "left-0 [perspective-origin:100%_50%]"
                  }`}
                >
                  <PageTurn
                    hinge={turn.dir === 1 ? "left" : "right"}
                    from={0}
                    to={180}
                    duration={TURN_MS}
                    onDone={land}
                    front={
                      <Page side={turn.dir === 1 ? "r" : "l"}>
                        {turn.dir === 1 ? (
                          <NotesPage material={PLATES[index]} n={index} />
                        ) : (
                          <PlatePage material={PLATES[index]} n={index} />
                        )}
                      </Page>
                    }
                    back={
                      <Page side={turn.dir === 1 ? "l" : "r"}>
                        {turn.dir === 1 ? (
                          <PlatePage material={PLATES[turn.to]} n={turn.to} />
                        ) : (
                          <NotesPage material={PLATES[turn.to]} n={turn.to} />
                        )}
                      </Page>
                    }
                  />
                </div>
              )}

              {/* Spine shadow over both pages. */}
              <span className="pointer-events-none absolute inset-y-0 left-1/2 z-[5] w-24 -translate-x-1/2 bg-[linear-gradient(90deg,transparent,rgba(60,40,20,0.16)_42%,rgba(40,25,10,0.32)_50%,rgba(60,40,20,0.16)_58%,transparent)]" />

              {loupeOn && !turn && <Loupe material={PLATES[index]} magnification={ZOOMS[zoom]} />}
            </div>
          ) : (
            // One page at a time: turning forward lifts the current sheet off to the
            // left to reveal the next; turning back lays the previous one down on top.
            <div className="relative rounded-[6px]">
              {sheet(turn ? (turn.dir === 1 ? turn.to : index) : index, loupeOn && !turn)}
              {turn && (
                <div className="absolute inset-0 z-10 [perspective:1800px] [perspective-origin:0%_50%]">
                  <PageTurn
                    hinge="left"
                    from={turn.dir === 1 ? 0 : 180}
                    to={turn.dir === 1 ? 180 : 0}
                    duration={TURN_MS}
                    onDone={land}
                    strips={10}
                    front={sheet(turn.dir === 1 ? index : turn.to)}
                    back={<div className="page page--single h-full" />}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Controls. */}
        <div className="mx-auto mt-6 flex max-w-[min(1060px,calc((100dvh-200px)*1.48))] flex-wrap items-center justify-between gap-4">
          <p className="font-book text-[15px] text-graphite/70" aria-live="polite">
            Plate <span className="font-display text-[18px] italic text-graphite">{ROMAN[turn?.to ?? index]}</span> of {ROMAN[PLATES.length - 1]}
            <span className="ml-3 italic text-graphite/65">· click a page to turn</span>
          </p>

          <div className="flex items-center gap-2 rounded-full border border-graphite/15 bg-paper/70 p-1">
            <button
              type="button"
              onClick={() => setLoupeOn((v) => !v)}
              aria-pressed={loupeOn}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold transition ${loupeOn ? "bg-graphite text-paper" : "text-graphite/70 hover:text-graphite"}`}
            >
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <circle cx="8.5" cy="8.5" r="5.5" />
                <path d="M12.5 12.5L17 17" strokeLinecap="round" />
              </svg>
              Loupe
            </button>
            <RoundButton small label="Zoom out" onClick={() => setZoom((z) => Math.max(0, z - 1))} disabled={!loupeOn || zoom === 0}>
              <path d="M5 10h10" />
            </RoundButton>
            <span className="w-9 text-center font-display text-[17px] italic tabular text-graphite" aria-live="polite">
              {ZOOMS[zoom]}×
            </span>
            <RoundButton small label="Zoom in" onClick={() => setZoom((z) => Math.min(ZOOMS.length - 1, z + 1))} disabled={!loupeOn || zoom === ZOOMS.length - 1}>
              <path d="M5 10h10M10 5v10" />
            </RoundButton>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- pages -- */

function Page({ side, children }: { side: "l" | "r" | "single"; children: React.ReactNode }) {
  return (
    <div className={`page page--${side} relative h-full overflow-hidden @container`}>
      {children}
    </div>
  );
}

function PlatePage({ material, n }: { material: Material; n: number }) {
  return (
    <div className="flex h-full flex-col px-[7%] pb-[5%] pt-[6.5%]">
      <div className="flex items-baseline justify-between gap-4 font-book text-[clamp(10px,2.2cqi,12px)] uppercase tracking-[0.24em] text-graphite/70">
        <span>Plate {ROMAN[n]}</span>
        <span>{categoryLabel(material.category)}</span>
      </div>

      <figure className="relative mt-[5%] flex min-h-0 flex-1 flex-col">
        {/* The plate: drawn sample tipped onto the page with a hairline frame. */}
        <div data-plate className="plate relative min-h-[200px] flex-1 overflow-hidden rounded-[2px] shadow-[0_1px_0_rgba(255,255,255,0.6),0_14px_26px_-14px_rgba(60,40,20,0.55)] ring-1 ring-graphite/25">
          <MaterialArt surface={material.surface} tone={material.tone} className="absolute inset-0 h-full w-full" />
        </div>

        {/* Pencil annotations. */}
        {NOTES[material.surface].map((note) => ({ ...note, side: note.x < 50 ? "r" : "l" })).map((note) => (
          <span
            key={note.text}
            className="pointer-events-none absolute hidden md:block"
            style={{ left: `${note.x}%`, top: `${note.y}%` }}
            aria-hidden="true"
          >
            <span className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-paper bg-graphite/80 shadow-[0_0_0_3px_rgba(244,234,217,0.6)]" />
            <svg
              width="70"
              height="34"
              viewBox="0 0 70 34"
              className={`absolute top-0 text-graphite/70 ${note.side === "l" ? "right-0 -translate-y-full -scale-x-100" : "left-0 -translate-y-full"}`}
            >
              <path d="M2 32 C 18 26, 30 8, 68 4" fill="none" stroke="currentColor" strokeWidth="1.1" strokeDasharray="2 3" />
            </svg>
            <span
              className={`absolute top-[-46px] whitespace-nowrap rounded-[3px] bg-paper/90 px-2 py-0.5 font-display text-[15px] italic text-graphite shadow-[0_6px_14px_-8px_rgba(0,0,0,0.5)] ${
                note.side === "l" ? "right-[66px]" : "left-[66px]"
              }`}
            >
              {note.text}
            </span>
          </span>
        ))}

        <figcaption className="mt-[2.4cqi] shrink-0 font-book text-[clamp(11px,2.4cqi,13px)] italic text-graphite/70">
          Fig. {n + 1} — {material.finish}, drawn at showroom scale.
        </figcaption>
      </figure>
    </div>
  );
}

function NotesPage({
  material,
  n,
  onTurn,
  last,
}: {
  material: Material;
  n: number;
  onTurn?: () => void;
  last?: boolean;
}) {
  const surface = SURFACES.find((s) => s.categories.includes(material.category))?.id;
  const compose = () => {
    if (!surface) return;
    window.dispatchEvent(new CustomEvent("df:compose", { detail: { surface, slug: material.slug } }));
  };

  return (
    <div className="flex h-full flex-col px-[8%] pb-[5%] pt-[6.5%] text-graphite">
      <p className="font-book text-[clamp(10px,2.2cqi,12px)] uppercase tracking-[0.24em] text-graphite/70">{material.name}</p>
      <h3 className="mt-[2.4cqi] font-display text-[clamp(1.9rem,8.6cqi,3.3rem)] leading-[0.95] tracking-[-0.02em]">
        {material.finish.split(" ").slice(0, -1).join(" ")}{" "}
        <em className="text-rust">{material.finish.split(" ").slice(-1)}</em>
      </h3>
      <p className="mt-[3cqi] line-clamp-6 font-book text-[clamp(13px,2.9cqi,15.5px)] leading-[1.55] text-graphite/80 [hyphens:auto]">{material.description}</p>

      <dl className="mt-[3.4cqi] space-y-1 font-book text-[clamp(11.5px,2.5cqi,13.5px)]">
        {(
          [
            ["Size", material.specs.dimensions],
            ["Make", material.specs.composition],
            ["Fixing", material.specs.installation],
            ["Care", material.specs.maintenance],
          ] as const
        ).map(([k, v]) => (
          <div key={k} className="flex items-baseline gap-2">
            <dt className="shrink-0 italic text-graphite/70">{k}</dt>
            <span className="min-w-4 flex-1 translate-y-[-3px] border-b border-dotted border-graphite/25" aria-hidden="true" />
            <dd className="max-w-[70%] truncate text-right">{v}</dd>
          </div>
        ))}
      </dl>

      {/* Suggested pairings, as small tipped-in chips. */}
      <div className="mt-[3.6cqi]">
        <p className="font-book text-[clamp(11px,2.2cqi,12px)] italic text-graphite/70">Pairs well with</p>
        <ul className="mt-2.5 flex flex-wrap gap-3">
          {material.pairings
            .map(getMaterial)
            .filter((m): m is Material => Boolean(m))
            .map((m) => (
              <li key={m.slug} className="flex items-center gap-2">
                <span className="h-[clamp(24px,5.6cqi,32px)] w-[clamp(24px,5.6cqi,32px)] shrink-0 overflow-hidden rounded-[3px] shadow-[0_4px_8px_-4px_rgba(60,40,20,0.6)] ring-1 ring-graphite/20">
                  <MaterialArt surface={m.surface} tone={m.tone} className="h-full w-full" />
                </span>
                <span className="font-book text-[clamp(11.5px,2.5cqi,13.5px)] leading-tight text-graphite/75">{m.finish}</span>
              </li>
            ))}
        </ul>
      </div>

      <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-[3cqi]">
        <p>
          <span className="block font-book text-[12px] italic text-graphite/70">Showroom price</span>
          <span className="font-display text-[clamp(24px,5.4cqi,30px)] leading-none">{formatPeso(material.pricePhp)}</span>
          <span className="font-book text-[14px] text-graphite/70"> / {material.unit}</span>
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] font-semibold">
          {surface && (
            <button type="button" onClick={compose} className="rounded-full bg-graphite px-4 py-2 text-paper transition hover:bg-rust active:scale-[0.97]">
              Try it in the room
            </button>
          )}
          <Link href={`/catalog/${material.slug}`} className="text-rust underline decoration-rust/30 underline-offset-4 hover:decoration-rust">
            Spec sheet
          </Link>
        </div>
      </div>

      <div className="mt-[2.6cqi] flex items-center justify-between font-book text-[clamp(10.5px,2.2cqi,12px)] text-graphite/65">
        <span>Decoforge · Irisan, Baguio</span>
        <span>{n * 2 + 2}</span>
      </div>

      {/* Dog-ear: lifts on hover and turns the page when clicked. */}
      {onTurn && !last && (
        <button type="button" onClick={onTurn} aria-label="Turn the page" className="dog-ear" />
      )}
    </div>
  );
}

/* -------------------------------------------------------------- loupe -- */

const LOUPE = 156;

/**
 * A draggable lens. It finds the plate it is hovering over and redraws that
 * finish inside itself at `magnification`, offset so the point under the
 * lens centre stays under the lens centre.
 */
function Loupe({ material, magnification }: { material: Material; magnification: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [view, setView] = useState<{ w: number; h: number; ox: number; oy: number } | null>(null);
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  // Latest position for the resize handler, which outlives any one render.
  const posRef = useRef(pos);
  useEffect(() => {
    posRef.current = pos;
  }, [pos]);

  /** Keep the lens centre inside the book, whatever moved it. */
  const clamp = useCallback((p: { x: number; y: number }) => {
    const host = ref.current?.parentElement;
    if (!host) return p;
    const h = host.getBoundingClientRect();
    return { x: Math.min(h.width - 20, Math.max(20, p.x)), y: Math.min(h.height - 20, Math.max(20, p.y)) };
  }, []);

  const measure = useCallback((p: { x: number; y: number }) => {
    const host = ref.current?.parentElement;
    const plate = host?.querySelector<HTMLElement>("[data-plate]");
    if (!host || !plate) return;
    const h = host.getBoundingClientRect();
    const r = plate.getBoundingClientRect();
    setView({ w: r.width, h: r.height, ox: p.x - (r.left - h.left), oy: p.y - (r.top - h.top) });
  }, []);

  // Start over the plate, a little right of centre.
  useEffect(() => {
    const host = ref.current?.parentElement;
    const plate = host?.querySelector<HTMLElement>("[data-plate]");
    if (!host || !plate) return;
    const place = () => {
      const h = host.getBoundingClientRect();
      const r = plate.getBoundingClientRect();
      const start = { x: r.left - h.left + r.width * 0.64, y: r.top - h.top + r.height * 0.46 };
      // Keep a dragged lens where the user left it, re-clamped to the new size.
      const p = clamp(posRef.current ?? start);
      setPos(p);
      measure(p);
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [clamp, measure, material.slug]);

  const move = (clientX: number, clientY: number) => {
    const host = ref.current?.parentElement;
    if (!host || !drag.current) return;
    const h = host.getBoundingClientRect();
    const p = clamp({ x: clientX - h.left - drag.current.dx, y: clientY - h.top - drag.current.dy });
    setPos(p);
    measure(p);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (!pos) return;
    const step = e.shiftKey ? 30 : 10;
    const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (!d) return;
    e.preventDefault();
    e.stopPropagation();
    const p = clamp({ x: pos.x + d[0], y: pos.y + d[1] });
    setPos(p);
    measure(p);
  };

  return (
    <div
      ref={ref}
      data-loupe
      role="application"
      aria-roledescription="loupe"
      tabIndex={0}
      aria-label="Magnifying loupe. Drag, or use the arrow keys, to move it over the plate."
      onKeyDown={onKey}
      onPointerDown={(e) => {
        if (!pos) return;
        const host = ref.current!.parentElement!.getBoundingClientRect();
        drag.current = { dx: e.clientX - host.left - pos.x, dy: e.clientY - host.top - pos.y };
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => drag.current && move(e.clientX, e.clientY)}
      onPointerUp={() => (drag.current = null)}
      onPointerCancel={() => (drag.current = null)}
      onLostPointerCapture={() => (drag.current = null)}
      className="loupe absolute left-0 top-0 z-20 cursor-grab touch-none outline-none active:cursor-grabbing"
      style={{
        width: LOUPE,
        height: LOUPE,
        transform: pos ? `translate3d(${pos.x - LOUPE / 2}px, ${pos.y - LOUPE / 2}px, 0)` : undefined,
        opacity: pos ? 1 : 0,
      }}
    >
      {/* Handle. */}
      <span className="absolute left-[86%] top-[86%] h-[74px] w-[16px] origin-top -rotate-45 rounded-b-[8px] rounded-t-[3px] bg-[linear-gradient(90deg,#2b1a12,#5a3826_45%,#2b1a12)] shadow-[0_10px_18px_-6px_rgba(0,0,0,0.5)]" />
      {/* Brass rim and glass. */}
      <span className="absolute inset-0 rounded-full bg-[conic-gradient(from_200deg,#7a5a2c,#e9c98a,#8a6a36,#f1d9a4,#7a5a2c)] p-[7px] shadow-[0_22px_40px_-14px_rgba(40,25,10,0.7)]">
        <span className="relative block h-full w-full overflow-hidden rounded-full bg-paper shadow-[inset_0_0_0_1px_rgba(0,0,0,0.25),inset_0_6px_18px_rgba(0,0,0,0.35)]">
          {view && (
            <span
              className="absolute block"
              style={{
                width: view.w * magnification,
                height: view.h * magnification,
                left: (LOUPE - 14) / 2 - view.ox * magnification,
                top: (LOUPE - 14) / 2 - view.oy * magnification,
              }}
            >
              <MaterialArt surface={material.surface} tone={material.tone} className="h-full w-full" />
            </span>
          )}
          {/* Glare. */}
          <span className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(60%_45%_at_32%_22%,rgba(255,255,255,0.55),transparent_60%)]" />
        </span>
      </span>
    </div>
  );
}

/* ------------------------------------------------------------ bits -- */

/** Soft arrow at a page's outer edge, shown while that half of the book would turn on click. */
function TurnHint({ side, active }: { side: "l" | "r"; active: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute top-1/2 z-[15] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-paper/95 text-graphite shadow-[0_8px_22px_-10px_rgba(60,40,20,0.6)] ring-1 ring-graphite/15 transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        side === "l" ? "left-3" : "right-3"
      } ${active ? "opacity-100" : "opacity-0"} ${
        active ? "" : side === "l" ? "translate-x-1" : "-translate-x-1"
      }`}
    >
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={side === "l" ? "rotate-180" : ""}>
        <path d="M3 10h13M11 5l5 5-5 5" />
      </svg>
    </span>
  );
}

function RoundButton({
  label,
  onClick,
  disabled,
  small,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  small?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`flex items-center justify-center rounded-full border border-graphite/20 text-graphite transition duration-300 hover:border-graphite hover:bg-graphite hover:text-paper active:scale-95 disabled:pointer-events-none disabled:opacity-30 ${
        small ? "h-9 w-9" : "h-12 w-12"
      }`}
    >
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
      </svg>
    </button>
  );
}

/**
 * A Benguet pine sprig in graphite, for the paper's margins. Needles are laid
 * in fascicles along a curved twig, deterministically so server and client
 * agree.
 */
export function PineSprig({ className, flip }: { className?: string; flip?: boolean }) {
  const needles: string[] = [];
  for (let i = 0; i < 26; i++) {
    const t = i / 25;
    // Quadratic twig from (20,380) via (120,200) to (300,30).
    const x = (1 - t) ** 2 * 20 + 2 * (1 - t) * t * 120 + t ** 2 * 300;
    const y = (1 - t) ** 2 * 380 + 2 * (1 - t) * t * 200 + t ** 2 * 30;
    const len = 38 + Math.sin(i * 1.7) * 10 + (1 - t) * 18;
    for (const a of [-0.9, -0.55, -0.2, 0.25, 0.6, 0.95]) {
      const ang = -Math.PI / 4 + a + Math.sin(i * 3.1 + a) * 0.12;
      const ex = x + Math.cos(ang) * len * (0.7 + Math.abs(a) * 0.3);
      const ey = y + Math.sin(ang) * len * (0.7 + Math.abs(a) * 0.3);
      const cx = (x + ex) / 2 + Math.sin(i + a) * 4;
      const cy = (y + ey) / 2 - 3;
      needles.push(`M${x.toFixed(1)} ${y.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`);
    }
  }
  return (
    <svg viewBox="0 0 360 420" className={className} style={flip ? { transform: "scaleX(-1)" } : undefined} aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeLinecap="round">
        <path d="M20 380 Q120 200 300 30" strokeWidth="2.2" />
        <path d={needles.join(" ")} strokeWidth="0.8" opacity="0.85" />
      </g>
      {/* A cone hanging off the twig. */}
      <g transform="translate(150 250) rotate(18)" fill="none" stroke="currentColor" strokeWidth="0.9">
        <ellipse cx="0" cy="34" rx="20" ry="36" />
        {[8, 20, 32, 44, 56].map((yy) => (
          <path key={yy} d={`M-18 ${yy} Q0 ${yy + 9} 18 ${yy}`} />
        ))}
        <path d="M0 -2 V70" opacity="0.5" />
      </g>
    </svg>
  );
}
