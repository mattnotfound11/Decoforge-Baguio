"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * A page that bends as it turns, like paper rather than a board.
 *
 * The leaf is cut into narrow vertical strips, each hinged to the one before
 * it (strip 0 hangs on the spine). Every frame the strips nearer the free edge
 * are rotated a little further than those near the spine, so the page curls
 * up from its edge, arcs over, and lies flat again on landing. Each strip is
 * shaded by its angle to the light, and a soft shadow falls on the pages
 * underneath. Only `transform` and `opacity` change, so it composites on the GPU.
 *
 * Sized entirely in percentages of its box: drop it over a page and it fits.
 */

/** Default strip count; fewer suit a narrow page (each strip stays ~35–45px). */
const STRIPS = 16;
/** How far the free edge leads the spine at mid-turn, in degrees. */
const CURL = 62;

export function PageTurn({
  hinge,
  from,
  to,
  duration,
  front,
  back,
  onDone,
  strips: stripCount = STRIPS,
}: {
  /** Which edge of this box the page is bound on. */
  hinge: "left" | "right";
  /** Start and end angle: 0 = lying on its own side, 180 = turned onto the other. */
  from: 0 | 180;
  to: 0 | 180;
  duration: number;
  /** Seen at 0°. */
  front: ReactNode;
  /** Seen at 180°, laid out as the facing page. */
  back: ReactNode;
  onDone: () => void;
  strips?: number;
}) {
  const strips = useRef<(HTMLDivElement | null)[]>([]);
  const frontShades = useRef<(HTMLSpanElement | null)[]>([]);
  const backShades = useRef<(HTMLSpanElement | null)[]>([]);
  const castUnder = useRef<HTMLSpanElement>(null);
  const castOver = useRef<HTMLSpanElement>(null);
  const done = useRef(onDone);

  useEffect(() => {
    done.current = onDone;
  }, [onDone]);

  useEffect(() => {
    // rotateY(-a) lifts a left-hinged page toward the viewer; a right-hinged one needs +a.
    const sign = hinge === "left" ? -1 : 1;
    // The free edge leads in the direction of travel.
    const lead = to > from ? 1 : -1;
    let raf = 0;

    const apply = (p: number) => {
      // Ease in and out, like a hand lifting and laying down a page.
      const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      const theta = from + (to - from) * e;
      const curl = Math.sin(Math.PI * p) * CURL;

      let prev = 0;
      for (let i = 0; i < stripCount; i++) {
        const t = i / (stripCount - 1);
        const a = Math.min(180, Math.max(0, theta + lead * curl * Math.pow(t, 1.6)));
        const strip = strips.current[i];
        if (strip) strip.style.transform = `rotateY(${(sign * (a - prev)).toFixed(3)}deg)`;
        // Light from the viewer: a face darkens as it turns edge-on.
        const c = Math.cos((a * Math.PI) / 180);
        const f = frontShades.current[i];
        const b = backShades.current[i];
        if (f) f.style.opacity = (((1 - c) / 2) * 0.55).toFixed(3);
        if (b) b.style.opacity = (((1 + c) / 2) * 0.5).toFixed(3);
        prev = a;
      }

      // The lifted page shades the page it is leaving, then the one it lands on.
      const s = Math.sin((theta * Math.PI) / 180);
      if (castUnder.current) castUnder.current.style.opacity = (s * (1 - theta / 180) * 0.9).toFixed(3);
      if (castOver.current) castOver.current.style.opacity = (s * (theta / 180) * 0.9).toFixed(3);
    };

    apply(0);
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      apply(p);
      if (p < 1) raf = requestAnimationFrame(tick);
      else done.current();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hinge, from, to, duration, stripCount]);

  const near = hinge; // the side the strips are anchored to
  const far = hinge === "left" ? "right" : "left";

  const strip = (i: number): ReactNode => (
    <div
      ref={(el) => {
        strips.current[i] = el;
      }}
      className="pt-strip"
      style={{
        [near]: i === 0 ? 0 : "100%",
        width: i === 0 ? `${100 / stripCount}%` : "100%",
        transformOrigin: hinge === "left" ? "0 50%" : "100% 50%",
      }}
    >
      {/* Each face shows its own slice of the full page. */}
      <div className="pt-face">
        <div className="pt-content" style={{ width: `${stripCount * 100}%`, [near]: `${-i * 100}%` }}>
          {front}
        </div>
        <span
          ref={(el) => {
            frontShades.current[i] = el;
          }}
          className="pt-shade"
        />
      </div>
      <div className="pt-face pt-face--back">
        <div className="pt-content" style={{ width: `${stripCount * 100}%`, [far]: `${-i * 100}%` }}>
          {back}
        </div>
        <span
          ref={(el) => {
            backShades.current[i] = el;
          }}
          className="pt-shade"
        />
      </div>
      {i < stripCount - 1 && strip(i + 1)}
    </div>
  );

  return (
    <div className="pt" aria-hidden="true" inert>
      <span
        ref={castUnder}
        className="pt-cast"
        style={{ [near]: 0, backgroundImage: `linear-gradient(to ${far}, rgba(40,25,10,0.45), rgba(40,25,10,0.12) 45%, transparent 80%)` }}
      />
      <span
        ref={castOver}
        className="pt-cast"
        style={{ [far]: "100%", backgroundImage: `linear-gradient(to ${near}, rgba(40,25,10,0.45), rgba(40,25,10,0.12) 45%, transparent 80%)` }}
      />
      {strip(0)}
    </div>
  );
}
