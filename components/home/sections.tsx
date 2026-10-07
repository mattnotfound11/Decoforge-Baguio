import Image from "next/image";
import Link from "next/link";
import { MaterialArt } from "@/components/material-art";
import { MaterialCard } from "@/components/material-card";
import { SplitText } from "@/components/motion/split-text";
import { Rail } from "@/components/home/rail";
import { galleryShots } from "@/lib/projects";
import { materials, type CategoryId, type Surface, type Tone } from "@/lib/materials";
import { formatPeso } from "@/lib/format";
import { photo, unsplash } from "@/lib/site";

/* ------------------------------------------------------------ marquee -- */

const strip: { word: string; surface: Surface; tone: Tone }[] = [
  { word: "UV marble", surface: "marble", tone: "carrara" },
  { word: "PVC ceilings", surface: "ceiling", tone: "dust-grey" },
  { word: "Fluted panels", surface: "fluted", tone: "mahogany" },
  { word: "WPC decking", surface: "deck", tone: "cedar" },
  { word: "Edge trims", surface: "deck", tone: "bronze" },
  { word: "Feature walls", surface: "fluted", tone: "terracotta" },
];

/**
 * Two ribbons running in opposite directions. Each loops on its own, and the
 * whole ribbon is also pushed sideways by the scroll, so it speeds up and
 * slows down with the reader.
 */
