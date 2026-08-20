"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * One observer for the whole page.
 *
 * Sections opt in with `data-reveal` and stay plain server components — this is
 * the only client code involved. Re-runs on navigation so client-side route
 * changes pick up the new page's elements.
 */
export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (nodes.length === 0) return;

    const show = (el: Element) => el.classList.add("is-visible");

    // Anyone who asked for less motion, or whose browser lacks the observer,
    // gets the content immediately rather than a blank page.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || typeof IntersectionObserver === "undefined") {
      nodes.forEach(show);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          show(entry.target);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );

    nodes.forEach((node) => observer.observe(node));

    // Safety net: nothing should stay hidden if the observer misfires.
    const failsafe = window.setTimeout(() => nodes.forEach(show), 3000);

    return () => {
      observer.disconnect();
      window.clearTimeout(failsafe);
    };
  }, [pathname]);

  return null;
}
