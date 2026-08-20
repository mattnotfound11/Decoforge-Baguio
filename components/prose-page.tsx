import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";

export interface Section {
  heading: string;
  body: string[];
  bullets?: string[];
}

export function ProsePage({
  title,
  intro,
  updated,
  sections,
}: {
  title: string;
  intro: string;
  updated: string;
  sections: Section[];
}) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="relative overflow-hidden bg-cream">
        <div className="pinstripe-light absolute inset-0" aria-hidden="true" />

        <div className="container-df relative py-16 sm:py-20">
          <div className="max-w-[68ch]">
            <h1 className="text-[clamp(2.4rem,6.4vw,3.8rem)] font-extrabold">{title}</h1>
            <p className="mt-5 text-[17px] leading-relaxed text-ink/75">{intro}</p>
            <p className="mt-3 text-[14px] text-muted">Last updated {updated}</p>
          </div>

          <div className="mt-14 grid gap-10 lg:grid-cols-[220px_1fr] lg:gap-16">
            <nav aria-label="On this page" className="lg:sticky lg:top-24 lg:self-start">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
                On this page
              </p>
              <ul className="mt-4 space-y-2.5">
                {sections.map((s) => (
                  <li key={s.heading}>
                    <a
                      href={`#${slug(s.heading)}`}
                      className="text-[14px] text-ink/70 transition hover:text-rust"
                    >
                      {s.heading}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="max-w-[70ch]">
              {sections.map((s) => (
                <section key={s.heading} id={slug(s.heading)} className="scroll-mt-28 border-t border-stone-2 py-9 first:border-t-0 first:pt-0">
                  <h2 className="text-[22px] font-extrabold tracking-[-0.02em]">{s.heading}</h2>
                  {s.body.map((p, i) => (
                    <p key={i} className="mt-4 text-[15px] leading-relaxed text-ink/75">
                      {p}
                    </p>
                  ))}
                  {s.bullets && (
                    <ul className="mt-4 space-y-2.5">
                      {s.bullets.map((b) => (
                        <li key={b} className="flex gap-3 text-[15px] leading-relaxed text-ink/75">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rust" aria-hidden="true" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
