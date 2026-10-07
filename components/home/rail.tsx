"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A horizontal, snap-scrolling shelf.
 *
 * Touch, trackpads and shift-wheel use native scrolling, which is already
 * smooth. A mouse can grab and drag it: the shelf follows the pointer 1:1,
 * keeps its momentum on release, then eases onto the nearest card. A drag
 * never fires the link under the pointer; a plain click still does. The
 * buttons nudge one card at a time, and the hairline shows how far along you are.
 */

const DRAG_THRESHOLD = 6; // px before a press counts as a drag, not a click
const FRICTION = 0.94; // velocity kept per 16ms frame of momentum

export function Rail({ label, children }: { label: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLSpanElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    // The thumb is written straight to the DOM once per frame, with no CSS
    // transition, so it tracks the shelf exactly instead of trailing it. React
    // only re-renders when an arrow button flips between enabled and disabled.
    const measure = () => {
      raf = 0;
      const max = el.scrollWidth - el.clientWidth;
      const visible = el.scrollWidth > 0 ? el.clientWidth / el.scrollWidth : 1;
      const progress = max > 0 ? el.scrollLeft / max : 0;
      const thumb = thumbRef.current;
      if (thumb) {
        thumb.style.width = `${visible * 100}%`;
        // translateX % is of the thumb's own width; travel is the track minus the thumb.
        thumb.style.transform = `translate3d(${(progress * (1 - visible) * 100) / visible}%,0,0)`;
      }
      const start = el.scrollLeft < 4;
      const end = el.scrollLeft > max - 4;
      setEdges((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
    };
    const update = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    // Scroll events already arrive once per frame, just before it is drawn, so
    // the thumb is moved right there: deferring to the next frame would leave it
    // one frame behind the cards on a fast fling.
    el.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", measure);
      window.removeEventListener("resize", update);
      cancelAnimationFrame(raf);
    };
  }, []);

  /* --------------------------------------------------- mouse drag -- */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let pressed = false;
    let dragging = false;
    let startX = 0;
    let startScroll = 0;
    let lastX = 0;
    let lastT = 0;
    let velocity = 0; // px per ms, positive = content moving left
    let anim = 0;

    const maxScroll = () => el.scrollWidth - el.clientWidth;
    const clamp = (v: number) => Math.min(maxScroll(), Math.max(0, v));

    // Snap points, measured the way CSS scroll-snap places them.
    const snapPoints = () => {
      const pad = parseFloat(getComputedStyle(el).paddingLeft) || 0;
      const box = el.getBoundingClientRect();
      return Array.from(el.children, (c) =>
        clamp(el.scrollLeft + (c as HTMLElement).getBoundingClientRect().left - box.left - pad),
      );
    };

    const release = () => el.classList.remove("rail-dragging");

    // Ease onto the nearest card, then hand control back to CSS snapping.
    const settle = () => {
      const from = el.scrollLeft;
      const to = snapPoints().reduce((best, p) => (Math.abs(p - from) < Math.abs(best - from) ? p : best), from);
      const t0 = performance.now();
      const dur = Math.min(520, 240 + Math.abs(to - from) * 0.8);
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / dur);
        el.scrollLeft = from + (to - from) * (1 - Math.pow(1 - t, 3));
        if (t < 1) anim = requestAnimationFrame(step);
        else release();
      };
      anim = requestAnimationFrame(step);
    };

    // Carry the throw, decaying with friction, then settle.
    const coast = () => {
      let last = performance.now();
      const step = (now: number) => {
        const dt = Math.min(48, now - last);
        last = now;
        const before = el.scrollLeft;
        el.scrollLeft = clamp(before + velocity * dt);
        velocity *= Math.pow(FRICTION, dt / 16);
        const stuck = el.scrollLeft === before;
        if (Math.abs(velocity) > 0.05 && !stuck) anim = requestAnimationFrame(step);
        else settle();
      };
      anim = requestAnimationFrame(step);
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      cancelAnimationFrame(anim);
      pressed = true;
      dragging = false;
      startX = lastX = e.clientX;
      startScroll = el.scrollLeft;
      lastT = performance.now();
      velocity = 0;
    };

    const onMove = (e: PointerEvent) => {
      if (!pressed) return;
      // The release was lost (alt-tab, context menu): end the drag here.
      if (e.buttons === 0) return onUp();
      const dx = e.clientX - startX;
      if (!dragging) {
        if (Math.abs(dx) < DRAG_THRESHOLD) return;
        dragging = true;
        // Snapping and smooth-scroll would fight the pointer; switch them off while dragging.
        el.classList.add("rail-dragging");
      }
      const now = performance.now();
      const dt = Math.max(1, now - lastT);
      // Smoothed release velocity, so one jittery sample can't fling the shelf.
      velocity = 0.75 * ((lastX - e.clientX) / dt) + 0.25 * velocity;
      lastX = e.clientX;
      lastT = now;
      el.scrollLeft = clamp(startScroll - dx);
    };

    const onUp = () => {
      if (!pressed) return;
      pressed = false;
      if (!dragging) {
        // A press that interrupted a glide: finish settling so snapping comes back.
        if (el.classList.contains("rail-dragging")) settle();
        return;
      }
      // Swallow the click that follows a drag, so a card link doesn't open.
      // Scoped to this event turn: if no click comes, the next real one isn't eaten.
      const swallow = (ev: MouseEvent) => ev.preventDefault();
      el.addEventListener("click", swallow, { capture: true, once: true });
      window.setTimeout(() => el.removeEventListener("click", swallow, { capture: true }), 0);
      // A pause before letting go means "place it here", not "throw it".
      if (performance.now() - lastT > 80) velocity = 0;
      coast();
    };

    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      cancelAnimationFrame(anim);
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  const nudge = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>(":scope > *");
    el.scrollBy({ left: dir * ((card?.offsetWidth ?? 320) + 20), behavior: "smooth" });
  };

  return (
    <div className="mt-14" data-reveal>
      <div
        ref={ref}
        role="region"
        aria-label={label}
        tabIndex={0}
        data-lenis-prevent-horizontal
        onDragStart={(e) => e.preventDefault()}
        className="rail pad-container flex cursor-grab snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain pb-6 [scroll-padding-inline:max(var(--gutter),calc((100%-var(--container))/2))] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>

      <div className="container-df mt-4 flex items-center gap-6">
        {/* Scrollbar: the thumb's length is how much of the shelf is in view. */}
        <div className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-ink/10" aria-hidden="true">
          <span ref={thumbRef} className="absolute inset-y-0 left-0 w-1/4 rounded-full bg-rust will-change-transform" />
        </div>
        <div className="flex gap-2">
          {([-1, 1] as const).map((dir) => (
            <button
              key={dir}
              type="button"
              onClick={() => nudge(dir)}
              disabled={dir === -1 ? edges.start : edges.end}
              aria-label={dir === -1 ? "Previous materials" : "Next materials"}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-ink/15 transition duration-300 hover:border-ink hover:bg-ink hover:text-cream active:scale-95 disabled:pointer-events-none disabled:opacity-30"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true" className={dir === -1 ? "rotate-180" : ""}>
                <path d="M3 10h13M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
