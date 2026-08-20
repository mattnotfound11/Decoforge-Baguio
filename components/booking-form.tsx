"use client";

import { useMemo, useState } from "react";
import {
  APPOINTMENT_TYPES,
  INTERESTS,
  TIME_SLOTS,
  isClosedDay,
  maxBookingDate,
  prettyDate,
  slotLabel,
  todayInManila,
} from "@/lib/booking";

interface Success {
  reference: string;
  date: string;
  time: string;
  appointmentType: string;
  emailed: boolean;
}

const FIELD =
  "w-full rounded-lg border border-stone-2 bg-white px-4 py-3 text-[15px] text-ink outline-none transition placeholder:text-muted/60 focus:border-rust focus:ring-2 focus:ring-rust/20";
const LABEL = "mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-muted";

export interface Prefill {
  /** Matches one of INTERESTS; preselects the category dropdown. */
  interest?: string;
  /** Seeds the details box, e.g. when arriving from a product page. */
  details?: string;
  /** Shown as a chip so the visitor can see what they are enquiring about. */
  subject?: string;
}

export function BookingForm({
  compact = false,
  prefill,
}: {
  compact?: boolean;
  prefill?: Prefill;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Success | null>(null);
  const [date, setDate] = useState("");

  const today = useMemo(() => todayInManila(), []);
  const max = useMemo(() => maxBookingDate(), []);

  // Sunday is closed — say so on the field instead of failing on submit.
  const sundayPicked = date !== "" && isClosedDay(date);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setBanner(null);
    setBusy(true);

    const data = Object.fromEntries(new FormData(event.currentTarget).entries());

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const payload = await res.json();

      if (!res.ok) {
        setErrors(payload?.error?.details ?? {});
        setBanner(payload?.error?.message ?? "Something went wrong. Please try again.");
        return;
      }

      setDone(payload as Success);
    } catch {
      setBanner("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center text-ink shadow-[0_20px_60px_-24px_rgba(23,18,16,0.5)] sm:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rust/10">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 12.5l5.2 5L20 7" stroke="#b23a0f" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h3 className="mt-5 text-2xl font-extrabold tracking-[-0.02em]">Appointment requested</h3>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          {done.appointmentType} on <strong className="text-ink">{prettyDate(done.date)}</strong> at{" "}
          <strong className="text-ink">{slotLabel(done.time)}</strong>.
        </p>

        <div className="mt-5 inline-block rounded-lg bg-cream-2 px-5 py-2.5 font-mono text-[15px] tracking-[0.08em]">
          {done.reference}
        </div>

        <p className="mt-5 text-[14px] leading-relaxed text-muted">
          {done.emailed
            ? "A confirmation is on its way to your inbox, and our team has been notified."
            : "Your request is recorded and our team has it. Email delivery is not configured yet, so we will follow up by phone."}
        </p>

        <button
          type="button"
          onClick={() => setDone(null)}
          className="mt-6 rounded-lg border border-stone-2 px-5 py-2.5 text-[15px] font-semibold transition hover:bg-cream-2"
        >
          Book another
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="rounded-2xl bg-white p-6 text-ink shadow-[0_20px_60px_-24px_rgba(23,18,16,0.5)] sm:p-8 lg:p-10"
    >
      <h3 className="text-[28px] font-extrabold tracking-[-0.03em] sm:text-[32px]">Book a Consultation</h3>
      <p className="mt-2 text-[15px] leading-relaxed text-muted">
        Tell us about your project and we&rsquo;ll confirm your slot by email within one business day.
      </p>

      {prefill?.subject && (
        <p className="mt-4 inline-flex items-center gap-2 rounded-lg bg-cream-2 px-4 py-2.5 text-[14px]">
          <span className="text-muted">Enquiring about</span>
          <span className="font-semibold">{prefill.subject}</span>
        </p>
      )}

      {banner && (
        <p role="alert" className="mt-5 rounded-lg bg-[#fdeae6] px-4 py-3 text-[14px] font-medium text-[#9c3013]">
          {banner}
        </p>
      )}

      {/* Honeypot — hidden from people, tempting to bots. */}
      <div aria-hidden="true" className="absolute h-0 w-0 overflow-hidden">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" tabIndex={-1} autoComplete="off" />
      </div>

      <div className={`mt-6 grid gap-x-5 gap-y-4 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2"}`}>
        <Field id="firstName" label="First name" error={errors.firstName}>
          <input id="firstName" name="firstName" autoComplete="given-name" placeholder="Jane" className={FIELD} />
        </Field>

        <Field id="lastName" label="Last name" error={errors.lastName}>
          <input id="lastName" name="lastName" autoComplete="family-name" placeholder="Doe" className={FIELD} />
        </Field>

        <Field id="email" label="Email address" error={errors.email}>
          <input id="email" name="email" type="email" autoComplete="email" placeholder="jane@example.com" className={FIELD} />
        </Field>

        <Field id="phone" label="Phone number" error={errors.phone}>
          <input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="+63 900 000 0000" className={FIELD} />
        </Field>

        <Field id="appointmentType" label="Appointment type" error={errors.appointmentType}>
          <select id="appointmentType" name="appointmentType" defaultValue={APPOINTMENT_TYPES[0]} className={FIELD}>
            {APPOINTMENT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>

        <Field id="interest" label="Interested in" error={errors.interest}>
          <select id="interest" name="interest" defaultValue={prefill?.interest ?? ""} className={FIELD}>
            <option value="">Select a material category…</option>
            {INTERESTS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>

        <Field
          id="date"
          label="Preferred date"
          error={errors.date ?? (sundayPicked ? "The showroom is closed on Sundays." : undefined)}
        >
          <input
            id="date"
            name="date"
            type="date"
            min={today}
            max={max}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={FIELD}
          />
        </Field>

        <Field id="time" label="Preferred time" error={errors.time}>
          <select id="time" name="time" defaultValue={TIME_SLOTS[0].value} className={FIELD}>
            {TIME_SLOTS.map((slot) => (
              <option key={slot.value} value={slot.value}>{slot.label}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mt-4">
        <Field id="details" label="Project details" error={errors.details}>
          <textarea
            id="details"
            name="details"
            rows={4}
            defaultValue={prefill?.details ?? ""}
            placeholder="Briefly describe your project scope and aesthetic goals…"
            className={`${FIELD} resize-y`}
          />
        </Field>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-rust px-7 py-4 text-[15px] font-bold text-white transition hover:bg-rust-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {busy ? "Sending…" : "Submit Inquiry"}
        {!busy && (
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M3 10h13M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <p className="mt-3 text-[13px] text-muted">
        Open daily. We never share your details.
      </p>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-1.5 text-[13px] font-medium text-[#9c3013]">{error}</p>
      )}
    </div>
  );
}
