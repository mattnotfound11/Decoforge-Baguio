"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { primaryNav, site } from "@/lib/site";
import { getLenis, lockScroll } from "@/lib/smooth";

/**
 * `dark` rides over dark page tops (home, contact), `light` over cream ones.
 *
 * At rest the bar is transparent: wordmark, a tray of pill links, and a pill
 * call-to-action whose arrow slides across on hover. A single raised pill
 * glides to the active item — the current page, or on the home page the
 * section you are reading. Once the page scrolls, the bar condenses into a
 * rounded capsule. Below `lg` the links move into a sheet from the right.
 */

const links = [{ label: "Home", href: "/" }, ...primaryNav];
const SECTION_IDS = links.filter((l) => l.href.startsWith("/#")).map((l) => l.href.slice(2));
/** How long a nav click owns the highlight while the page glides to its section. */
const GLIDE_MS = 1300;

export function SiteHeader({ variant = "light" }: { variant?: "light" | "dark" }) {
  const pathname = usePathname();
  const onHome = pathname === "/";
  // The sheet is open for the path it was opened on, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Hold the page still behind the open sheet. Escape closes it, and so does
  // widening past the mobile layout (the sheet would vanish but keep the lock).
  useEffect(() => {
    if (!open) return;
    lockScroll(true);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenOn(null);
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onWide = () => desktop.matches && setOpenOn(null);
    window.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onWide);
    return () => {
      lockScroll(false);
      window.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onWide);
    };
  }, [open]);

  /* ------------------------------------------- scroll spy (home only) -- */
  // Which home section is under the reading line: Home above the first
  // tracked section, then each section until the next one begins, and
  // nothing once the last tracked section has scrolled past.
  const [section, setSection] = useState<string | null>("/");
  const lockUntil = useRef(0);

  useEffect(() => {
    if (!onHome) return;
    let raf = 0;
    const compute = () => {
      raf = 0;
      if (performance.now() < lockUntil.current) return;
      const line = window.innerHeight * 0.38;
      let current: string | null = "/";
      for (const id of SECTION_IDS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) current = `/#${id}`;
      }
      const last = document.getElementById(SECTION_IDS[SECTION_IDS.length - 1]);
      if (last && last.getBoundingClientRect().bottom < line) current = null;
      setSection(current);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(compute);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [onHome]);

  const activeHref = onHome
    ? section
    : (links.find((l) => !l.href.startsWith("/#") && l.href !== "/" && (pathname === l.href || pathname.startsWith(`${l.href}/`)))?.href ?? null);

  /** On the home page, section links glide there instead of jumping. */
  const go = (e: React.MouseEvent, href: string) => {
    if (!onHome || !(href === "/" || href.startsWith("/#"))) return;
    e.preventDefault();
    // Keep Lenis's own anchor handler (on window) from starting a second scroll.
    e.stopPropagation();
    const id = href === "/" ? null : href.slice(2);
    const target = id ? document.getElementById(id) : null;
    if (id && !target) return;

    setSection(href);
    lockUntil.current = performance.now() + GLIDE_MS;
    setOpenOn(null);
    window.history.replaceState(null, "", id ? `#${id}` : "/");

    // Start the glide on the next frame: closing the mobile sheet releases its
    // scroll lock, and Lenis's start() cancels any glide already running.
    requestAnimationFrame(() => {
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(target ?? 0, { offset: id ? -84 : 0, duration: 1.15, force: true });
      else window.scrollTo({ top: target ? target.getBoundingClientRect().top + window.scrollY - 84 : 0, behavior: "smooth" });
    });
  };

  /* ------------------------------------------ gliding active highlight -- */
  const trayRef = useRef<HTMLUListElement>(null);
  const [glide, setGlide] = useState<{ x: number; w: number } | null>(null);
  const activeIndex = links.findIndex((l) => l.href === activeHref);

  const measure = useCallback(() => {
    // The <li>'s offset is relative to the tray; the link's would not be.
    const item = activeIndex < 0 ? null : trayRef.current?.querySelectorAll<HTMLElement>(":scope > li")[activeIndex];
    setGlide(item ? { x: item.offsetLeft, w: item.offsetWidth } : null);
  }, [activeIndex]);

  useEffect(() => {
    const raf = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  const dark = variant === "dark";

  return (
    <header className="sticky top-0 z-50 flex h-[76px] items-center justify-center px-4">
      <div
        className={[
          "flex w-full max-w-[calc(var(--container)+2rem)] items-center justify-between gap-3.5 rounded-full border transition-[padding,background-color,border-color,box-shadow] duration-500 lg:gap-6",
          scrolled
            ? dark
              ? // Opaque enough to need no backdrop blur, which would re-filter the page every frame.
                "border-white/10 bg-[#1c1512]/[0.94] p-2.5 shadow-2xl shadow-black/40"
              : "border-ink/10 bg-[#fbf3ea]/[0.92] p-2.5 shadow-2xl shadow-ink/10"
            : "border-transparent bg-transparent px-0 py-2.5",
        ].join(" ")}
      >
        {/* Wordmark. */}
        <Link
          href="/"
          onClick={(e) => go(e, "/")}
          className="flex shrink-0 items-center pl-1.5"
          aria-label={`${site.name} — home`}
        >
          <span className="leading-none">
            <span className={`block font-display text-[25px] ${dark ? "text-white" : "text-ink"}`}>
              Deco<em className={dark ? "text-ember" : "text-rust"}>forge</em>
            </span>
            <span
              className={`mt-0.5 block text-[9px] font-semibold uppercase tracking-[0.3em] ${dark ? "text-white/60" : "text-ink/65"}`}
            >
              Home &amp; Aesthetics
            </span>
          </span>
        </Link>

        {/* Links in a muted tray; one raised pill glides to the active item. */}
        <nav aria-label="Primary" className="max-lg:hidden">
          <ul ref={trayRef} className={`relative flex items-center rounded-full p-0.5 ${dark ? "bg-white/[0.07]" : "bg-ink/[0.06]"}`}>
            <span
              aria-hidden="true"
              className={`absolute inset-y-0.5 left-0 rounded-full transition-[transform,width,opacity] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                dark ? "bg-cream" : "bg-white shadow-[0_1px_2px_rgba(23,18,16,0.08)]"
              }`}
              style={{ width: glide?.w ?? 0, transform: `translate3d(${glide?.x ?? 0}px,0,0)`, opacity: glide ? 1 : 0 }}
            />
            {links.map((item) => {
              const active = item.href === activeHref;
              return (
                <li key={item.href} className="relative">
                  <Link
                    href={item.href}
                    onClick={(e) => go(e, item.href)}
                    aria-current={active ? (item.href.startsWith("/#") ? "location" : "page") : undefined}
                    className={[
                      "relative block whitespace-nowrap rounded-full px-3 py-1.5 text-[14px] font-medium transition-colors duration-300 xl:px-4",
                      dark
                        ? active
                          ? "text-ink"
                          : "text-white/60 hover:bg-white/[0.08] hover:text-white"
                        : active
                          ? "text-ink"
                          : "text-ink/70 hover:bg-white/70 hover:text-ink",
                    ].join(" ")}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center gap-4">
          {/* Pill CTA: on hover the arrow disc slides from the right end to the left and turns. */}
          <Link
            href="/contact"
            className="group relative hidden h-10 w-fit items-center overflow-hidden whitespace-nowrap rounded-full bg-rust p-1 pe-12 ps-4 text-[14px] font-medium text-white shadow transition-all duration-500 hover:bg-rust-2 hover:pe-4 hover:ps-12 lg:flex"
          >
            <span className="relative z-10 transition-all duration-500">Get a quote</span>
            <span className="absolute right-1 flex h-8 w-8 items-center justify-center rounded-full bg-cream text-rust transition-all duration-500 group-hover:right-[calc(100%-36px)] group-hover:rotate-45">
              <Arrow />
            </span>
          </Link>

          {/* Mobile trigger. */}
          <button
            type="button"
            onClick={() => setOpenOn(pathname)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label="Open menu"
            className={`rounded-full border p-3 transition-colors lg:hidden ${
              dark ? "border-white/15 text-white hover:bg-white/10" : "border-ink/15 text-ink hover:bg-ink/5"
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile sheet: overlay plus a panel sliding in from the right. */}
      <div
        id="mobile-menu"
        className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none"}`}
        aria-hidden={!open}
        inert={!open}
      >
        <div
          onClick={() => setOpenOn(null)}
          className={`absolute inset-0 bg-black/80 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className={`absolute inset-y-0 right-0 flex h-full w-3/4 max-w-sm flex-col gap-6 border-l border-ink/10 bg-cream p-6 text-ink shadow-lg transition-transform ease-in-out ${
            open ? "translate-x-0 duration-500" : "translate-x-full duration-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-display text-[24px] leading-none">
              Deco<em className="text-rust">forge</em>
            </span>
            <button
              type="button"
              onClick={() => setOpenOn(null)}
              aria-label="Close menu"
              className="-mr-3 flex h-11 w-11 items-center justify-center rounded-full opacity-70 transition-opacity hover:opacity-100"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav aria-label="Mobile">
            <ul className="flex flex-col gap-1">
              {links.map((item) => {
                const active = item.href === activeHref;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={(e) => {
                        go(e, item.href);
                        setOpenOn(null);
                      }}
                      aria-current={active ? (item.href.startsWith("/#") ? "location" : "page") : undefined}
                      className={`block rounded-full px-4 py-2.5 text-[15px] font-medium transition ${
                        active ? "bg-ink/[0.06] text-ink" : "text-ink/65 hover:bg-ink/[0.04] hover:text-ink"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <Link
            href="/contact"
            onClick={() => setOpenOn(null)}
            className="group relative mt-auto flex h-11 items-center justify-center overflow-hidden rounded-full bg-rust p-1 pe-12 ps-4 text-[14px] font-medium text-white shadow"
          >
            Get a quote
            <span className="absolute right-1 flex h-9 w-9 items-center justify-center rounded-full bg-cream text-rust">
              <Arrow />
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}

function Arrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 7h10v10" />
      <path d="M7 17 17 7" />
    </svg>
  );
}
