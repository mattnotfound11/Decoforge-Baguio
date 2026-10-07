import Image from "next/image";
import Link from "next/link";
import { photo, unsplash } from "@/lib/site";
import { MaterialArt } from "@/components/material-art";
import { SplitText } from "@/components/motion/split-text";
import { materials, type CategoryId, type Surface, type Tone } from "@/lib/materials";

/** The showroom card: three ranges with how many finishes are in stock. No prices. */
const showroom: { label: string; category: CategoryId; surface: Surface; tone: Tone }[] = [
  { label: "PVC ceilings", category: "pvc-ceilings", surface: "ceiling", tone: "matte-white" },
  { label: "Fluted panels", category: "fluted-panels", surface: "fluted", tone: "terracotta" },
  { label: "WPC decking", category: "decking", surface: "deck", tone: "cedar" },
];
const finishesIn = (c: CategoryId) => materials.filter((m) => m.category === c).length;

/** Swatches resting on the photograph's edges, each at its own angle. */
const chips: { surface: Surface; tone: Tone; className: string }[] = [
  { surface: "fluted", tone: "mahogany", className: "-left-3 top-[12%] w-[28%] -rotate-[7deg] sm:-left-5" },
  { surface: "marble", tone: "calacatta", className: "-right-3 top-[5%] w-[25%] rotate-[6deg] sm:-right-5" },
  { surface: "deck", tone: "charcoal", className: "-right-6 top-[44%] hidden w-[22%] -rotate-[4deg] sm:block" },
];

/**
 * The first screen. On desktop it is sized to exactly one viewport below the
 * nav, and its type and spacing scale with the screen's height as well as its
 * width, so nothing is pushed below the fold or into its neighbour. It is
 * deliberately static once it has entered: no scroll-linked motion.
 */
