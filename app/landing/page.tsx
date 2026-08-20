import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BookingForm } from "@/components/booking-form";
import { MaterialArt } from "@/components/material-art";
import { FacebookIcon } from "@/components/facebook-icon";
import { categoryLabel, materials } from "@/lib/materials";
import { formatPeso, formatPesoRate, pesoPerSqft } from "@/lib/format";
import { photo, site, unsplash } from "@/lib/site";

export const metadata: Metadata = {
  title: "Home Decor Finishes in Baguio City",
  description:
    "UV marble boards, PVC ceilings, fluted panels, and WPC decking — supplied and installed in Baguio City. Free quotation and site measure. Prices in Philippine pesos.",
  // A campaign page should not compete with the main site in search results.
  robots: { index: false, follow: true },
};

/** Cheapest piece in each range, so the price shown is a genuine "from". */
function startingPrices() {
  const ranges = ["uv-marble", "pvc-ceilings", "fluted-panels", "decking"] as const;
  return ranges
    .map((id) => {
      // Trims are priced per length, so a trim would misrepresent a range's
      // "from" price. Only count products sold by area.
      const inRange = materials.filter((m) => m.category === id && m.coverageSqft > 0);
      const cheapest = inRange.reduce((a, b) => (a.pricePhp <= b.pricePhp ? a : b));
      return { id, cheapest };
    })
    .filter((r) => Boolean(r.cheapest));
}

