"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { primaryNav, site } from "@/lib/site";

/**
 * `dark` is used over the home hero, `light` on every other page — which is
 * exactly how the two treatments appear in the design.
 */
export function SiteHeader({ variant = "light" }: { variant?: "light" | "dark" }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile sheet whenever the route changes.
  useEffect(() => setOpen(false), [pathname]);

  // Lock the page behind the open sheet.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const dark = variant === "dark";
  const isActive = (href: string) =>
    href.startsWith("/#") ? false : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className={[
        "sticky top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-500",
        // Solid behind the open mobile sheet, otherwise transparent until scroll.
        open
          ? dark
            ? "border-white/10 bg-ink"
            : "border-stone bg-cream"
          : scrolled
            ? dark
              ? "border-white/10 bg-ink/60 backdrop-blur-xl backdrop-saturate-150"
              : "border-stone/70 bg-cream/60 backdrop-blur-xl backdrop-saturate-150"
            : "border-transparent bg-transparent",
      ].join(" ")}
    >
      <div className="container-df flex h-[72px] items-center gap-6">
        <Link
          href="/"
          className="mr-auto text-[26px] font-extrabold tracking-[-0.04em] text-rust transition-transform duration-300 hover:scale-[1.03]"
        >
          {site.name}
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={[
                "group relative text-[15px] transition-colors duration-300",
                isActive(item.href)
                  ? "font-semibold text-rust"
                  : dark
                    ? "text-white/75 hover:text-white"
                    : "text-ink/75 hover:text-ink",
              ].join(" ")}
            >
              {item.label}
              <span
                aria-hidden="true"
                className={[
                  "absolute -bottom-1.5 left-0 h-[2px] rounded bg-rust transition-[width] duration-300 ease-out",
                  isActive(item.href) ? "w-full" : "w-0 group-hover:w-full",
                ].join(" ")}
              />
            </Link>
          ))}
        </nav>

        <Link
          href="/contact"
          className="hidden rounded-lg bg-rust px-5 py-2.5 text-[15px] font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-rust-2 hover:shadow-[0_12px_26px_-12px_rgba(178,58,15,0.8)] md:inline-flex"
        >
          Get a Quote
        </Link>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          className={[
            "inline-flex h-10 w-10 items-center justify-center rounded-lg border md:hidden",
            dark ? "border-white/20 text-white" : "border-stone-2 text-ink",
          ].join(" ")}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            {open ? (
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            ) : (
              <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div className={dark ? "border-t border-white/10 bg-ink md:hidden" : "border-t border-stone bg-cream md:hidden"}>
          <nav aria-label="Mobile" className="container-df flex flex-col gap-1 py-4">
            {primaryNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "rounded-lg px-3 py-3 text-lg font-medium",
                  isActive(item.href)
                    ? "text-rust"
                    : dark
                      ? "text-white/85 hover:bg-white/5"
                      : "text-ink/85 hover:bg-stone/60",
                ].join(" ")}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/contact"
              className="mt-2 rounded-lg bg-rust px-5 py-3.5 text-center text-base font-semibold text-white"
            >
              Get a Quote
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
