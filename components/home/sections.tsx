import Image from "next/image";
import Link from "next/link";
import { MaterialArt } from "@/components/material-art";
import { MaterialCard } from "@/components/material-card";
import { galleryShots } from "@/lib/projects";
import { materials } from "@/lib/materials";
import { photo, unsplash } from "@/lib/site";
import type { Surface, Tone } from "@/lib/materials";

/* ------------------------------------------------------------ marquee -- */

const strip = ["PVC Ceilings", "Fluted Panels", "WPC Decking", "Wall Panels", "Edge Trims", "Acoustic Backing"];

export function Marquee() {
  return (
    <section className="border-y border-white/10 bg-ink py-5" aria-label="Product ranges">
      <div className="flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
        <ul className="flex shrink-0 animate-marquee items-center gap-14 pr-14">
          {[...strip, ...strip].map((item, i) => (
            <li
              key={i}
              className="flex shrink-0 items-center gap-14 whitespace-nowrap text-[13px] font-bold uppercase tracking-[0.22em] text-white/45"
            >
              {item}
              <span className="h-1 w-1 rounded-full bg-rust-2" aria-hidden="true" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------ category cards -- */

const rangeCards: {
  title: string;
  body: string;
  href: string;
  surface: Surface;
  tone: Tone;
}[] = [
  {
    title: "PVC Ceilings",
    body: "Lightweight, moisture-resistant, and installed with no visible fixings. The finish that makes a ceiling disappear.",
    href: "/catalog?c=pvc-ceilings",
    surface: "ceiling",
    tone: "dust-grey",
  },
  {
    title: "Fluted Panels",
    body: "Ribbed architectural panelling that adds acoustic warmth and a shadow line that moves through the day.",
    href: "/catalog?c=fluted-panels",
    surface: "fluted",
    tone: "mahogany",
  },
  {
    title: "WPC Decking",
    body: "Dense, weather-stable boards that hold their colour and their grip through a full Cordillera wet season.",
    href: "/catalog?c=decking",
    surface: "deck",
    tone: "cedar",
  },
];

export function Ranges() {
  return (
    <section id="services" className="bg-cream py-20 sm:py-24">
      <div className="container-df">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-[clamp(1.9rem,4.4vw,2.9rem)] font-extrabold uppercase">
            Curated Material Excellence
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-muted">
            We select only the most durable, high-performance materials. Every piece in our catalog
            is chosen for its ability to withstand the Baguio climate while holding a timeless,
            elegant finish.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {rangeCards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="group overflow-hidden rounded-card border border-stone bg-ink text-white transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_28px_60px_-30px_rgba(23,18,16,0.6)]"
            >
              <div className="relative aspect-[16/11] overflow-hidden">
                <MaterialArt
                  surface={card.surface}
                  tone={card.tone}
                  className="h-full w-full transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-6">
                <h3 className="text-[20px] font-extrabold uppercase tracking-[0.02em]">{card.title}</h3>
                <p className="mt-2.5 text-[14px] leading-relaxed text-white/60">{card.body}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-[0.12em] text-rust-2 transition group-hover:gap-3">
                  Explore range
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M3 10h13M11 5l5 5-5 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------- quality band -- */

export function QualityBand() {
  return (
    <section className="relative overflow-hidden bg-ink py-20 text-white sm:py-28">
      <div className="pinstripe absolute inset-0" aria-hidden="true" />
      <div className="container-df relative">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-[clamp(1.9rem,4.6vw,3.1rem)] font-extrabold uppercase">
            Architectural quality,
            <br />
            <span className="text-rust-2">direct from the source.</span>
          </h2>
          <p className="mt-6 text-[16px] leading-relaxed text-white/65">
            We supply and install, so one team is answerable for the finish from the first measure
            to the last trim. Affordable and premium finishes, quoted in writing before work starts.
          </p>
        </div>

        <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["01", "Supply and install", "One team measures, supplies, and fits. Nothing is handed off midway."],
            ["02", "Priced before we start", "A written, itemised quotation you approve before any work begins."],
            ["03", "Built for Baguio", "Moisture-resistant finishes chosen for a cool, damp, high-altitude climate."],
            ["04", "Always reachable", "Open daily, and we answer on Facebook the same day."],
          ].map(([num, title, body]) => (
            <div key={num}>
              <span className="text-[13px] font-bold tracking-[0.18em] text-rust-2">{num}</span>
              <h3 className="mt-3 text-[18px] font-bold">{title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-white/55">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------- catalog preview -- */

export function CatalogPreview() {
  const featured = materials.filter((m) => m.featured).slice(0, 6);

  return (
    <section className="bg-cream py-20 sm:py-24">
      <div className="container-df">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2 className="text-[clamp(1.9rem,4.4vw,2.9rem)] font-extrabold uppercase">
              Materials <span className="text-rust italic">Catalog</span>
            </h2>
            <p className="mt-3 max-w-[52ch] text-[16px] leading-relaxed text-muted">
              Explore our inventory of premium finishes, ready for immediate installation or your
              next specification.
            </p>
          </div>

          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 rounded-lg border border-ink/20 px-6 py-3.5 text-[15px] font-semibold transition hover:border-ink hover:bg-ink hover:text-cream"
          >
            View full catalog
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M3 10h13M11 5l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((m) => (
            <MaterialCard key={m.slug} material={m} />
          ))}
        </div>
      </div>
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
    <section className="bg-cream pb-24 pt-4">
      <div className="container-df">
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted">
            Installed across the Cordilleras
          </p>
          <h2 className="mt-3 text-[clamp(1.9rem,4.4vw,2.9rem)] font-extrabold uppercase">
            Project <span className="text-rust italic">Gallery</span>
          </h2>
        </div>

        <div className="mt-12 grid auto-rows-[190px] grid-cols-2 gap-4 sm:auto-rows-[210px] lg:grid-cols-4">
          {galleryShots.map((shot, i) => (
            <figure
              key={shot.id}
              /* Spans chosen so both the 2-col and 4-col grids tile exactly,
                 with no half-filled row at the bottom. */
              className={[
                "group relative overflow-hidden rounded-card",
                GALLERY_SPAN[i] ?? "",
              ].join(" ")}
            >
              <Image
                src={unsplash(shot.id, i === 0 ? 1000 : 600)}
                alt={`${shot.caption} — ${shot.place}`}
                fill
                sizes="(max-width: 1024px) 50vw, 25vw"
                className="object-cover transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent opacity-80 transition group-hover:opacity-95" aria-hidden="true" />
              <figcaption className="absolute inset-x-0 bottom-0 p-4">
                <p className="text-[14px] font-bold text-white">{shot.caption}</p>
                <p className="text-[12px] text-white/65">{shot.place}</p>
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
    <section id="book" className="relative overflow-hidden bg-ink py-20 text-white sm:py-24">
      <div className="pinstripe absolute inset-0" aria-hidden="true" />
      <Image
        src={unsplash(photo.warmLiving, 1400)}
        alt=""
        fill
        sizes="100vw"
        className="object-cover opacity-[0.12]"
      />
      <div className="container-df relative grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <div className="lg:pt-6">
          <h2 className="text-[clamp(1.9rem,4.4vw,2.9rem)] font-extrabold uppercase">
            Book a<br />
            <span className="text-rust-2">consultation.</span>
          </h2>
          <p className="mt-5 max-w-[42ch] text-[16px] leading-relaxed text-white/65">
            Tell us about your space and we will confirm your slot by email. Prefer to chat? We are
            on Facebook daily. Bring your plans to Irisan, or have us come and measure on site.
          </p>

          <ul className="mt-8 space-y-4">
            {[
              ["Showroom consultation", "Samples in hand, 45 minutes, at Irisan."],
              ["On-site visit", "We measure, photograph, and quote from the actual space."],
              ["Video call", "For clients specifying from outside Benguet."],
            ].map(([title, body]) => (
              <li key={title} className="flex gap-3.5">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rust-2" aria-hidden="true" />
                <span>
                  <span className="block text-[15px] font-bold">{title}</span>
                  <span className="block text-[14px] text-white/55">{body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>{children}</div>
      </div>
    </section>
  );
}
