import { randomBytes, randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { validateBooking, type BookingRecord } from "@/lib/booking";
import { sendBookingEmails } from "@/lib/email";

export const dynamic = "force-dynamic";

const MAX_BODY = 16 * 1024;

/** Per-instance throttle. Behind multiple instances, rate limit at the edge. */
const hits = new Map<string, number[]>();
const LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000;

function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= LIMIT) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

function reference() {
  const stamp = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  return `DFB-${stamp}-${randomBytes(2).toString("hex").toUpperCase()}`;
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: { message: "Too many booking attempts. Please try again shortly." } },
      { status: 429 },
    );
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY) {
    return NextResponse.json({ error: { message: "Request too large." } }, { status: 413 });
  }

  let body: Record<string, unknown>;
  try {
    const parsed = JSON.parse(raw || "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: { message: "Invalid request body." } }, { status: 400 });
  }

  // Honeypot: a real person never fills a hidden field.
  if (typeof body.company === "string" && body.company.trim() !== "") {
    return NextResponse.json({ reference: reference(), emailed: true }, { status: 201 });
  }

  const { errors, value } = validateBooking(body);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json(
      { error: { message: "Some details need attention.", details: errors } },
      { status: 422 },
    );
  }

  const booking: BookingRecord = {
    ...value,
    reference: reference(),
    createdAt: new Date().toISOString(),
  };

  // Logged before delivery is attempted so an email outage cannot lose the lead.
  console.log(
    `[booking] ${booking.reference} id=${randomUUID()} ${booking.email} ${booking.date} ${booking.time} (${booking.appointmentType})`,
  );

  const delivery = await sendBookingEmails(booking);

  return NextResponse.json(
    {
      reference: booking.reference,
      date: booking.date,
      time: booking.time,
      appointmentType: booking.appointmentType,
      emailed: delivery.sent,
      ...(delivery.sent ? {} : { emailNote: delivery.reason }),
    },
    { status: 201 },
  );
}
