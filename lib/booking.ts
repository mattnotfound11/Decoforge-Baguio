/** Appointment types, slot rules, and request validation. */

export const APPOINTMENT_TYPES = [
  "Showroom consultation",
  "On-site visit",
  "Video call",
] as const;

export const INTERESTS = [
  "UV Marble Boards",
  "PVC Ceilings",
  "Fluted Panels",
  "Decking",
  "Full interior fit-out",
  "Not sure yet",
] as const;

/** Appointment slots the team keeps open. The shop itself is always open. */
export const TIME_SLOTS = [
  { value: "09:00", label: "9:00 AM" },
  { value: "10:30", label: "10:30 AM" },
  { value: "13:00", label: "1:00 PM" },
  { value: "14:30", label: "2:30 PM" },
  { value: "16:00", label: "4:00 PM" },
] as const;

export const BOOKING_WINDOW_DAYS = 90;

export interface BookingInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  appointmentType: string;
  interest: string;
  date: string;
  time: string;
  details: string;
}

export interface BookingRecord extends BookingInput {
  reference: string;
  createdAt: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
// +63 917 123 4567 / 09171234567 / (074) 442-1234
const PHONE_RE = /^[+(\d][\d\s()+-]{6,19}$/;

const clean = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, max) : "";

/**
 * The Facebook page lists Decoforge as always open, so every day is bookable.
 * Kept as a function so a future closed day is a one-line change.
 */
export const isClosedDay = (_iso: string) => false;

export function todayInManila(): string {
  // The showroom books against Manila local time, not the visitor's timezone.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function maxBookingDate(): string {
  const d = new Date(`${todayInManila()}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + BOOKING_WINDOW_DAYS);
  return d.toISOString().slice(0, 10);
}

export function validateBooking(body: Record<string, unknown>): {
  errors: Record<string, string>;
  value: BookingInput;
} {
  const errors: Record<string, string> = {};

  const value: BookingInput = {
    firstName: clean(body.firstName, 60),
    lastName: clean(body.lastName, 60),
    email: clean(body.email, 120).toLowerCase(),
    phone: clean(body.phone, 24),
    appointmentType: clean(body.appointmentType, 40),
    interest: clean(body.interest, 40),
    date: clean(body.date, 10),
    time: clean(body.time, 5),
    details: typeof body.details === "string" ? body.details.trim().slice(0, 2000) : "",
  };

  if (value.firstName.length < 2) errors.firstName = "Enter your first name.";
  if (value.lastName.length < 2) errors.lastName = "Enter your last name.";
  if (!EMAIL_RE.test(value.email)) errors.email = "Enter a valid email address.";
  if (!PHONE_RE.test(value.phone)) errors.phone = "Enter a contact number we can reach you on.";

  if (!APPOINTMENT_TYPES.includes(value.appointmentType as (typeof APPOINTMENT_TYPES)[number])) {
    errors.appointmentType = "Choose the kind of appointment you want.";
  }

  if (value.interest && !INTERESTS.includes(value.interest as (typeof INTERESTS)[number])) {
    errors.interest = "Choose one of the listed options.";
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.date)) {
    errors.date = "Choose a date for your appointment.";
  } else if (value.date < todayInManila()) {
    errors.date = "Pick a date that has not already passed.";
  } else if (value.date > maxBookingDate()) {
    errors.date = `We only take bookings ${BOOKING_WINDOW_DAYS} days ahead.`;
  } else if (isClosedDay(value.date)) {
    errors.date = "That date is not available.";
  }

  if (!TIME_SLOTS.some((slot) => slot.value === value.time)) {
    errors.time = "Choose a time slot.";
  }

  return { errors, value };
}

export const slotLabel = (time: string) =>
  TIME_SLOTS.find((s) => s.value === time)?.label ?? time;

export const prettyDate = (iso: string) =>
  new Intl.DateTimeFormat("en-PH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Manila",
  }).format(new Date(`${iso}T12:00:00Z`));
