import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { projects } from "@/lib/projects";
import { unsplash } from "@/lib/site";

export const metadata: Metadata = {
  title: "Featured Projects",
  description:
    "A curated selection of premium Decoforge installations across Baguio City — residential and commercial architectural surfaces.",
};

export default function ProjectsPage() {
  const [alpine, villa, studio] = projects;

  return (
    <>
      <SiteHeader />
      <main id="main" className="relative overflow-hidden bg-cream">
        <div className="pinstripe-light absolute inset-0" aria-hidden="true" />

        <div className="container-df relative py-16 sm:py-20">
          <h1 className="rise max-w-[14ch] text-[clamp(2.75rem,8vw,4.6rem)] font-extrabold text-rust">
            Featured Projects
          </h1>
          <p className="rise mt-6 max-w-[62ch] text-[17px] leading-relaxed text-ink/75" style={{ animationDelay: "90ms" }}>
            A curated selection of our premium installations across Baguio. Explore how Decoforge
            surfaces transform high-end residential and commercial spaces.
          </p>

          <div className="mt-14 grid gap-6 lg:grid-cols-[1.55fr_1fr]" data-reveal>
            {/* Alpine: image with the detail card lifted over its lower edge. */}
            <article className="relative">
              <div className="relative aspect-[16/11] overflow-hidden rounded-card">
                <Image
                  src={unsplash(alpine.image, 1200)}
                  alt={alpine.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-cover"
                />
              </div>

              <div className="mx-4 -mt-14 rounded-card bg-white p-6 shadow-[0_24px_60px_-32px_rgba(23,18,16,0.5)] sm:mx-8 sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h2 className="text-[26px] font-extrabold tracking-[-0.02em] sm:text-[30px]">
                    {alpine.name}
                  </h2>
                  <span className="rounded-full bg-rust px-3.5 py-1.5 text-[12px] font-bold text-white">
                    {alpine.kind}
                  </span>
                </div>

                <Meta location={alpine.location} area={alpine.area} />

                <p className="mt-4 text-[15px] leading-relaxed text-ink/75">{alpine.blurb}</p>

                <ul className="mt-5 flex flex-wrap gap-2">
                  {alpine.materials.map((m) => (
                    <li key={m} className="rounded-lg border border-stone-2 px-3 py-1.5 text-[13px] font-medium">
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            </article>

            <article className="flex flex-col overflow-hidden rounded-card bg-white">
              <div className="relative aspect-[16/11] w-full">
                <Image
                  src={unsplash(villa.image, 800)}
                  alt={villa.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 38vw"
                  className="object-cover"
                />
              </div>

              <div className="flex flex-1 flex-col p-6">
                <h2 className="text-[24px] font-extrabold tracking-[-0.02em]">{villa.name}</h2>
                <Meta location={villa.location} area={villa.area} dotted />
                <p className="mt-4 text-[15px] leading-relaxed text-ink/75">{villa.blurb}</p>

                <ul className="mt-auto flex flex-wrap gap-2 pt-6">
                  {villa.materials.map((m) => (
                    <li key={m} className="rounded-lg bg-cream-2 px-3 py-1.5 text-[13px] font-medium">
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          </div>

          <article className="mt-6 grid overflow-hidden rounded-card bg-white lg:grid-cols-2" data-reveal>
            <div className="order-2 p-7 sm:p-10 lg:order-1 lg:self-center">
              <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-rust">
                {studio.kindLabel}
              </p>
              <h2 className="mt-2 text-[28px] font-extrabold tracking-[-0.02em] sm:text-[32px]">
                {studio.name}
              </h2>
              <Meta location={studio.location} area={studio.area} />
              <p className="mt-4 max-w-[54ch] text-[15px] leading-relaxed text-ink/75">{studio.blurb}</p>

              <Link
                href="/contact"
                className="mt-7 inline-flex items-center gap-2 rounded-lg border border-ink/25 px-6 py-3.5 text-[15px] font-semibold transition hover:border-ink hover:bg-ink hover:text-cream"
              >
                View Case Study
              </Link>
            </div>

            <div className="relative order-1 aspect-[16/10] lg:order-2 lg:aspect-auto lg:min-h-[380px]">
              <Image
                src={unsplash(studio.image, 1000)}
                alt={studio.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </article>

          <div className="mt-16 rounded-card bg-ink px-7 py-12 text-center text-white sm:px-10" data-reveal="scale">
            <h2 className="text-[clamp(1.6rem,3.6vw,2.3rem)] font-extrabold uppercase">
              Have a space in mind?
            </h2>
            <p className="mx-auto mt-3 max-w-[52ch] text-[15px] leading-relaxed text-white/65">
              Book a site visit and we will measure, photograph, and quote from the actual room —
              usually within two business days.
            </p>
            <Link
              href="/contact"
              className="mt-7 inline-flex rounded-lg bg-rust px-7 py-4 text-[15px] font-bold transition hover:bg-rust-2"
            >
              Book a consultation
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function Meta({ location, area, dotted = false }: { location: string; area: string; dotted?: boolean }) {
  return (
    <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[14px] text-muted">
      <span className="inline-flex items-center gap-1.5">
        <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M10 18s6-5 6-9a6 6 0 10-12 0c0 4 6 9 6 9z" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="10" cy="9" r="2.2" stroke="currentColor" strokeWidth="1.6" />
        </svg>
        {location}
      </span>
      <span className="inline-flex items-center gap-1.5">
        {dotted && <span className="sr-only">Area:</span>}
        <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M3 13.5L13.5 3M6 3H3v3M17 14v3h-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {area}
      </span>
    </p>
  );
}
