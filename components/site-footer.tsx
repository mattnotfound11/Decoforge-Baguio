import Link from "next/link";
import { footerNav, primaryNav, site } from "@/lib/site";

/** `dark` matches the home page footer; `light` the inner pages. */
export function SiteFooter({ variant = "light" }: { variant?: "light" | "dark" }) {
  const dark = variant === "dark";
  const muted = dark ? "text-white/55" : "text-ink/60";
  const rule = dark ? "border-white/10" : "border-stone-2";
  const link = dark ? "text-white/80 hover:text-ember" : "text-ink/80 hover:text-rust";

  return (
    <footer className={`relative overflow-hidden ${dark ? "bg-ink text-white" : "bg-stone text-ink"}`}>
      <div className="container-df pt-16 sm:pt-20">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.3fr_0.8fr_1.25fr_0.9fr] lg:gap-8">
          <div>
            <p className="font-display text-[clamp(2rem,3.4vw,2.8rem)] leading-[1.02] tracking-[-0.02em]">
              Finishes for the
              <br />
              <em className={dark ? "text-ember" : "text-rust"}>City of Pines.</em>
            </p>
            <Link
              href="/contact"
              className="group mt-8 inline-flex items-center gap-3 rounded-full bg-rust py-1.5 pl-6 pr-1.5 text-[14.5px] font-semibold text-white transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-rust-2 active:scale-[0.97]"
            >
              Book a free consultation
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-px">
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M5 15L15 5M7 5h8v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </Link>
          </div>

          <nav aria-label="Footer">
            <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${muted}`}>Explore</p>
            <ul className="mt-5 space-y-3">
              {primaryNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={`text-[15px] transition-colors ${link}`}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${muted}`}>Showroom</p>
            <address className={`mt-5 space-y-3 text-[15px] not-italic ${dark ? "text-white/80" : "text-ink/80"}`}>
              <a href={site.showroom.mapHref} target="_blank" rel="noreferrer" className={`block transition-colors ${link}`}>
                {site.showroom.line1}
                <br />
                {site.showroom.line2}
              </a>
              <a href={site.phoneHref} className={`block transition-colors ${link}`}>{site.phone}</a>
              <a href={`mailto:${site.email}`} className={`block break-words transition-colors ${link}`}>{site.email}</a>
              <span className={`block ${muted}`}>{site.hours.weekdays}</span>
            </address>
          </div>

          <div>
            <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${muted}`}>Company</p>
            <ul className="mt-5 space-y-3">
              {footerNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={`text-[15px] transition-colors ${link}`}>
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <a href={site.facebook} target="_blank" rel="noreferrer" className={`inline-flex items-center gap-2 text-[15px] transition-colors ${link}`}>
                  <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M11.5 18v-6h2l.4-2.6h-2.4V7.7c0-.75.2-1.26 1.28-1.26H14V4.12A17 17 0 0012.02 4C10.06 4 8.7 5.2 8.7 7.4v2H6.5V12h2.2v6z" fill="currentColor" />
                  </svg>
                  Facebook · {site.followers}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className={`mt-14 flex flex-wrap justify-between gap-4 border-t pb-8 pt-6 text-[13px] ${rule} ${muted}`}>
          <span>© {new Date().getFullYear()} {site.legalName}</span>
          <span>Supplied and installed in Baguio City</span>
        </div>
      </div>

    </footer>
  );
}
