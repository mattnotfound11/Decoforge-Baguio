"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { getLenis, lockScroll, setLenis } from "@/lib/smooth";

/**
 * Inertia scrolling. Lenis drives the real document scroll, so CSS
 * scroll-driven animations, IntersectionObserver, and anchor links all keep
 * working — it only smooths the input.
 */
export function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      // Smooth but quick to settle (~0.4s), so a trackpad never feels a beat behind the hand.
      lerp: 0.14,
      wheelMultiplier: 1,
      touchMultiplier: 1,
      // Touch keeps the platform's own momentum, which is already smooth and native-feeling.
      syncTouch: false,
      anchors: { offset: -88 },
      // Scrollable boxes (the booking textarea, the menu sheet) keep their own wheel.
      allowNestedScroll: true,
      autoRaf: true,
    });
    setLenis(lenis);

    // Hold the page still while the intro plays.
    if (document.documentElement.dataset.intro === "play") {
      lockScroll(true);
      const release = () => lockScroll(false);
      window.addEventListener("df:intro-done", release, { once: true });
    }

    return () => {
      lenis.destroy();
      setLenis(null);
    };
  }, []);

  // New page: new height, and drop any glide still running from the last
  // page so it can't drag the new one away from where the router put it.
  useEffect(() => {
    const lenis = getLenis();
    if (!lenis) return;
    const raf = requestAnimationFrame(() => {
      lenis.resize();
      lenis.scrollTo(window.scrollY, { immediate: true, force: true });
    });
    return () => cancelAnimationFrame(raf);
  }, [pathname]);

  return null;
}