export default function LandingPage() {
  const ranges = startingPrices();

  return (
    <div className="bg-cream">
      {/* Deliberately no nav: a campaign page has one job. */}
      <header className="border-b border-white/10 bg-ink">
        <div className="container-df flex h-[68px] items-center gap-4">
          <Link href="/" className="mr-auto text-[24px] font-extrabold tracking-[-0.04em] text-rust-2">
            {site.name}
          </Link>
          <a
            href={site.phoneHref}
            className="hidden text-[15px] font-semibold text-white transition hover:text-rust-2 sm:inline"
          >
            {site.phone}
          </a>
          <a
            href={site.facebook}
            target="_blank"
            rel="noreferrer"
            aria-label="Decoforge on Facebook"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 transition hover:bg-white/10"
          >
            <FacebookIcon />
          </a>
        </div>
      </header>

      <main id="main">
        {/* ------------------------------------------------------- hero -- */}
        <section className="relative overflow-hidden bg-ink text-white">
          <div className="pinstripe absolute inset-0" aria-hidden="true" />
          <Image
            src={unsplash(photo.heroInterior, 1600)}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-25"
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/40"
            aria-hidden="true"
          />

          <div className="container-df relative py-16 sm:py-24">
            <div className="max-w-[46rem]">
              <span className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/80">
                <span className="h-1.5 w-1.5 rounded-full bg-rust-2" aria-hidden="true" />
                Irisan, Baguio City · Open daily
              </span>

              <h1 className="mt-6 text-[clamp(2.4rem,6.6vw,4.2rem)] font-extrabold uppercase">
                Affordable, premium
                <br />
                <span className="text-rust-2">home decor finishes.</span>
              </h1>

              <p className="mt-6 max-w-[52ch] text-[17px] leading-relaxed text-white/75">
                UV marble boards, PVC ceilings, fluted wall panels, and WPC decking — supplied
                <em className="not-italic font-semibold text-white"> and installed</em> by one team
                in Baguio City. Free quotation and site measure, priced in pesos before any work
                begins.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <a
                  href="#book"
                  className="inline-flex items-center justify-center rounded-lg bg-rust px-8 py-4 text-[16px] font-bold transition hover:bg-rust-2"
                >
                  Get a free quote
                </a>
                <a
                  href={site.messenger}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-[#1877F2] px-8 py-4 text-[16px] font-bold transition hover:bg-[#0f6ae0]"
                >
                  <FacebookIcon fill="#fff" />
                  Message us
                </a>
              </div>

              <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-[14px] text-white/70">
                {["Free site measure", "Written peso quotation", "Supply and install", `${site.followers} followers on Facebook`].map((t) => (
                  <li key={t} className="inline-flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="text-rust-2" aria-hidden="true">
                      <path d="M4 10.5l4 4 8-9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* --------------------------------------------------- what we do -- */}
        <section className="py-16 sm:py-20">
          <div className="container-df">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-[clamp(1.8rem,4.2vw,2.6rem)] font-extrabold uppercase">
                What we supply and install
              </h2>
              <p className="mt-4 text-[16px] leading-relaxed text-muted">
                Every price below is per piece, in Philippine pesos, from our Irisan stock.
              </p>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {ranges.map(({ id, cheapest }) => (
                <Link
                  key={id}
                  href={`/catalog?c=${id}`}
                  className="group overflow-hidden rounded-card border border-stone bg-white transition hover:-translate-y-1 hover:shadow-[0_24px_50px_-28px_rgba(23,18,16,0.45)]"
                >
                  <div className="relative aspect-[5/4] overflow-hidden">
                    <MaterialArt
                      surface={cheapest.surface}
                      tone={cheapest.tone}
                      className="h-full w-full transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="text-[18px] font-extrabold tracking-[-0.02em]">
                      {categoryLabel(cheapest.category)}
                    </h3>
                    <p className="mt-1.5 line-clamp-2 text-[14px] leading-relaxed text-muted">
                      {cheapest.summary}
                    </p>
                    <p className="mt-4 text-[15px] text-muted">
                      From{" "}
                      <span className="text-[21px] font-extrabold tracking-[-0.02em] text-ink">
                        {formatPeso(cheapest.pricePhp)}
                      </span>{" "}
                      / {cheapest.unit}
                    </p>
                    {cheapest.coverageSqft > 0 && (
                      <p className="mt-0.5 text-[13px] text-muted">
                        ≈ {formatPesoRate(pesoPerSqft(cheapest.pricePhp, cheapest.coverageSqft))} per sq ft
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link
                href="/catalog"
                className="inline-flex items-center gap-2 rounded-lg border border-ink/25 px-7 py-3.5 text-[15px] font-semibold transition hover:border-ink hover:bg-ink hover:text-cream"
              >
                See all prices in the catalog
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M3 10h13M11 5l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------- steps -- */}
        <section className="bg-cream-2 py-16 sm:py-20">
          <div className="container-df">
            <h2 className="text-center text-[clamp(1.8rem,4.2vw,2.6rem)] font-extrabold uppercase">
              Three steps, no surprises
            </h2>

            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {[
                ["Tell us about the space", "Send photos and rough measurements, or book a free site visit. Either works."],
                ["Get a peso quotation", "Itemised in writing — materials, installation, and trims. You approve before we start."],
                ["We supply and install", "One team handles delivery and fitting, then clears the site when it is done."],
              ].map(([title, body], i) => (
                <div key={title} className="text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rust text-[18px] font-extrabold text-white">
                    {i + 1}
                  </span>
                  <h3 className="mt-5 text-[19px] font-extrabold tracking-[-0.02em]">{title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* -------------------------------------------------- book / form -- */}
        <section id="book" className="scroll-mt-20 relative overflow-hidden bg-ink py-16 text-white sm:py-20">
          <div className="pinstripe absolute inset-0" aria-hidden="true" />
          <div className="container-df relative grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
            <div>
              <h2 className="text-[clamp(1.8rem,4.2vw,2.6rem)] font-extrabold uppercase">
                Book a free
                <br />
                <span className="text-rust-2">quotation.</span>
              </h2>
              <p className="mt-5 max-w-[42ch] text-[16px] leading-relaxed text-white/70">
                Pick a time that suits you and we will confirm by email. No charge for the visit or
                the quote.
              </p>

              <dl className="mt-9 space-y-5">
                {[
                  ["Call or text", site.phone, site.phoneHref],
                  ["Email", site.email, `mailto:${site.email}`],
                  ["Facebook", site.facebookHandle, site.facebook],
                ].map(([label, value, href]) => (
                  <div key={label}>
                    <dt className="text-[13px] text-white/50">{label}</dt>
                    <dd>
                      <a
                        href={href}
                        {...(href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
                        className="text-[16px] font-semibold break-words transition hover:text-rust-2"
                      >
                        {value}
                      </a>
                    </dd>
                  </div>
                ))}
                <div>
                  <dt className="text-[13px] text-white/50">Where to find us</dt>
                  <dd className="text-[16px] font-semibold">
                    {site.showroom.line1}, {site.showroom.line2}
                  </dd>
                </div>
              </dl>
            </div>

            <BookingForm />
          </div>
        </section>
      </main>

      <footer className="bg-ink py-10 text-white/60">
        <div className="container-df flex flex-wrap items-center justify-between gap-6">
          <p className="text-[14px]">
            © 2024 {site.legalName}. {site.showroom.line1}, {site.showroom.line2}.
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[14px]">
            <Link href="/" className="hover:text-rust-2">Main site</Link>
            <Link href="/catalog" className="hover:text-rust-2">Catalog</Link>
            <Link href="/privacy" className="hover:text-rust-2">Privacy</Link>
            <a href={site.facebook} target="_blank" rel="noreferrer" className="hover:text-rust-2">
              Facebook
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
