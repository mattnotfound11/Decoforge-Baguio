import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="bg-cream">
        <div className="container-df flex min-h-[calc(100dvh-76px)] flex-col items-center justify-center py-20 text-center">
          <p className="text-[13px] font-bold uppercase tracking-[0.2em] text-rust">404</p>
          <h1 className="mt-4 font-display text-[clamp(2.6rem,7vw,4.6rem)] leading-[0.95] tracking-[-0.03em]">
            That page isn&rsquo;t <em className="text-rust">in the catalog.</em>
          </h1>
          <p className="mt-4 max-w-[48ch] text-[16px] leading-relaxed text-muted">
            The link may be out of date. Browse the full materials catalog, or tell us what you are
            looking for and we will point you at it.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/catalog" className="rounded-full bg-rust px-7 py-3.5 text-[15px] font-semibold text-white transition duration-300 hover:bg-rust-2 active:scale-[0.97]">
              Browse the catalog
            </Link>
            <Link href="/contact" className="rounded-full border border-ink/25 px-7 py-3.5 text-[15px] font-semibold transition duration-300 hover:border-ink hover:bg-ink hover:text-cream active:scale-[0.97]">
              Contact us
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
