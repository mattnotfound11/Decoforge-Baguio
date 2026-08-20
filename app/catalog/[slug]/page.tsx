import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MaterialArt } from "@/components/material-art";
import { ProductGallery } from "@/components/product-gallery";
import { StockBadge } from "@/components/stock-badge";
import { categoryLabel, getMaterial, materials } from "@/lib/materials";
import { formatPeso, formatUsd } from "@/lib/format";
import { photo } from "@/lib/site";

export function generateStaticParams() {
  return materials.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const material = getMaterial(slug);
  if (!material) return { title: "Material not found" };

  return {
    title: `${material.name} — ${material.finish}`,
    description: material.summary,
  };
}

const SHOWCASE = [
  { id: photo.slatWall, alt: "Panel installed as a full-height feature wall" },
  { id: photo.darkLoft, alt: "Panel detail under warm interior lighting" },
];

export default async function MaterialPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const material = getMaterial(slug);
  if (!material) notFound();

  const pairings = material.pairings
    .map((s) => getMaterial(s))
    .filter((m): m is NonNullable<typeof m> => Boolean(m));

  const specRows: [string, string][] = [
    ["Dimensions (per panel)", material.specs.dimensions],
    ["Material composition", material.specs.composition],
    ["Installation method", material.specs.installation],
    ["Fire rating", material.specs.fireRating],
    ["Acoustic performance", material.specs.acoustic],
    ["Maintenance", material.specs.maintenance],
  ];

  return (
    <>
      <SiteHeader />
      <main id="main" className="bg-cream">
        <div className="container-df py-10 sm:py-14">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-[14px] text-muted">
            <Link href="/catalog" className="hover:text-rust">Catalog</Link>
            <Chevron />
            <Link href={`/catalog?c=${material.category}`} className="hover:text-rust">
              {categoryLabel(material.category)}
            </Link>
            <Chevron />
            <span className="font-semibold text-ink">
              {material.name} — {material.finish}
            </span>
          </nav>

          <div className="mt-8 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
            <ProductGallery
              surface={material.surface}
              tone={material.tone}
              name={material.name}
              photos={SHOWCASE}
            />

            <div>
              <div className="flex flex-wrap items-center gap-3">
                {material.sustainable && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-rust px-3.5 py-1.5 text-[12px] font-bold text-white">
                    <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path d="M16 4c0 7-4.5 11-9 11-1 0-2-.2-2.8-.6C5 10 9 6.5 14 5.5 10 7 6.6 9.6 5 13.4 6.8 6.6 11 4 16 4z" />
                    </svg>
                    Sustainable Core
                  </span>
                )}
                <StockBadge slug={material.slug} fallback={material.baselineStock} showCount />
              </div>

              <h1 className="mt-5 text-[clamp(2rem,5vw,2.9rem)] font-extrabold">{material.name}</h1>
              <p className="mt-1 text-[clamp(1.35rem,3.2vw,1.85rem)] font-extrabold text-rust">
                {material.finish}
              </p>

              <div className="mt-7 rounded-card bg-cream-2 p-6 sm:p-7">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <span className="text-[15px] text-muted">Estimated Price</span>
                  <span className="text-[30px] font-extrabold tracking-[-0.02em]">
                    {formatUsd(material.priceUsdSqft)}
                    <span className="ml-1 text-[15px] font-medium text-muted">/ sq ft</span>
                  </span>
                </div>
                <p className="mt-1 text-right text-[14px] text-muted">
                  {formatPeso(material.pricePhp)} per {material.unit} at the showroom
                </p>

                <p className="mt-5 text-[15px] leading-relaxed text-ink/75">{material.description}</p>

                <Link
                  href={`/contact?material=${material.slug}`}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-rust px-7 py-4 text-[15px] font-bold text-white transition hover:bg-rust-2"
                >
                  Request a Quote
                  <svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M3 10h13M11 5l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>

                <a
                  href={`/api/specs/${material.slug}`}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-ink/25 px-7 py-4 text-[15px] font-bold transition hover:border-ink hover:bg-ink hover:text-cream"
                >
                  <svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M10 3v9m0 0l-3.5-3.5M10 12l3.5-3.5M4 15.5h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Download Specs &amp; CAD
                </a>
              </div>

              <dl className="mt-7 grid grid-cols-2 gap-6">
                <Fact
                  label="Lead Time"
                  value={material.leadTime}
                  icon={
                    <path d="M2.5 6h11l2 4v4h-2M2.5 6v8h1m10 0H7m-4.5 0a1.75 1.75 0 103.5 0 1.75 1.75 0 10-3.5 0zm10 0a1.75 1.75 0 103.5 0 1.75 1.75 0 10-3.5 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  }
                />
                <Fact
                  label="Availability"
                  value={`${material.baselineStock > 0 ? "In Stock" : "On order"} (Domestic)`}
                  icon={
                    <>
                      <rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M3 8h14M7 2.5v3M13 2.5v3M7.5 12l1.8 1.8L13 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </>
                  }
                />
              </dl>
            </div>
          </div>

          <section className="mt-20 border-t border-stone-2 pt-14">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
              <div>
                <h2 className="text-[clamp(1.5rem,3.2vw,2rem)] font-extrabold">
                  Technical Specifications
                </h2>
                <p className="mt-4 text-[15px] leading-relaxed text-muted">
                  Engineered for stability and ease of use. The high-density core prevents warping
                  while the premium polymer wrap ensures colour consistency and durability across
                  large installations.
                </p>

                {/* Fills what would otherwise be an empty column beside the spec card. */}
                <div className="mt-7 rounded-card border border-stone-2 bg-white/60 p-6">
                  <h3 className="text-[15px] font-bold">Specifying this panel?</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-muted">
                    The downloadable sheet carries the full dimensional and fire data. DWG and DXF
                    blocks are issued with your measured quotation.
                  </p>

                  <ul className="mt-5 space-y-2.5">
                    {[
                      ["Coverage", `${material.unit === "pc" ? "Sold per piece" : material.unit}`],
                      ["Warranty", "5 years on workmanship"],
                      ["Samples", "Free at the Irisan Road showroom"],
                    ].map(([k, v]) => (
                      <li key={k} className="flex justify-between gap-4 text-[14px]">
                        <span className="text-muted">{k}</span>
                        <span className="text-right font-semibold">{v}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <dl className="grid gap-x-8 gap-y-6 rounded-card bg-white p-7 sm:grid-cols-2 sm:p-9">
                {specRows.map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
                      {label}
                    </dt>
                    <dd className="mt-1.5 text-[15px] font-semibold leading-snug">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          <section className="mt-20">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="text-[clamp(1.5rem,3.2vw,2rem)] font-extrabold">Suggested Pairings</h2>
              <Link
                href="/catalog"
                className="inline-flex items-center gap-2 text-[14px] font-semibold text-rust transition hover:gap-3"
              >
                View Full System
                <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M3 10h13M11 5l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              {pairings.map((p) => (
                <Link key={p.slug} href={`/catalog/${p.slug}`} className="group">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-card">
                    <MaterialArt
                      surface={p.surface}
                      tone={p.tone}
                      className="h-full w-full transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <h3 className="mt-3 text-[16px] font-bold transition group-hover:text-rust">{p.name}</h3>
                  <p className="mt-0.5 text-[14px] text-muted">
                    {p.finish} — {p.summary.split(".")[0]}.
                  </p>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function Chevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="text-stone-2">
      <path d="M8 5l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Fact({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="mt-0.5 shrink-0 text-rust" aria-hidden="true">
        {icon}
      </svg>
      <div>
        <dt className="text-[13px] text-muted">{label}</dt>
        <dd className="mt-0.5 text-[15px] font-semibold">{value}</dd>
      </div>
    </div>
  );
}
