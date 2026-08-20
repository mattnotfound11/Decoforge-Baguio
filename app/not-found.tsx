import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="bg-cream">
        <div className="container-df flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
          <p className="text-[13px] font-bold uppercase tracking-[0.2em] text-rust">404</p>
          <h1 className="mt-4 text-[clamp(2rem,6vw,3.4rem)] font-extrabold">
            That page isn&rsquo;t in the catalog.
          </h1>
          <p className="mt-4 max-w-[48ch] text-[16px] leading-relaxed text-muted">
            The link may be out of date. Browse the full materials catalog, or tell us what you are
            looking for and we will point you at it.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/catalog" className="rounded-lg bg-rust px-7 py-3.5 text-[15px] font-bold text-white transition hover:bg-rust-2">
              Browse the catalog
            </Link>
            <Link href="/contact" className="rounded-lg border border-ink/25 px-7 py-3.5 text-[15px] font-bold transition hover:border-ink hover:bg-ink hover:text-cream">
              Contact us
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