export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-ink pb-20 pt-6 text-white lg:flex lg:min-h-[calc(100dvh-76px)] lg:items-center lg:py-[clamp(1.5rem,4vh,3rem)]">
      <div className="pinstripe absolute inset-0 -z-10" aria-hidden="true" />
      <div
        className="absolute -left-72 -top-48 -z-10 h-[900px] w-[900px] bg-[radial-gradient(closest-side,rgb(178_58_15_/_0.32),transparent)]"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-40 -right-60 -z-10 h-[700px] w-[700px] bg-[radial-gradient(closest-side,rgb(226_106_42_/_0.14),transparent)]"
        aria-hidden="true"
      />

      <div className="container-df grid w-full items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
        <div className="min-w-0">
          <span className="rise inline-flex items-center gap-2.5 rounded-full border border-white/12 bg-white/[0.04] px-3.5 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/70">
            <span className="h-1.5 w-1.5 rounded-full bg-ember" aria-hidden="true" />
            Irisan, Baguio City · Open daily
          </span>

          <SplitText
            as="h1"
            className="mt-[clamp(1.25rem,3.2vh,2rem)] font-display text-[clamp(3.2rem,min(7.2vw,11.5vh),7.2rem)] leading-[0.92] tracking-[-0.035em]"
            parts={[
              "Crafting\nBaguio’s ",
              { text: "finest\ninteriors.", className: "italic text-ember" },
            ]}
          />

          <p
            className="rise mt-[clamp(1.25rem,3vh,2rem)] max-w-[44ch] text-[clamp(15px,1.9vh,17px)] leading-[1.7] text-white/65"
            style={{ animationDelay: "420ms" }}
          >
            UV marble boards, PVC ceilings, fluted wall panels, and WPC decking — measured, supplied,
            and installed by one team across Baguio City and the Cordilleras.
          </p>

          <div
            className="rise mt-[clamp(1.5rem,3.6vh,2.5rem)] flex flex-wrap items-center gap-x-7 gap-y-4"
            style={{ animationDelay: "520ms" }}
          >
            <Link
              href="#composer"
              className="group inline-flex items-center gap-3 rounded-full bg-rust py-2 pl-7 pr-2 text-[15px] font-semibold transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-rust-2 hover:shadow-[0_18px_40px_-16px_rgba(226,106,42,0.75)] active:scale-[0.97]"
            >
              Design your room
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-px group-hover:translate-x-0.5 group-hover:scale-105">
                <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M5 15L15 5M7 5h8v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </Link>
            <Link
              href="/catalog"
              className="group relative text-[15px] font-semibold text-white/85 transition-colors hover:text-white"
            >
              Browse the catalog
              <span className="absolute -bottom-1 left-0 h-px w-full origin-left bg-white/40 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-x-[0.35] group-hover:bg-ember" />
            </Link>
          </div>

          <dl
            className="rise mt-[clamp(1.75rem,5vh,3.5rem)] grid max-w-[520px] grid-cols-3 gap-6 border-t border-white/10 pt-[clamp(1.25rem,2.6vh,2rem)]"
            style={{ animationDelay: "620ms" }}
          >
            <div>
              <dt className="sr-only">Facebook followers</dt>
              <dd className="font-display text-[clamp(1.9rem,min(3.6vw,4.6vh),2.6rem)] leading-none tabular">
                <span data-count="2.8" data-decimals="1" data-suffix="K">2.8K</span>
              </dd>
              <dd className="mt-2 text-[12.5px] leading-snug text-white/50">followers on Facebook</dd>
            </div>
            <div>
              <dt className="sr-only">Finishes in stock</dt>
              <dd className="font-display text-[clamp(1.9rem,min(3.6vw,4.6vh),2.6rem)] leading-none tabular">
                <span data-count={materials.length}>{materials.length}</span>
              </dd>
              <dd className="mt-2 text-[12.5px] leading-snug text-white/50">finishes in the showroom</dd>
            </div>
            <div>
              <dt className="sr-only">Quotation</dt>
              <dd className="font-display text-[clamp(1.9rem,min(3.6vw,4.6vh),2.6rem)] italic leading-none text-ember">Free</dd>
              <dd className="mt-2 text-[12.5px] leading-snug text-white/50">quote and site measure</dd>
            </div>
          </dl>
        </div>

        {/* Photograph column. On desktop the frame's height follows the screen
            height, so the whole picture always fits beside the headline. */}
        <div
          className="rise relative mx-auto w-full max-w-[520px] lg:mx-0 lg:w-[calc(var(--ph)*0.8+1rem)] lg:max-w-full lg:justify-self-end"
          style={{ animationDelay: "300ms", "--ph": "min(calc(100dvh - 76px - 9rem), 680px)" } as React.CSSProperties}
        >
          {/* Double bezel: a machined tray holding the photograph. */}
          <div className="rounded-[2.2rem] border border-white/10 bg-white/[0.04] p-2 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)]">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[calc(2.2rem-0.5rem)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] lg:aspect-auto lg:h-[var(--ph)]">
              <Image
                src={unsplash(photo.heroInterior, 1100)}
                alt="A Baguio living room finished in dark timber wall panelling and a linear ceiling"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 46vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/10 to-transparent" aria-hidden="true" />
            </div>
          </div>

          {chips.map((chip) => (
            <div key={chip.tone} className={`absolute ${chip.className}`} aria-hidden="true">
              <div className="rounded-[14px] bg-white/10 p-1 shadow-[0_24px_50px_-18px_rgba(0,0,0,0.85)] ring-1 ring-white/15">
                <div className="aspect-[4/5] overflow-hidden rounded-[10px]">
                  <MaterialArt surface={chip.surface} tone={chip.tone} className="h-full w-full" />
                </div>
              </div>
            </div>
          ))}

          {/* Showroom card, lifted off the photograph's lower-left corner. */}
          <div className="relative mx-4 -mt-16 rounded-[1.4rem] border border-white/10 bg-ink-2/95 p-5 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.06)] sm:mx-10 lg:absolute lg:-bottom-6 lg:-left-8 lg:mx-0 lg:mt-0 lg:w-[280px] xl:-left-12">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-white/60">In the showroom</p>
            <ul className="mt-3.5 space-y-3">
              {showroom.map((row) => (
                <li key={row.label} className="flex items-center gap-3">
                  <span className="h-9 w-9 shrink-0 overflow-hidden rounded-lg ring-1 ring-white/10">
                    <MaterialArt surface={row.surface} tone={row.tone} className="h-full w-full" />
                  </span>
                  <span className="text-[14px] text-white/80">{row.label}</span>
                  <span className="ml-auto text-[12.5px] tabular text-white/60">{finishesIn(row.category)} finishes</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
