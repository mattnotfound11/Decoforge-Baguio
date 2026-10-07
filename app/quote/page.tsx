import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PreparedFor } from "@/components/quote/prepared-for";
import { QuoteActions } from "@/components/quote/quote-actions";
import { formatPesoExact } from "@/lib/format";
import { buildQuotation, formatLongDate, parseIssued, QUOTE_VALID_DAYS } from "@/lib/quote";
import { decodeRoom, oneParam, planCode, WASTE } from "@/lib/room";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Quotation",
  description: "Your Decoforge quotation for the room you composed.",
  // Quotations are personal links, not pages to be found in search.
  robots: { index: false, follow: false },
  // Shared over Messenger, a quotation should preview as one, not as the homepage.
  openGraph: {
    type: "website",
    locale: "en_PH",
    siteName: site.name,
    title: `Quotation · ${site.name}`,
    description: "Your Decoforge quotation for the room you composed.",
  },
};

export default async function QuotePage({
  searchParams,
}: {
  searchParams: Promise<{ room?: string | string[]; d?: string | string[] }>;
}) {
  const params = await searchParams;
  const room = oneParam(params.room);
  const d = oneParam(params.d);
  const plan = decodeRoom(room);

  // Always land on the permanent, dated link, so the reference and dates in the
  // address bar stay the same when it is bookmarked or shared from there.
  if (plan) {
    const code = planCode(plan);
    const issued = parseIssued(d);
    if (room !== code || d !== issued) redirect(`/quote?room=${encodeURIComponent(code)}&d=${issued}`);
  }

  return (
    <>
      <div className="print:hidden">
        <SiteHeader />
      </div>
      <main id="main" className="bg-cream pb-24 pt-8 sm:pt-12 print:bg-white print:p-0">
        <div className="mx-auto w-full max-w-[940px] px-[var(--gutter)] print:max-w-none print:px-0">
          {plan ? <Document plan={plan} issuedParam={d} /> : <NoPlan />}
        </div>
      </main>
      <div className="print:hidden">
        <SiteFooter />
      </div>
    </>
  );
}

