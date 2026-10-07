"use client";

import Link from "next/link";
import { useState } from "react";

/** Print / save, copy the permanent link, or book the site measure. Hidden on paper. */
export function QuoteActions({ shareHref, bookHref }: { shareHref: string; bookHref: string }) {
  const [copied, setCopied] = useState<"done" | "failed" | null>(null);

  const copy = async () => {
    const url = new URL(shareHref, window.location.origin).toString();
    try {
      await navigator.clipboard.writeText(url);
      setCopied("done");
    } catch {
      // Clipboard can be blocked (e.g. insecure origin): put the link in the
      // address bar instead, and say so rather than claiming it was copied.
      window.history.replaceState(null, "", shareHref);
      setCopied("failed");
    }
    window.setTimeout(() => setCopied(null), 2600);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[14px] font-semibold text-cream transition hover:bg-ink-2 active:scale-[0.97]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <path d="M6 14h12v7H6z" />
          </svg>
          Print or save as PDF
        </button>
        <button
          type="button"
          onClick={copy}
          aria-live="polite"
          className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-5 py-2.5 text-[14px] font-semibold text-ink transition hover:border-ink active:scale-[0.97]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
            <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
          </svg>
          {copied === "done" ? "Link copied" : copied === "failed" ? "Copy it from the address bar" : "Copy link"}
        </button>
      </div>

      <Link
        href={bookHref}
        className="group inline-flex items-center gap-3 rounded-full bg-rust py-1.5 pl-5 pr-1.5 text-[14px] font-semibold text-white transition hover:bg-rust-2 active:scale-[0.97]"
      >
        Book a free site measure
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 transition-transform group-hover:translate-x-0.5">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M5 15L15 5M7 5h8v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </Link>
    </div>
  );
}
