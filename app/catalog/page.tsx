import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CatalogBrowser } from "@/components/catalog-browser";
import { materials, type CategoryId } from "@/lib/materials";

export const metadata: Metadata = {
  title: "Materials Catalog",
  description:
    "Browse Decoforge PVC ceilings, fluted panels, and WPC decking with live stock availability and per-piece pricing.",
};

const VALID: CategoryId[] = ["pvc-ceilings", "fluted-panels", "decking"];

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { c } = await searchParams;
  const initialCategory = VALID.includes(c as CategoryId) ? (c as CategoryId) : "all";

  return (
    <>
      <SiteHeader />
      <main id="main" className="relative overflow-hidden bg-cream">
        <div className="pinstripe-light absolute inset-0" aria-hidden="true" />

        <div className="container-df relative py-16 sm:py-20">
          <h1 className="text-[clamp(2.75rem,8vw,4.6rem)] font-extrabold">Materials Catalog</h1>
          <p className="mt-6 max-w-[58ch] text-[17px] leading-relaxed text-ink/75">
            Explore our curated selection of high-end architectural surfaces. Refined organic
            textures designed for modern spaces, priced per piece and checked against showroom
            stock in real time.
          </p>

          <div className="mt-12">
            <CatalogBrowser materials={materials} initialCategory={initialCategory} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
