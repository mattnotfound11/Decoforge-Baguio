import Link from "next/link";
import { MaterialArt } from "./material-art";
import { StockBadge } from "./stock-badge";
import { categoryLabel, type Material } from "@/lib/materials";
import { formatPeso } from "@/lib/format";

export function MaterialCard({ material }: { material: Material }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-card border border-stone bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-28px_rgba(23,18,16,0.45)]">
      <div className="relative aspect-[5/4] overflow-hidden bg-cream-2">
        <MaterialArt
          surface={material.surface}
          tone={material.tone}
          className="h-full w-full transition-transform duration-500 group-hover:scale-[1.04]"
        />

        {/* Light sweeps across the sample on hover, the way a gloss finish would. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/45 to-transparent opacity-0 transition-all duration-700 ease-out group-hover:left-[110%] group-hover:opacity-100"
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

        {/* Ranges like UV Marble share one name, so the finish has to show. When
            the name already says it, the line is kept (invisibly) so every card
            in a row lines up. */}
        {material.name.toLowerCase().includes(material.finish.toLowerCase()) ? (
          <p className="invisible text-[15px] font-bold" aria-hidden="true">&nbsp;</p>
        ) : (
          <p className="text-[15px] font-bold text-rust">{material.finish}</p>
        )}

        {/* Two lines reserved, so one-line summaries don't pull the price up. */}
        <p className="mt-2 line-clamp-2 min-h-[2lh] text-[14px] leading-relaxed text-muted">{material.summary}</p>

        {/* One line at every card width, so the CTA row lines up across a row of cards. */}
        <div className="mt-auto flex items-baseline justify-between gap-2 pt-6">
          <p className="whitespace-nowrap text-[20px] font-extrabold tracking-[-0.02em]">
            {formatPeso(material.pricePhp)}
            <span className="ml-0.5 text-[13px] font-medium text-muted">/{material.unit}</span>
          </p>

          <Link
            href={`/contact?material=${material.slug}`}
            className="relative z-10 inline-flex items-center gap-1 whitespace-nowrap text-[13.5px] font-semibold text-rust transition-[gap] hover:gap-2"
          >
            Request a quote
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="shrink-0">
              <path d="M3 10h13M11 5l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}