function Document({ plan, issuedParam }: { plan: NonNullable<ReturnType<typeof decodeRoom>>; issuedParam?: string }) {
  // Canonical code, so the reference doesn't change with how the link was written.
  const code = planCode(plan);
  const issued = parseIssued(issuedParam);
  const quote = buildQuotation(plan, code, issued);
  const shareHref = `/quote?room=${encodeURIComponent(code)}&d=${issued}`;
  const bookHref = `/contact?room=${encodeURIComponent(code)}&quote=${quote.reference}`;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/#composer" className="text-[14px] font-medium text-ink/60 transition hover:text-rust">
          ← Back to the room composer
        </Link>
      </div>
      <QuoteActions shareHref={shareHref} bookHref={bookHref} />

      <article
        aria-label={`Quotation ${quote.reference}`}
        className="quote-doc relative mt-6 overflow-hidden rounded-[1.25rem] bg-white text-ink shadow-[0_40px_80px_-50px_rgba(74,40,20,0.55)] ring-1 ring-ink/[0.07] print:mt-0 print:rounded-none print:shadow-none print:ring-0"
      >
        {/* Brand rule across the head of the sheet. */}
        <div className="h-1.5 bg-gradient-to-r from-rust via-ember to-rust" aria-hidden="true" />

        <div className="px-6 py-8 sm:px-10 sm:py-10 print:px-0 print:py-6">
          {/* ------------------------------------------------ letterhead -- */}
          <header className="flex flex-wrap items-start justify-between gap-8">
            <div>
              <p className="font-display text-[34px] leading-none">
                Deco<em className="text-rust">forge</em>
              </p>
              <p className="mt-1 text-[9.5px] font-semibold uppercase tracking-[0.3em] text-ink/65">Home &amp; Aesthetics</p>
              <address className="mt-4 text-[12.5px] not-italic leading-relaxed text-ink/65">
                {site.legalName}
                <br />
                {site.showroom.line1}, {site.showroom.line2}
                <br />
                {site.phone} · {site.email}
              </address>
            </div>

            <div className="w-full sm:w-auto sm:min-w-[250px]">
              <h1 className="font-display text-[40px] leading-none tracking-[-0.02em]">Quotation</h1>
              <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-[12.5px]">
                <dt className="text-ink/65">Reference no.</dt>
                <dd className="font-semibold tabular">{quote.reference}</dd>
                <dt className="text-ink/65">Date issued</dt>
                <dd className="font-medium">{formatLongDate(quote.issued)}</dd>
                <dt className="text-ink/65">Valid until</dt>
                <dd className="font-medium">{formatLongDate(quote.validUntil)}</dd>
                <dt className="text-ink/65">Currency</dt>
                <dd className="font-medium">Philippine peso (PHP)</dd>
              </dl>
            </div>
          </header>

          {/* ----------------------------------------- parties and project -- */}
          <div className="mt-9 grid gap-6 border-y border-ink/10 py-6 sm:grid-cols-2 sm:gap-10">
            <section aria-labelledby="q-for">
              <h2 id="q-for" className="mb-3 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-rust">
                Prepared for
              </h2>
              <PreparedFor />
            </section>
            <section aria-labelledby="q-project">
              <h2 id="q-project" className="mb-3 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-rust">
                Project
              </h2>
              <dl className="grid grid-cols-[6.5rem_1fr] gap-x-3 gap-y-2 text-[13px]">
                <dt className="text-ink/65">Scope</dt>
                <dd>Interior finishes — supply</dd>
                <dt className="text-ink/65">Room size</dt>
                <dd className="tabular">
                  {quote.plan.width.toFixed(1)} m × {quote.plan.depth.toFixed(1)} m, {quote.plan.height.toFixed(1)} m ceiling
                </dd>
                <dt className="text-ink/65">Surfaces</dt>
                <dd>{quote.lines.map((l) => l.surface.toLowerCase()).join(", ")}</dd>
                <dt className="text-ink/65">Source</dt>
                <dd>Room composer, decoforge website</dd>
              </dl>
            </section>
          </div>

          {/* ------------------------------------------------- line items -- */}
          <div className="-mx-6 mt-8 overflow-x-auto px-6 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[620px] border-collapse text-left text-[13px]">
              <caption className="sr-only">Quoted materials</caption>
              <thead>
                <tr className="border-b-2 border-ink text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink/60">
                  <th scope="col" className="w-10 py-2.5 pr-3 font-semibold">No.</th>
                  <th scope="col" className="py-2.5 pr-4 font-semibold">Description</th>
                  <th scope="col" className="py-2.5 pr-4 text-right font-semibold">Area</th>
                  <th scope="col" className="py-2.5 pr-4 text-right font-semibold">Qty</th>
                  <th scope="col" className="py-2.5 pr-4 text-right font-semibold">Unit price</th>
                  <th scope="col" className="py-2.5 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {quote.lines.map((l) => (
                  <tr key={l.n} className="border-b border-ink/10 align-top">
                    <td className="py-4 pr-3 tabular text-ink/65">{String(l.n).padStart(2, "0")}</td>
                    <td className="py-4 pr-4">
                      <p className="font-semibold">
                        {l.material.name} — {l.material.finish}
                      </p>
                      <p className="mt-0.5 text-[12px] text-ink/65">
                        {l.surface} · {l.material.specs.dimensions}
                      </p>
                      <p className="text-[12px] text-ink/65">{l.material.specs.composition}</p>
                    </td>
                    <td className="py-4 pr-4 text-right tabular">
                      {l.areaM2.toFixed(2)} m²
                      <span className="block text-[12px] text-ink/65">{l.areaSqft.toFixed(1)} sq ft</span>
                    </td>
                    <td className="whitespace-nowrap py-4 pr-4 text-right tabular">
                      {l.qty} {l.unitLabel}
                    </td>
                    <td className="whitespace-nowrap py-4 pr-4 text-right tabular">{formatPesoExact(l.unitPrice)}</td>
                    <td className="whitespace-nowrap py-4 text-right font-semibold tabular">{formatPesoExact(l.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ----------------------------------------------------- totals -- */}
          <div className="mt-6 flex justify-end">
            <dl className="w-full max-w-[360px] text-[13px]">
              <div className="flex justify-between gap-6 py-1.5">
                <dt className="text-ink/60">Materials subtotal</dt>
                <dd className="tabular">{formatPesoExact(quote.subtotal)}</dd>
              </div>
              <div className="flex justify-between gap-6 py-1.5">
                <dt className="text-ink/60">Cutting allowance</dt>
                <dd>Included (+{Math.round(WASTE * 100)}%)</dd>
              </div>
              <div className="flex justify-between gap-6 py-1.5">
                <dt className="text-ink/60">Delivery &amp; installation</dt>
                <dd>After site measure</dd>
              </div>
              <div className="mt-2 flex items-baseline justify-between gap-6 border-t-2 border-ink pt-3">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.16em]">Total, materials</dt>
                <dd className="font-display text-[30px] leading-none tabular">{formatPesoExact(quote.subtotal)}</dd>
              </div>
            </dl>
          </div>

          {/* ------------------------------------------------------ terms -- */}
          <section aria-labelledby="q-terms" className="mt-10">
            <h2 id="q-terms" className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-rust">
              Terms and notes
            </h2>
            <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[12.5px] leading-relaxed text-ink/70 marker:text-ink/40">
              <li>
                Prices are Decoforge showroom prices in Philippine pesos, held for {QUOTE_VALID_DAYS} days until{" "}
                {formatLongDate(quote.validUntil)} and subject to stock on the day of order.
              </li>
              <li>
                Quantities are calculated from the room size you entered and include a {Math.round(WASTE * 100)}% allowance
                for cutting and fitting.
              </li>
              <li>
                Delivery, installation, trims, and adhesives are quoted separately after a free site measure in
                Baguio City and the Cordilleras.
              </li>
              <li>
                A final, itemised quotation is issued after the site measure. No work begins until you approve it in
                writing.
              </li>
              <li>Payment terms are set out on the final quotation.</li>
            </ol>
          </section>

          {/* ------------------------------------------------- signatures -- */}
          <div className="mt-12 grid gap-10 sm:grid-cols-2">
            <div>
              <div className="h-12 border-b border-ink/40" aria-hidden="true" />
              <p className="mt-2 text-[12px] font-semibold">{site.legalName}</p>
              <p className="text-[11.5px] text-ink/65">Valid only when signed by an authorised Decoforge representative</p>
            </div>
            <div>
              <div className="h-12 border-b border-ink/40" aria-hidden="true" />
              <p className="mt-2 text-[12px] font-semibold">Conforme</p>
              <p className="text-[11.5px] text-ink/65">Client&rsquo;s signature over printed name · date</p>
            </div>
          </div>

          {/* ----------------------------------------------------- footer -- */}
          <footer className="mt-10 flex flex-wrap items-end justify-between gap-4 border-t border-ink/10 pt-5 text-[11px] text-ink/65">
            <p className="max-w-[52ch]">
              This quotation is valid only when signed by an authorised Decoforge representative. It is not an
              official receipt and does not acknowledge payment.
            </p>
            <p className="tabular">
              {quote.reference} · {site.facebookHandle}
            </p>
          </footer>
        </div>
      </article>
    </>
  );
}

function NoPlan() {
  return (
    <div className="mx-auto max-w-[52ch] py-24 text-center">
      <p className="eyebrow justify-center">Quotation</p>
      <h1 className="mt-5 font-display text-[clamp(2.4rem,6vw,3.6rem)] leading-[0.95] tracking-[-0.03em]">
        Compose a room <em className="text-rust">first.</em>
      </h1>
      <p className="mt-5 text-[16px] leading-relaxed text-ink/65">
        Your quotation is built from the finishes and room size you pick in the room composer. Choose them there, then
        press &ldquo;View your quotation&rdquo;.
      </p>
      <Link
        href="/#composer"
        className="mt-8 inline-flex rounded-full bg-rust px-7 py-3.5 text-[15px] font-semibold text-white transition hover:bg-rust-2"
      >
        Open the room composer
      </Link>
    </div>
  );
}
