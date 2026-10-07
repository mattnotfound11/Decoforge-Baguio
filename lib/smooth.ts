import type Lenis from "lenis";

/**
 * The page's one Lenis instance, shared so the mobile menu and the intro can
 * pause scrolling without each holding a reference. `null` when the visitor
 * prefers reduced motion — native scrolling is used instead.
 */
let instance: Lenis | null = null;

export const setLenis = (lenis: Lenis | null) => {
  instance = lenis;
};

export const getLenis = () => instance;

/** Pause or resume page scroll, with or without Lenis. */
export function lockScroll(locked: boolean) {
  if (instance) {
    if (locked) instance.stop();
    else instance.start();
  }
  document.documentElement.style.overflow = locked ? "hidden" : "";
}
