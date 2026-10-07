"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * One observer for the whole page.
 *
 * Sections opt in with `data-reveal`, `data-split` (see motion/split-text.tsx)
 * or `data-count`, and stay plain server components — this is the only client
 * code involved. Re-runs on navigation so client-side route changes pick up
 * the new page's elements. Also owns the cursor spotlight on `.spotlight`
 * cards, so the page carries one pointer listener rather than one per card.
 */
export function ScrollReveal() {
  const pathname = usePathname();

  // Tell the head script's failsafe that reveals are running (see app/layout.tsx).
  useEffect(() => {
    document.documentElement.setAttribute("data-reveal-ready", "");
  }, []);

  useEffect(() => {
    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal], [data-split], [data-count]"),
    );
    if (nodes.length === 0) return;

    const show = (el: HTMLElement) => {
      el.classList.add("is-visible");
      if (el.dataset.count) countUp(el);
    };

    // Anyone who asked for less motion, or whose browser lacks the observer,
    // gets the content immediately rather than a blank page.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || typeof IntersectionObserver === "undefined") {
      nodes.forEach((el) => {
        el.classList.add("is-visible");
        if (el.dataset.count) el.textContent = format(el, Number(el.dataset.count));
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          show(entry.target as HTMLElement);
          observer.unobserve(entry.target);
        }
      },
      // Fire as soon as an edge enters, so fast scrolling never lands on a blank block.
      { rootMargin: "0px 0px 0px 0px", threshold: 0 },
    );

    let failsafe = 0;
    const start = () => {
      nodes.forEach((node) => observer.observe(node));
      // Safety net: if the observer misfires, uncover whatever is already on
      // or above the screen — but leave the rest to animate when reached.
      failsafe = window.setTimeout(() => {
        for (const el of nodes) {
          if (!el.classList.contains("is-visible") && el.getBoundingClientRect().top < window.innerHeight) show(el);
        }
      }, 2500);
    };

    // While the intro screen is up, hold reveals so the hero plays after it.
    const waiting = document.documentElement.dataset.intro === "play";
    if (waiting) window.addEventListener("df:intro-done", start, { once: true });
    else start();

    return () => {
      window.removeEventListener("df:intro-done", start);
      observer.disconnect();
      window.clearTimeout(failsafe);
    };
  }, [pathname]);

  useEffect(() => {
    // At most one layout read per frame, and none on touch screens.
    if (!window.matchMedia("(hover: hover)").matches) return;
    let raf = 0;
    let last: PointerEvent | null = null;
    const apply = () => {
      raf = 0;
      const e = last;
      const card = (e?.target as Element | null)?.closest<HTMLElement>(".spotlight");
      if (!e || !card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    const onMove = (e: PointerEvent) => {
      last = e;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}

function format(el: HTMLElement, value: number) {
  const decimals = Number(el.dataset.decimals ?? 0);
  return `${el.dataset.prefix ?? ""}${value.toLocaleString("en-PH", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}${el.dataset.suffix ?? ""}`;
}

/** Ease a numeral up to its `data-count` target once it is on screen. */
function countUp(el: HTMLElement) {
  const target = Number(el.dataset.count);
  if (!Number.isFinite(target) || el.dataset.counted) return;
  el.dataset.counted = "1";
  const duration = 1600;
  const t0 = performance.now();
  const tick = (now: number) => {
    const t = Math.min(1, (now - t0) / duration);
    const eased = 1 - Math.pow(1 - t, 4);
    el.textContent = format(el, target * eased);
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
