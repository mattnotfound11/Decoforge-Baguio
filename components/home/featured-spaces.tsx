import Image from "next/image";
import Link from "next/link";
import { projects } from "@/lib/projects";
import { site, unsplash } from "@/lib/site";

export function FeaturedSpaces() {
  const [alpine, villa, studio] = projects;

  return (
    <section className="relative overflow-hidden bg-ink py-20 text-white sm:py-24">
      <div className="pinstripe absolute inset-0" aria-hidden="true" />

      <div className="container-df relative">
        <div className="flex flex-wrap items-end justify-between gap-6" data-reveal>
          <h2 className="text-[clamp(1.9rem,4.4vw,2.9rem)] font-extrabold uppercase">
            Featured Spaces
          </h2>
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.14em] text-rust-2 transition hover:gap-3"
          >
            View all projects
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M3 10h13M11 5l5 5-5 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3" data-reveal>
          {/* Hero project spans two columns on desktop. */}
          <Link
            href="/projects"
            className="group relative col-span-1 overflow-hidden rounded-card lg:col-span-2"
          >
            <div className="relative aspect-[16/11] w-full lg:aspect-[16/10]">
              <Image
                src={unsplash(alpine.image, 1200)}
                alt={alpine.name}
                fill
                sizes="(max-width: 1024px) 100vw, 62vw"
                className="object-cover transition duration-700 group-hover:scale-[1.04]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" aria-hidden="true" />
            </div>

            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <span className="inline-flex rounded-full bg-rust px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em]">
                {alpine.kind}
              </span>
              <h3 className="mt-3 text-[26px] font-extrabold tracking-[-0.02em] sm:text-[32px]">
                {alpine.name}
              </h3>
              <p className="mt-1 text-[14px] text-white/65">
                {alpine.location} · {alpine.area}
              </p>
            </div>
          </Link>

          <div className="grid gap-5">
            <Link href="/projects" className="group relative overflow-hidden rounded-card">
              <div className="relative aspect-[16/10] w-full lg:aspect-auto lg:h-full lg:min-h-[220px]">
                <Image
                  src={unsplash(villa.image, 800)}
                  alt={villa.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 32vw"
                  className="object-cover transition duration-700 group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/25 to-transparent" aria-hidden="true" />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-5">
                <h3 className="text-[19px] font-extrabold">{villa.name}</h3>
                <p className="text-[13px] text-white/60">{villa.location}</p>
              </div>
            </Link>

            {/* Real, checkable social proof in place of an invented quote. */}
            <figure className="rounded-card border border-white/10 bg-ink-2 p-6">
              <a href={site.facebook} target="_blank" rel="noreferrer" className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1877F2]">
                  <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M11.5 18v-6h2l.4-2.6h-2.4V7.7c0-.75.2-1.26 1.28-1.26H14V4.12A17 17 0 0012.02 4C10.06 4 8.7 5.2 8.7 7.4v2H6.5V12h2.2v6z" fill="#fff" />
                  </svg>
                </span>
                <span>
                  <span className="block text-[15px] font-bold">{site.followers} followers</span>
                  <span className="block text-[13px] text-white/55">on Facebook</span>
                </span>
              </a>

              <p className="mt-4 text-[15px] leading-relaxed text-white/70">
                We post finished installations, new stock, and price updates on Facebook first. It
                is also the fastest way to reach us — we reply there daily.
              </p>

              <a
                href={site.facebook}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.12em] text-rust-2 transition hover:gap-3"
              >
                Visit our page
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M3 10h13M11 5l5 5-5 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </figure>
          </div>
        </div>

        {/* Wide commercial strip closes the section without leaving dead space. */}
        <Link
          href="/projects"
          className="group mt-5 grid overflow-hidden rounded-card border border-white/10 bg-ink-2 md:grid-cols-2"
        >
          <div className="order-2 p-7 sm:p-9 md:order-1 md:self-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-rust-2">
              {studio.kindLabel}
            </p>
            <h3 className="mt-2 text-[26px] font-extrabold tracking-[-0.02em]">{studio.name}</h3>
            <p className="mt-1 text-[14px] text-white/60">
              {studio.location} · {studio.area}
            </p>
            <p className="mt-4 max-w-[46ch] text-[15px] leading-relaxed text-white/65">{studio.blurb}</p>
            <span className="mt-6 inline-flex items-center gap-2 rounded-lg border border-white/25 px-5 py-3 text-[14px] font-semibold transition group-hover:border-white group-hover:bg-white group-hover:text-ink">
              View case study
            </span>
          </div>

          <div className="relative order-1 aspect-[16/10] md:order-2 md:aspect-auto md:min-h-[300px]">
            <Image
              src={unsplash(studio.image, 900)}
              alt={studio.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition duration-700 group-hover:scale-[1.03]"
            />
          </div>
        </Link>
      </div>
    </section>
  );
}
