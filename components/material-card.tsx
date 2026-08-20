import Link from "next/link";
import { MaterialArt } from "./material-art";
import { StockBadge } from "./stock-badge";
import { categoryLabel, type Material } from "@/lib/materials";
import { formatPeso } from "@/lib/format";

export function MaterialCard({ material }: { material: Material }) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-card border border-stone bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-28px_rgba(23,18,16,0.45)]">
      <div className="relative aspect-[5/4] overflow-hidden bg-cream-2">
        <MaterialArt
          surface={material.surface}
          tone={material.tone}
          className="h-full w-full transition duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute left-3 top-3">
          <StockBadge slug={material.slug} fallback={material.baselineStock} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
          {categoryLabel(material.category)}
        </p>

        <h3 className="mt-1.5 text-[21px] font-extrabold tracking-[-0.02em]">
          {/* Stretched link: the whole card is clickable without nesting anchors. */}
          <Link href={`/catalog/${material.slug}`} className="after:absolute after:inset-0">
            {material.name}
          </Link>
        </h3>

        {/* Ranges like UV Marble share one name, so the finish has to show. */}
        {!material.name.toLowerCase().includes(material.finish.toLowerCase()) && (
          <p className="text-[15px] font-bold text-rust">{material.finish}</p>
        )}

        <p className="mt-2 line-clamp-2 text-[14px] leading-relaxed text-muted">{material.summary}</p>

        <div className="mt-5 flex items-end justify-between gap-3 pt-1">
          <p className="text-[22px] font-extrabold tracking-[-0.02em]">
            {formatPeso(material.pricePhp)}
            <span className="ml-1 text-[14px] font-medium text-muted">/{material.unit}</span>
          </p>

          <Link
            href={`/contact?material=${material.slug}`}
            className="relative z-10 inline-flex items-center gap-1.5 text-[14px] font-semibold text-rust transition hover:gap-2.5"
          >
            Request a Quote
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M3 10h13M11 5l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}
