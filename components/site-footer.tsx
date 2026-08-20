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
