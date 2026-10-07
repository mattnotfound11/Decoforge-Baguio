"use client";

import { useState } from "react";

/**
 * "Prepared for" fields the customer fills in before printing. Nothing is
 * stored or sent; the values only appear on this copy. Blank fields print
 * as ruled lines, ready to be written in by hand.
 */
const FIELDS = [
  { key: "name", label: "Client", placeholder: "Full name" },
  { key: "contact", label: "Contact", placeholder: "Mobile or email" },
  { key: "site", label: "Project site", placeholder: "Address of the installation" },
] as const;

export function PreparedFor() {
  const [values, setValues] = useState<Record<string, string>>({});

  return (
    <dl className="space-y-2.5">
      {FIELDS.map((f) => (
        <div key={f.key} className="grid grid-cols-[6.5rem_1fr] items-end gap-3">
          <dt className="pb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/65">{f.label}</dt>
          <dd>
            <label className="sr-only" htmlFor={`pf-${f.key}`}>
              {f.label}
            </label>
            <input
              id={`pf-${f.key}`}
              value={values[f.key] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              autoComplete="off"
              className="w-full border-b border-dashed border-ink/25 bg-transparent pb-1 text-[16px] font-medium text-ink outline-none transition placeholder:font-normal placeholder:text-ink/50 focus:border-b-2 focus:border-solid focus:border-rust print:text-[14px] print:border-solid print:border-ink/40 print:placeholder:text-transparent"
            />
          </dd>
        </div>
      ))}
    </dl>
  );
}
