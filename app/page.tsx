import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BookingForm } from "@/components/booking-form";
import { SplitText } from "@/components/motion/split-text";
import { Hero } from "@/components/home/hero";
import { FeaturedSpaces } from "@/components/home/featured-spaces";
import { RoomComposer } from "@/components/home/room-composer";
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
