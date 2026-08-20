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
    <>
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
    </>
  );
}