export function Marquee() {
  const row = (reverse: boolean) => (
    <div
      className="drift-x flex"
      style={{ "--dx-from": reverse ? "-12%" : "4%", "--dx-to": reverse ? "4%" : "-12%" } as React.CSSProperties}
    >
      <ul
        className="flex shrink-0 animate-marquee items-center gap-6 pr-6 sm:gap-8 sm:pr-8"
        style={{ animationDirection: reverse ? "reverse" : "normal", animationDuration: "48s" }}
      >
        {[...strip, ...strip, ...strip].map((item, i) => (
          <li key={i} className="flex shrink-0 items-center gap-6 whitespace-nowrap sm:gap-8">
            <span
              className={[
                "font-display text-[clamp(1.35rem,2.4vw,2rem)] leading-none",
                reverse ? "italic text-white/25" : "text-white/85",
              ].join(" ")}
            >
              {item.word}
            </span>
            <span className="h-6 w-6 shrink-0 overflow-hidden rounded-full ring-1 ring-white/15 sm:h-7 sm:w-7" aria-hidden="true">
              <MaterialArt surface={item.surface} tone={item.tone} className="h-full w-full" />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <section className="overflow-hidden border-y border-white/[0.07] bg-ink py-5 sm:py-6" aria-label="Product ranges">
      <div className="space-y-3 [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
        {row(false)}
        {row(true)}
      </div>
    </section>
  );
}

/* --------------------------------------------------------- range bento -- */

const fromPrice = (c: CategoryId) =>
  Math.min(...materials.filter((m) => m.category === c).map((m) => m.pricePhp));
const countIn = (c: CategoryId) => materials.filter((m) => m.category === c).length;

const bento: {
  id: CategoryId;
  title: string;
  body: string;
  surface: Surface;
  tone: Tone;
  grid: string;
  tall?: boolean;
}[] = [
  {
    id: "uv-marble",
    title: "UV marble boards",
    body: "Full 8 × 4 ft sheets of Carrara, Calacatta, and Nero veining under a hard UV coat. The look of stone, without the weight or the wet cutting.",
    surface: "marble",
    tone: "calacatta",
    grid: "md:col-span-2 lg:col-span-7 lg:row-span-2",
    tall: true,
  },
  {
    id: "fluted-panels",
    title: "Fluted panels",
    body: "Ribbed panelling with a shadow line that moves through the day.",
    surface: "fluted",
    tone: "mahogany",
    grid: "lg:col-span-5",
  },
  {
    id: "pvc-ceilings",
    title: "PVC ceilings",
    body: "Moisture-resistant, no visible fixings. The finish that makes a ceiling disappear.",
    surface: "ceiling",
    tone: "dust-grey",
    grid: "lg:col-span-5",
  },
  {
    id: "decking",
    title: "WPC decking",
    body: "Dense composite boards that hold their colour and their grip through a full Cordillera wet season.",
    surface: "deck",
    tone: "cedar",
    grid: "md:col-span-2 lg:col-span-12",
  },
];

export function Ranges() {
  return (
    <section id="services" className="relative bg-cream pb-24 pt-28 sm:pb-32 sm:pt-36">
      <div className="container-df">
        <div className="grid items-end gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="eyebrow" data-reveal>Four ranges · one team</p>
            <SplitText
              className="mt-5 font-display text-[clamp(2.8rem,6.4vw,5.4rem)] leading-[0.95] tracking-[-0.03em]"
              parts={["Materials chosen\nfor ", { text: "mountain weather.", className: "italic text-rust" }]}
            />
          </div>
          <p className="max-w-[46ch] text-[16.5px] leading-[1.75] text-muted lg:justify-self-end" data-reveal>
            Baguio is cool, damp, and high. Every finish we stock is picked for how it holds up here —
            no swelling, no mould, no fading — and for how it looks ten years in.
          </p>
        </div>

        <div className="mt-16 grid auto-rows-[minmax(280px,auto)] gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-12">
          {bento.map((card, i) => (
            <div key={card.id} className={card.grid} data-reveal style={{ transitionDelay: `${i * 90}ms` }}>
              <Link
                href={`/catalog?c=${card.id}`}
                className="group block h-full rounded-[2rem] bg-ink/[0.04] p-1.5 ring-1 ring-ink/[0.06] transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:shadow-[0_40px_80px_-40px_rgba(74,40,20,0.55)]"
              >
                <div
                  className={[
                    "spotlight relative flex h-full flex-col justify-end overflow-hidden rounded-[calc(2rem-0.375rem)] bg-ink text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]",
                    card.tall ? "min-h-[400px] md:min-h-[460px] lg:min-h-[600px]" : "min-h-[280px]",
                  ].join(" ")}
                >
                  <MaterialArt
                    surface={card.surface}
                    tone={card.tone}
                    className="absolute inset-0 h-full w-full transition-transform duration-[1.4s] ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.06]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-ink/0" aria-hidden="true" />

                  <div className="relative z-[2] flex items-start justify-between gap-6 p-7 sm:p-8">
                    <div className="max-w-[46ch]">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/55">
                        {countIn(card.id)} finishes · from {formatPeso(fromPrice(card.id))}
                      </p>
                      <h3 className={["mt-3 font-display leading-[0.95]", card.tall ? "text-[clamp(2.6rem,4.6vw,4rem)]" : "text-[clamp(2rem,3vw,2.6rem)]"].join(" ")}>
                        {card.title}
                      </h3>
                      <p className="mt-3 text-[15px] leading-relaxed text-white/75">{card.body}</p>
                    </div>
                    <span className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink/40 ring-1 ring-white/20 transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:rotate-45 group-hover:bg-rust group-hover:ring-rust">
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                        <path d="M5 15L15 5M7 5h8v8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------- statement -- */

const STATEMENT =
  "One team measures, supplies, and fits — so one team answers for the finish, from the first tape measure in your living room to the last trim on the ceiling line.";

/** A sentence that fills with ink as it passes through the viewport. */
export function Statement() {
  return (
    <section className="bg-cream pb-28 pt-8 sm:pb-36">
      <div className="container-df">
        <div className="max-w-[1080px]">
          <p className="eyebrow mb-8" data-reveal>How we work</p>
          {/* Faint copy underneath; an ink copy is wiped across it as the
              paragraph scrolls through. Transform-only, so it never repaints. */}
          <div className="fill-wipe relative font-display text-[clamp(2rem,4.6vw,3.9rem)] leading-[1.08] tracking-[-0.02em]">
            <p className="text-ink/[0.16]">{STATEMENT}</p>
            <div className="fill-wipe__mask absolute inset-0 overflow-hidden" aria-hidden="true">
              <div className="fill-wipe__inner">
                <p className="text-ink">{STATEMENT}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------- process: card stack -- */

const steps: { num: string; title: string; body: string; surface: Surface; tone: Tone }[] = [
  {
    num: "01",
    title: "Supply and install",
    body: "One team measures, supplies, and fits. Nothing is handed off midway, and nobody can blame the other contractor.",
    surface: "fluted",
    tone: "natural-oak",
  },
  {
    num: "02",
    title: "Priced before we start",
    body: "A written, itemised quotation in pesos that you approve before any work begins. The number you sign is the number you pay.",
    surface: "marble",
    tone: "nero",
  },
  {
    num: "03",
    title: "Built for Baguio",
    body: "Moisture-resistant finishes chosen for a cool, damp, high-altitude climate — tested against a Cordillera rainy season, not a showroom.",
    surface: "ceiling",
    tone: "espresso",
  },
  {
    num: "04",
    title: "Always reachable",
    body: "Open daily, and we answer on Facebook the same day. Bring your plans to Irisan or have us come and measure on site.",
    surface: "deck",
    tone: "charcoal",
  },
];

/**
 * Cards pin under the nav one after another and stack, each a few pixels
 * lower than the last, so the pile reads as a deck being dealt. Pure CSS
 * `position: sticky` — no scroll handlers.
 */
export function Process() {
  return (
    <section className="bg-cream pb-28 sm:pb-36">
      <div className="container-df grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <p className="eyebrow" data-reveal>The Decoforge way</p>
          <SplitText
            className="mt-5 font-display text-[clamp(2.6rem,4vw,3.9rem)] leading-[1.02] tracking-[-0.03em]"
            parts={["Architectural quality,\n", { text: "direct from the source.", className: "italic text-rust" }]}
          />
          <p className="mt-6 max-w-[40ch] text-[16px] leading-[1.75] text-muted" data-reveal>
            Affordable and premium finishes, quoted in writing, installed by the people who sold them
            to you.
          </p>
        </div>

        <ol className="space-y-6">
          {steps.map((step, i) => (
            <li
              key={step.num}
              className="sticky"
              style={{ top: `${120 + i * 22}px` }}
            >
              <article className="grid overflow-hidden rounded-[2rem] bg-ink text-white shadow-[0_-20px_60px_-30px_rgba(23,18,16,0.6)] ring-1 ring-white/[0.06] sm:grid-cols-[1fr_200px]">
                <div className="p-8 sm:p-10">
                  <div className="flex items-baseline gap-4">
                    <span className="font-display text-[56px] italic leading-none text-ember">{step.num}</span>
                    <span className="h-px flex-1 bg-white/10" aria-hidden="true" />
                  </div>
                  <h3 className="mt-6 font-display text-[clamp(1.9rem,3vw,2.5rem)] leading-none">{step.title}</h3>
                  <p className="mt-4 max-w-[44ch] text-[16px] leading-[1.75] text-white/70">{step.body}</p>
                </div>
                <div className="relative hidden sm:block" aria-hidden="true">
                  <MaterialArt surface={step.surface} tone={step.tone} className="absolute inset-0 h-full w-full" />
                  <div className="absolute inset-0 bg-gradient-to-r from-ink to-transparent" />
                </div>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------------------------------------------------- catalog preview -- */

export function CatalogPreview() {
  const featured = materials.filter((m) => m.featured);

  return (
    <section className="overflow-hidden bg-cream-2 py-28 sm:py-32">
      <div className="container-df">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div>
            <p className="eyebrow" data-reveal>In the showroom this week</p>
            <SplitText
              className="mt-5 font-display text-[clamp(2.6rem,5.6vw,4.6rem)] leading-[0.95] tracking-[-0.03em]"
              parts={["The materials ", { text: "catalog.", className: "italic text-rust" }]}
            />
          </div>

          <Link
            href="/catalog"
            className="group inline-flex items-center gap-3 rounded-full border border-ink/15 py-1.5 pl-6 pr-1.5 text-[14.5px] font-semibold transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-ink hover:bg-ink hover:text-cream active:scale-[0.97]"
            data-reveal
          >
            View all {materials.length} finishes
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink/[0.06] transition duration-500 group-hover:translate-x-0.5 group-hover:bg-white/15">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M3 10h13M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </Link>
        </div>
      </div>

      <Rail label="Featured materials">
        {featured.map((m) => (
          <div key={m.slug} className="w-[82%] shrink-0 snap-start sm:w-[calc((100%-20px)/2)] lg:w-[calc((100%-40px)/3)] xl:w-[calc((100%-60px)/4)]">
            <MaterialCard material={m} />
          </div>
        ))}
      </Rail>
    </section>
  );
}

/* --------------------------------------------------------- the gallery -- */

/**
 * 2-col (mobile): 2 + 1+1+1+1 + 2 = 8 cells over 4 rows.
 * 4-col (desktop): 4 + 2 + 1 + 1 + 2 + 2 = 12 cells over 3 rows.
 * Both fill completely, so the grid never ends on a ragged row.
 */
const GALLERY_SPAN = [
  "col-span-2 row-span-2",
  "col-span-1 lg:col-span-2",
  "col-span-1",
  "col-span-1",
  "col-span-1 lg:col-span-2",
  "col-span-2",
];

export function Gallery() {
  return (
    <section className="bg-cream py-28 sm:py-32">
      <div className="container-df">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow" data-reveal>Installed across the Cordilleras</p>
            <SplitText
              className="mt-5 font-display text-[clamp(2.6rem,5.6vw,4.6rem)] leading-[0.95] tracking-[-0.03em]"
              parts={["Project ", { text: "gallery.", className: "italic text-rust" }]}
            />
          </div>
          <Link href="/projects" className="text-[14.5px] font-semibold text-rust underline decoration-rust/30 underline-offset-[6px] transition hover:decoration-rust" data-reveal>
            See the case studies
          </Link>
        </div>

        <div className="mt-14 grid auto-rows-[190px] grid-cols-2 gap-3 sm:auto-rows-[230px] sm:gap-4 lg:grid-cols-4">
          {galleryShots.map((shot, i) => (
            <figure
              key={shot.id}
              data-reveal="wipe"
              style={{ transitionDelay: `${(i % 3) * 110}ms` }}
              className={["group relative overflow-hidden rounded-[var(--radius-card)]", GALLERY_SPAN[i] ?? ""].join(" ")}
            >
              <div className="parallax absolute -inset-y-[14%] inset-x-0" style={{ "--px": "26px", "--ps": "1.04" } as React.CSSProperties}>
                <Image
                  src={unsplash(shot.id, i === 0 ? 1000 : 600)}
                  alt={`${shot.caption} — ${shot.place}`}
                  fill
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition duration-[1.2s] ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.06]"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/5 to-transparent opacity-80 transition duration-500 group-hover:opacity-100" aria-hidden="true" />
              <figcaption className="absolute inset-x-0 bottom-0 translate-y-1 p-4 transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-y-0 sm:p-5">
                <p className="font-display text-[19px] leading-tight text-white sm:text-[22px]">{shot.caption}</p>
                <p className="mt-0.5 text-[12px] text-white/65">{shot.place}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------- booking band -- */

export function BookingBand({ children }: { children: React.ReactNode }) {
  return (
    <section id="book" className="relative isolate overflow-hidden bg-ink py-28 text-white sm:py-32">
      <div className="pinstripe absolute inset-0 -z-10" aria-hidden="true" />
      <div className="parallax absolute -inset-y-[15%] inset-x-0 -z-20" style={{ "--px": "80px" } as React.CSSProperties} aria-hidden="true">
        <Image src={unsplash(photo.warmLiving, 1400)} alt="" fill sizes="100vw" className="object-cover opacity-[0.14]" />
      </div>
      <div className="absolute -right-40 top-10 -z-10 h-[720px] w-[720px] bg-[radial-gradient(closest-side,rgb(178_58_15_/_0.2),transparent)]" aria-hidden="true" />

      <div className="container-df grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <div className="lg:pt-4">
          <p className="eyebrow text-white/50" data-reveal>Free consultation</p>
          <SplitText
            className="mt-5 font-display text-[clamp(2.8rem,6vw,5rem)] leading-[0.95] tracking-[-0.03em]"
            parts={["Book a\n", { text: "consultation.", className: "italic text-ember" }]}
          />
          <p className="mt-6 max-w-[42ch] text-[16px] leading-[1.75] text-white/60" data-reveal>
            Tell us about your space and we will confirm your slot by email. Prefer to chat? We are on
            Facebook daily. Bring your plans to Irisan, or have us come and measure on site.
          </p>

          <ul className="mt-10 divide-y divide-white/10 border-y border-white/10" data-reveal>
            {[
              ["Showroom consultation", "Samples in hand, 45 minutes, at Irisan."],
              ["On-site visit", "We measure, photograph, and quote from the actual space."],
              ["Video call", "For clients specifying from outside Benguet."],
            ].map(([title, body], i) => (
              <li key={title} className="flex items-baseline gap-5 py-5">
                <span className="w-7 shrink-0 font-display text-[20px] italic text-ember">{`0${i + 1}`}</span>
                <span>
                  <span className="block text-[15.5px] font-semibold">{title}</span>
                  <span className="mt-0.5 block text-[14px] text-white/50">{body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div data-reveal="right">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-2">
            <div className="rounded-[calc(2rem-0.5rem)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]">{children}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
