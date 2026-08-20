import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BookingForm, type Prefill } from "@/components/booking-form";
import { categoryLabel, getMaterial } from "@/lib/materials";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact & Booking",
  description:
    "Book a showroom consultation, on-site visit, or video call with the Decoforge team in Baguio City.",
};

/** Maps a material category onto the matching "Interested in" option. */
const INTEREST_FOR = {
  "uv-marble": "UV Marble Boards",
  "pvc-ceilings": "PVC Ceilings",
  "fluted-panels": "Fluted Panels",
  decking: "Decking",
} as const;

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ material?: string }>;
}) {
  const { material: slug } = await searchParams;
  const material = slug ? getMaterial(slug) : undefined;

  const prefill: Prefill | undefined = material
    ? {
        interest: INTEREST_FOR[material.category],
        subject: `${material.name} — ${material.finish}`,
        details: `I would like a quotation for ${material.name} (${material.finish}), listed at ${categoryLabel(material.category)}.\n\nProject details: `,
      }
    : undefined;

  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="relative overflow-hidden bg-ink py-16 text-white sm:py-20">
          <div className="pinstripe absolute inset-0" aria-hidden="true" />
          <div
            className="absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-rust/15 blur-[150px]"
            aria-hidden="true"
          />

          <div className="container-df relative">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="rise text-[clamp(2.5rem,7vw,4.3rem)] font-extrabold">Let&rsquo;s Talk Design.</h1>
              <p className="rise mx-auto mt-5 max-w-[58ch] text-[17px] leading-relaxed text-white/70" style={{ animationDelay: "90ms" }}>
                Connect with our home decor and finishing team in Irisan, Baguio City. We are ready
                to bring your refined visions to life.
              </p>
            </div>

            <div className="mt-14 grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-8 lg:items-start">
              <div className="grid gap-6" data-reveal="left">
                <div className="rounded-card border border-white/10 bg-white/[0.04] p-7">
                  <h2 className="text-[26px] font-extrabold tracking-[-0.02em]">Contact Us</h2>

                  <ul className="mt-6 space-y-5">
                    <ContactRow
                      label="Phone"
                      value={site.phone}
                      href={site.phoneHref}
                      icon={<path d="M4 3h3l1.5 4L6.8 8.4a10 10 0 004.8 4.8L13 11.5 17 13v3a1 1 0 01-1.1 1A13.5 13.5 0 013 4.1 1 1 0 014 3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />}
                    />
                    <ContactRow
                      label="Email"
                      value={site.email}
                      href={`mailto:${site.email}`}
                      icon={<><rect x="2.5" y="4.5" width="15" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M3 6l7 5 7-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></>}
                    />
                    <ContactRow
                      label="Facebook"
                      value={site.facebookHandle}
                      href={site.facebook}
                      external
                      icon={<path d="M11.5 18v-6h2l.4-2.6h-2.4V7.7c0-.75.2-1.26 1.28-1.26H14V4.12A17 17 0 0012.02 4C10.06 4 8.7 5.2 8.7 7.4v2H6.5V12h2.2v6z" fill="currentColor" />}
                    />
                    <ContactRow
                      label="Messenger"
                      value="Chat with us"
                      href={site.messenger}
                      external
                      icon={<><path d="M10 2.5c-4.2 0-7.5 3.08-7.5 7.24 0 2.37 1.08 4.48 2.77 5.86v2.9l2.53-1.39c.7.19 1.43.3 2.2.3 4.2 0 7.5-3.08 7.5-7.24S14.2 2.5 10 2.5z" stroke="currentColor" strokeWidth="1.4" fill="none" /><path d="M5.6 12.2l3.1-3.3 1.6 1.7 2.6-1.7-3.1 3.3-1.6-1.7z" fill="currentColor" /></>}
                    />
                  </ul>
                </div>

                <div className="rounded-card border border-white/10 bg-white/[0.04] p-7">
                  <h2 className="flex items-center gap-2.5 text-[22px] font-extrabold tracking-[-0.02em]">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-rust-2" aria-hidden="true">
                      <path d="M10 18s6-5 6-9a6 6 0 10-12 0c0 4 6 9 6 9z" stroke="currentColor" strokeWidth="1.6" />
                      <circle cx="10" cy="9" r="2.2" stroke="currentColor" strokeWidth="1.6" />
                    </svg>
                    Showroom
                  </h2>

                  <a
                    href={site.showroom.mapHref}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 block text-[15px] leading-relaxed text-white/75 transition hover:text-white"
                  >
                    {site.showroom.line1}
                    <br />
                    {site.showroom.line2}
                  </a>

                  <div className="mt-6 border-t border-white/10 pt-5">
                    <p className="flex items-center gap-2.5 text-[15px] font-bold">
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="text-rust-2" aria-hidden="true">
                        <circle cx="10" cy="10" r="7.2" stroke="currentColor" strokeWidth="1.6" />
                        <path d="M10 6v4.2l2.6 1.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                      Operating Hours
                    </p>
                    <p className="mt-2 text-[15px] leading-relaxed text-white/70">
                      {site.hours.weekdays}
                      <br />
                      {site.hours.weekend}
                    </p>
                  </div>
                </div>

                {/* Keeps the column level with the form instead of trailing off. */}
                <div className="rounded-card border border-white/10 bg-white/[0.04] p-7">
                  <h2 className="text-[22px] font-extrabold tracking-[-0.02em]">What happens next</h2>
                  <ol className="mt-5 space-y-4">
                    {[
                      ["Within 1 business day", "We confirm your slot by email and phone."],
                      ["At the appointment", "Samples in hand, measurements taken, options priced."],
                      ["Within 2 business days", "An itemised written quotation, down to the trim."],
                    ].map(([when, what], i) => (
                      <li key={when} className="flex gap-3.5">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rust text-[12px] font-bold">
                          {i + 1}
                        </span>
                        <span>
                          <span className="block text-[14px] font-bold">{when}</span>
                          <span className="block text-[14px] text-white/60">{what}</span>
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <div data-reveal="right">
                <BookingForm prefill={prefill} />
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function ContactRow({
  label,
  value,
  href,
  icon,
  external = false,
}: {
  label: string;
  value: string;
  href: string;
  icon: React.ReactNode;
  external?: boolean;
}) {
  return (
    <li className="flex gap-3.5">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="mt-1 shrink-0 text-rust-2" aria-hidden="true">
        {icon}
      </svg>
      <div>
        <p className="text-[13px] text-white/50">{label}</p>
        <a
          href={href}
          {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
          className="text-[16px] font-semibold transition hover:text-rust-2"
        >
          {value}
        </a>
      </div>
    </li>
  );
}
