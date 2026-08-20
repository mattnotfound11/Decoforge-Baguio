/**
 * Booking notifications.
 *
 * Two messages go out per booking: an alert to the team inbox and a
 * confirmation to the customer. If RESEND_API_KEY is unset the booking still
 * succeeds — it is recorded and the caller is told email was not configured,
 * so a missing key can never lose an enquiry.
 */
import { Resend } from "resend";
import { prettyDate, slotLabel, type BookingRecord } from "./booking";
import { site } from "./site";

export interface DeliveryResult {
  sent: boolean;
  reason?: string;
}

const FROM = process.env.BOOKING_FROM_EMAIL || "Decoforge <onboarding@resend.dev>";
const NOTIFY = process.env.BOOKING_NOTIFY_EMAIL || site.email;

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const shell = (heading: string, intro: string, rows: [string, string][], footer: string) => `
<div style="background:#fdf6ee;padding:32px 16px;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;color:#171210">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e8e2db">
    <div style="background:#171210;padding:22px 28px">
      <div style="color:#cf5119;font-size:22px;font-weight:800;letter-spacing:-0.04em">Decoforge</div>
    </div>
    <div style="padding:28px">
      <h1 style="margin:0 0 10px;font-size:22px;letter-spacing:-0.02em">${esc(heading)}</h1>
      <p style="margin:0 0 22px;font-size:15px;line-height:1.6;color:#6f645c">${esc(intro)}</p>
      <table style="width:100%;border-collapse:collapse;font-size:15px">
        ${rows
          .map(
            ([k, v]) => `<tr>
              <td style="padding:9px 0;color:#6f645c;width:38%;vertical-align:top">${esc(k)}</td>
              <td style="padding:9px 0;font-weight:600;vertical-align:top">${esc(v)}</td>
            </tr>`,
          )
          .join("")}
      </table>
      <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#6f645c;border-top:1px solid #e8e2db;padding-top:16px">${esc(footer)}</p>
    </div>
  </div>
</div>`;

export async function sendBookingEmails(booking: BookingRecord): Promise<DeliveryResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(`[booking ${booking.reference}] RESEND_API_KEY unset — email not sent`);
    return { sent: false, reason: "RESEND_API_KEY is not configured" };
  }

  const resend = new Resend(apiKey);
  const name = `${booking.firstName} ${booking.lastName}`;
  const when = `${prettyDate(booking.date)} at ${slotLabel(booking.time)}`;

  const rows: [string, string][] = [
    ["Reference", booking.reference],
    ["Name", name],
    ["Email", booking.email],
    ["Phone", booking.phone],
    ["Appointment", booking.appointmentType],
    ["When", when],
    ["Interested in", booking.interest || "Not specified"],
    ["Details", booking.details || "—"],
  ];

  try {
    const [team, customer] = await Promise.all([
      resend.emails.send({
        from: FROM,
        to: NOTIFY,
        replyTo: booking.email,
        subject: `New booking — ${name} · ${prettyDate(booking.date)} ${slotLabel(booking.time)}`,
        html: shell(
          "New appointment request",
          `${name} booked a ${booking.appointmentType.toLowerCase()}. Reply to this email to reach them directly.`,
          rows,
          `Sent automatically by the Decoforge website.`,
        ),
      }),
      resend.emails.send({
        from: FROM,
        to: booking.email,
        subject: `Your Decoforge appointment — ${prettyDate(booking.date)}`,
        html: shell(
          "We have your booking",
          `Thanks ${booking.firstName}. Our team will confirm this slot by email within one business day.`,
          [
            ["Reference", booking.reference],
            ["Appointment", booking.appointmentType],
            ["When", when],
            ["Showroom", `${site.showroom.line1}, ${site.showroom.line2}`],
            ["Questions?", `${site.phone} · ${site.email}`],
          ],
          `If you need to move this appointment, reply to this email with your reference.`,
        ),
      }),
    ]);

    if (team.error || customer.error) {
      const reason = team.error?.message || customer.error?.message || "unknown Resend error";
      console.error(`[booking ${booking.reference}] resend error: ${reason}`);
      return { sent: false, reason };
    }

    return { sent: true };
  } catch (err) {
    const reason = err instanceof Error ? err.message : "unknown error";
    console.error(`[booking ${booking.reference}] email failed: ${reason}`);
    return { sent: false, reason };
  }
}
