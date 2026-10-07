import Image from "next/image";
import Link from "next/link";
import { projects } from "@/lib/projects";
import { site, unsplash } from "@/lib/site";
import { SplitText } from "@/components/motion/split-text";

export function FeaturedSpaces() {
  const [alpine, villa, studio] = projects;

  return (
    <section className="relative overflow-hidden bg-ink py-28 text-white sm:py-36">
      <div className="pinstripe absolute inset-0" aria-hidden="true" />

      <div className="container-df relative">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow text-white/50" data-reveal>Selected work</p>
            <SplitText
              className="mt-5 font-display text-[clamp(2.6rem,5.6vw,4.6rem)] leading-[0.95] tracking-[-0.03em]"
              parts={["Featured ", { text: "spaces.", className: "italic text-ember" }]}
            />
          </div>
          <Link
            href="/projects"
            data-reveal
            className="inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.16em] text-ember transition-[gap] duration-500 hover:gap-3.5"
          >
            View all projects
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M3 10h13M11 5l5 5-5 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {/* Hero project spans two columns on desktop. */}
          <Link
            href="/projects"
            data-reveal="wipe"
            className="group relative col-span-1 overflow-hidden rounded-[var(--radius-card)] lg:col-span-2"
          >
            <div className="relative aspect-[16/11] w-full overflow-hidden lg:aspect-[16/10]">
              <div className="parallax absolute -inset-y-[12%] inset-x-0" style={{ "--px": "40px", "--ps": "1.04" } as React.CSSProperties}>
              <Image
                src={unsplash(alpine.image, 1200)}
                alt={alpine.name}
                fill
                sizes="(max-width: 1024px) 100vw, 62vw"
                className="object-cover transition duration-[1.2s] ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.05]"
              />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" aria-hidden="true" />
            </div>

            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <span className="inline-flex rounded-full bg-ink/40 px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] ring-1 ring-white/20">
                {alpine.kind}
              </span>
              <h3 className="mt-4 font-display text-[34px] leading-none sm:text-[46px]">
                {alpine.name}
              </h3>
              <p className="mt-1 text-[14px] text-white/65">
                {alpine.location} · {alpine.area}
              </p>
            </div>
          </Link>

          <div className="grid gap-5">
            <Link href="/projects" data-reveal="wipe" style={{ transitionDelay: "120ms" }} className="group relative overflow-hidden rounded-[var(--radius-card)]">
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
                <h3 className="font-display text-[28px] leading-none">{villa.name}</h3>
                <p className="text-[13px] text-white/60">{villa.location}</p>
              </div>
            </Link>

            {/* Real, checkable social proof in place of an invented quote. */}
            <figure className="rounded-[var(--radius-card)] border border-white/10 bg-ink-2 p-6" data-reveal>
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

              <p className="mt-4 text-[16px] leading-relaxed text-white/70">
                We post finished installations, new stock, and price updates on Facebook first. It
                is also the fastest way to reach us — we reply there daily.
              </p>

              <a
                href={site.facebook}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.12em] text-ember transition hover:gap-3"
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
          data-reveal
          className="group mt-5 grid overflow-hidden rounded-[var(--radius-card)] border border-white/10 bg-ink-2 md:grid-cols-2"
        >
          <div className="order-2 p-7 sm:p-9 md:order-1 md:self-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ember">
              {studio.kindLabel}
            </p>
            <h3 className="mt-3 font-display text-[38px] leading-none">{studio.name}</h3>
            <p className="mt-1 text-[14px] text-white/60">
              {studio.location} · {studio.area}
            </p>
            <p className="mt-4 max-w-[46ch] text-[16px] leading-relaxed text-white/70">{studio.blurb}</p>
            <span className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3 text-[14px] font-semibold transition duration-500 group-hover:border-white group-hover:bg-white group-hover:text-ink">
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
