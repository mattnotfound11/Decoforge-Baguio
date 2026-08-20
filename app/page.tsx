import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BookingForm } from "@/components/booking-form";
import { Hero } from "@/components/home/hero";
import { FeaturedSpaces } from "@/components/home/featured-spaces";
import {
  BookingBand,
  CatalogPreview,
  Gallery,
  Marquee,
  QualityBand,
  Ranges,
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
        <QualityBand />
        <CatalogPreview />
        <FeaturedSpaces />
        <BookingBand>
          <BookingForm />
        </BookingBand>
        <Gallery />
      </main>
      <SiteFooter variant="dark" />
    </div>
  );
}
