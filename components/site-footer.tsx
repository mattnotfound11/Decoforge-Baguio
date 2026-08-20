import Link from "next/link";
import { footerNav, site } from "@/lib/site";

/** `dark` matches the home page footer; `light` the inner pages. */
export function SiteFooter({ variant = "light" }: { variant?: "light" | "dark" }) {
  const dark = variant === "dark";

  return (
    <footer className={dark ? "bg-ink text-white/70" : "bg-stone text-ink/70"}>
      <div className="container-df grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr] md:gap-8">
        <div>
          <div className={`text-[26px] font-extrabold tracking-[-0.04em] ${dark ? "text-white" : "text-ink"}`}>
            {site.name}
          </div>
          <p className="mt-3 max-w-xs text-[15px] leading-relaxed">
            © 2024 {site.legalName}. All rights reserved.
          </p>
          <p className="mt-4 max-w-xs text-[15px] leading-relaxed">
            {site.showroom.line1}
            <br />
            {site.showroom.line2}
          </p>

          <a
            href={site.facebook}
            target="_blank"
            rel="noreferrer"
            className={`mt-5 inline-flex items-center gap-2.5 rounded-lg px-4 py-2.5 text-[14px] font-semibold transition ${
              dark ? "bg-white/10 text-white hover:bg-white/15" : "bg-white text-ink hover:bg-white/70"
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M11.5 18v-6h2l.4-2.6h-2.4V7.7c0-.75.2-1.26 1.28-1.26H14V4.12A17 17 0 0012.02 4C10.06 4 8.7 5.2 8.7 7.4v2H6.5V12h2.2v6z" fill="#1877F2" />
            </svg>
            Follow us on Facebook
          </a>
        </div>

        <nav aria-label="Footer" className="flex flex-col gap-3">
          {footerNav.slice(0, 2).map((item) => (
            <Link key={item.label} href={item.href} className="text-[15px] underline underline-offset-4 hover:text-rust">
              {item.label}
            </Link>
          ))}
        </nav>

        <nav aria-label="Footer secondary" className="flex flex-col gap-3">
          {footerNav.slice(2).map((item) => (
            <Link key={item.label} href={item.href} className="text-[15px] underline underline-offset-4 hover:text-rust">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className={`container-df flex flex-wrap gap-x-8 gap-y-2 border-t py-6 text-[14px] ${dark ? "border-white/10" : "border-stone-2"}`}>
        <a href={site.phoneHref} className="hover:text-rust">{site.phone}</a>
        <a href={`mailto:${site.email}`} className="hover:text-rust">{site.email}</a>
        <span>{site.hours.weekdays}</span>
      </div>
    </footer>
  );
}
