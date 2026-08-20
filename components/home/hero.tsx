import Image from "next/image";
import Link from "next/link";
import { photo, unsplash } from "@/lib/site";
import { formatPeso } from "@/lib/format";
import { MaterialArt } from "@/components/material-art";
import type { Surface, Tone } from "@/lib/materials";

const priceStrip: { label: string; price: number; surface: Surface; tone: Tone }[] = [
  { label: "PVC Ceilings", price: 580, surface: "ceiling", tone: "matte-white" },
  { label: "Fluted Panels", price: 1200, surface: "fluted", tone: "terracotta" },
  { label: "WPC Decking", price: 2100, surface: "deck", tone: "cedar" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-ink text-white">
      <div className="pinstripe absolute inset-0" aria-hidden="true" />
      <div
        className="float-slow absolute -left-40 top-0 h-[520px] w-[520px] rounded-full bg-rust/20 blur-[140px]"
        aria-hidden="true"
      />

      <div className="container-df relative grid items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-24">
        <div>
          <span className="rise inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/75">
            <span className="h-1.5 w-1.5 rounded-full bg-rust-2" aria-hidden="true" />
            Irisan, Baguio City · Open daily
          </span>

          <h1 className="rise mt-7 text-[clamp(2.75rem,7.4vw,4.9rem)] font-extrabold uppercase" style={{ animationDelay: "90ms" }}>
            Crafting
            <br />
            Baguio&rsquo;s
            <br />
            <span className="text-rust-2">Finest Interiors.</span>
          </h1>

          <p className="rise mt-7 max-w-[46ch] text-[17px] leading-relaxed text-white/70" style={{ animationDelay: "180ms" }}>
            Elevate your space with affordable and premium home decor finishes. UV marble boards,
            PVC ceilings, fluted wall panels, and WPC decking — supplied and installed across Baguio
            City and the Cordilleras.
          </p>

          <div className="rise mt-9 flex flex-wrap gap-3" style={{ animationDelay: "270ms" }}>
            <Link
              href="/catalog"
              className="inline-flex items-center justify-center rounded-lg bg-rust px-7 py-4 text-[15px] font-bold transition duration-300 hover:-translate-y-0.5 hover:bg-rust-2 hover:shadow-[0_14px_30px_-12px_rgba(207,81,25,0.7)]"
            >
              Browse Materials
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-lg border border-white/25 px-7 py-4 text-[15px] font-bold transition duration-300 hover:-translate-y-0.5 hover:border-white hover:bg-white hover:text-ink"
            >
              Book Now
            </Link>
          </div>

          <dl className="rise mt-12 flex flex-wrap gap-x-10 gap-y-6" style={{ animationDelay: "360ms" }}>
            {[
              ["2.8K", "followers on Facebook"],
              ["Open daily", "message us any time"],
              ["Free", "quotation and site measure"],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="text-[24px] font-extrabold tracking-[-0.03em] sm:text-[28px]">{value}</dt>
                <dd className="mt-0.5 text-[13px] text-white/55">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rise relative" style={{ animationDelay: "240ms" }}>
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl sm:aspect-[5/5] lg:aspect-[4/5]">
            <Image
              src={unsplash(photo.heroInterior, 1100)}
              alt="A Baguio living room finished in dark timber wall panelling and a linear ceiling"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 46vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/25 to-transparent" aria-hidden="true" />
          </div>

          {/* Price strip lifted off the photograph, as in the design. */}
          <div className="mx-4 -mt-16 rounded-xl border border-white/10 bg-ink-2/92 p-5 backdrop-blur-md sm:mx-8 lg:absolute lg:-bottom-6 lg:-left-8 lg:mx-0 lg:mt-0 lg:w-[300px]">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/50">
              Materials from
            </p>
            <ul className="mt-3 space-y-3">
              {priceStrip.map((row) => (
                <li key={row.label} className="flex items-center gap-3">
                  <span className="h-9 w-9 shrink-0 overflow-hidden rounded-md">
                    <MaterialArt surface={row.surface} tone={row.tone} className="h-full w-full" />
                  </span>
                  <span className="text-[14px] text-white/80">{row.label}</span>
                  <span className="ml-auto text-[14px] font-bold">{formatPeso(row.price)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
