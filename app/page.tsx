import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BookingForm } from "@/components/booking-form";
import { SplitText } from "@/components/motion/split-text";
import { Hero } from "@/components/home/hero";
import { FeaturedSpaces } from "@/components/home/featured-spaces";
import { RoomComposer } from "@/components/home/room-composer";
import { PineSprig, SampleBook } from "@/components/home/sample-book";
import {
  BookingBand,
  CatalogPreview,
  Gallery,
  Marquee,
  Process,
  Ranges,
  Statement,
} from "@/components/home/sections";

export default function HomePage() {
  return (
    // The header is transparent at rest, so the strip it occupies above the
    // hero must be ink — otherwise the cream body shows through behind the
    // white nav links.
    <div className="bg-ink">
      <SiteHeader variant="dark" />
      <main id="main">
        <Hero />
        <Marquee />
        <Ranges />
        <Statement />

        {/* ------------------------------------------- room composer -- */}
        <section id="composer" className="relative isolate overflow-hidden bg-ink py-28 text-white sm:py-36">
          <div className="pinstripe absolute inset-0 -z-10" aria-hidden="true" />
          <div className="absolute -left-40 top-1/3 -z-10 h-[780px] w-[780px] bg-[radial-gradient(closest-side,rgb(178_58_15_/_0.22),transparent)]" aria-hidden="true" />
          <div className="container-df">
            <div className="grid items-end gap-8 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <p className="eyebrow text-white/50" data-reveal>Room composer</p>
                <SplitText
                  className="mt-5 font-display text-[clamp(2.8rem,6.4vw,5.4rem)] leading-[0.95] tracking-[-0.03em]"
                  parts={["See it on your walls ", { text: "before we fit it.", className: "italic text-ember" }]}
                />
              </div>
              <p className="max-w-[44ch] text-[16px] leading-[1.75] text-white/55 lg:justify-self-end" data-reveal>
                Pick a finish for the feature wall, ceiling, and floor, set your room&rsquo;s size, and
                watch the estimate update. Send it to us and the quote request fills itself in.
              </p>
            </div>
            <div className="mt-14">
              <RoomComposer />
            </div>
          </div>
        </section>

        {/* --------------------------------------------- sample book -- */}
        <section id="sample-book" className="relative isolate overflow-hidden bg-paper py-28 text-graphite sm:py-36">
          {/* Botanical atmosphere: a warm wash and pine sprigs in the margins. */}
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_15%_10%,rgba(207,81,25,0.10),transparent_70%),radial-gradient(50%_45%_at_90%_85%,rgba(120,110,60,0.14),transparent_70%)]" aria-hidden="true" />
          <PineSprig className="pointer-events-none absolute -left-16 top-24 -z-10 w-[300px] text-graphite/[0.13] sm:w-[380px]" />
          <PineSprig className="pointer-events-none absolute -right-20 bottom-10 -z-10 w-[280px] rotate-[160deg] text-graphite/[0.11] sm:w-[360px]" flip />

          <div className="container-df">
            <div className="mx-auto max-w-[820px] text-center">
              <p className="font-book text-[15px] italic text-graphite/75" data-reveal>
                The Decoforge sample book · Volume I
              </p>
              <SplitText
                className="mt-5 font-display text-[clamp(2.8rem,6.6vw,5.6rem)] leading-[0.95] tracking-[-0.03em]"
                parts={["Nine plates, ", { text: "drawn from\nthe showroom.", className: "italic text-rust" }]}
              />
              <p className="mx-auto mt-6 max-w-[52ch] font-book text-[18px] leading-[1.6] text-graphite/70" data-reveal>
                Turn through our most-requested finishes the way you would at the counter in Irisan —
                then put the loupe on a plate and look closely at the surface.
              </p>
            </div>
            <div className="mt-16">
              <SampleBook />
            </div>
          </div>
        </section>

        <Process />
        <CatalogPreview />
        <FeaturedSpaces />
        <BookingBand>
          <BookingForm heading={false} />
        </BookingBand>
        <Gallery />
      </main>
      <SiteFooter variant="dark" />
    </div>
  );
}
