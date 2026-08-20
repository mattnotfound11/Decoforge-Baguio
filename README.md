# Decoforge Baguio

Marketing and booking site for Decoforge Architectural Surfaces — a PVC ceiling,
fluted panel, and WPC decking supplier in Baguio City.

Next.js 16 (App Router) + Tailwind v4, deployed on Vercel.

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
```

```bash
npm run build && npm start   # production build
```

No database and no external services are required to run it. The booking form
and the catalog both work out of the box; adding the environment variables below
turns on email delivery and live inventory.

## Configuration

Copy `.env.example` to `.env.local`. Every variable is optional — the site
degrades honestly without them.

| Variable | Effect when unset |
| --- | --- |
| `RESEND_API_KEY` | Bookings are accepted and logged, but no email is sent. The confirmation screen says so rather than claiming an email is on its way. |
| `BOOKING_FROM_EMAIL` | Falls back to Resend's sandbox sender, which only delivers to the Resend account owner. |
| `BOOKING_NOTIFY_EMAIL` | Team notifications go to the address in `lib/site.ts`. |
| `INVENTORY_URL` | Stock is served from the `baselineStock` values in `lib/materials.ts`. |
| `NEXT_PUBLIC_SITE_URL` | Open Graph URLs fall back to the Vercel domain. |

**To turn on booking emails:** create a key at
[resend.com/api-keys](https://resend.com/api-keys), verify your sending domain,
then set `RESEND_API_KEY` and `BOOKING_FROM_EMAIL` in the Vercel project
settings and redeploy. Until a domain is verified Resend will only deliver to
the email address that owns the account — that is a Resend rule, not a bug here.

## Pages

| Route | What it is |
| --- | --- |
| `/` | Hero, ranges, catalog preview, featured projects, booking, gallery |
| `/catalog` | Filterable, searchable catalog with live stock badges |
| `/catalog/[slug]` | Product detail, specs, pairings, spec-sheet download |
| `/projects` | Featured installations |
| `/contact` | Contact details and the appointment booking form |
| `/privacy`, `/terms`, `/sustainability`, `/careers` | Footer pages |

## How the pieces fit

**Content** lives in `lib/`. `materials.ts` is the catalog — adding a finish
there puts it in the grid, gives it a product page, and generates its spec
sheet, with no other edits. `projects.ts` and `site.ts` hold the projects and
the brand facts (address, phone, hours) that appear in several places.

**Material samples are drawn, not photographed.** `components/material-art.tsx`
renders each finish as an SVG — vertical ribs for fluted panels, grooved boards
for decking, bevelled seams for ceilings — from a four-stop colour ramp per
finish. Stock photography of ribbed panels varies too much in crop and lighting
to sit in a grid together, and these stay crisp at any size with no image
weight. Room photography is real, from Unsplash.

**Stock availability** is polled, not baked in. `/api/stock` is
`force-dynamic` and `no-store`; `lib/use-stock.ts` holds one module-level poller
that every badge on the page subscribes to, so ten cards make one request every
30 seconds. `lib/stock.ts` is the only file that needs to change to read from a
real inventory system — set `INVENTORY_URL` and it already will.

**Bookings** go to `POST /api/bookings`, which validates against
`lib/booking.ts` (Manila-local dates, Sunday closed, five fixed slots, a 90-day
window), logs the booking *before* attempting delivery so an email outage cannot
lose a lead, then sends two messages through Resend: an alert to the team and a
confirmation to the customer. There is a honeypot field and a per-instance rate
limit of five submissions per ten minutes.

## Known limits

- **Bookings are not stored in a database.** They are logged and emailed. If you
  want a queryable history, write to a database in `app/api/bookings/route.ts` —
  it is one call, right after the `console.log`.
- **The rate limit is per serverless instance** and resets on cold start. For
  real protection, put it at the edge (Vercel WAF or middleware backed by KV).
- **Stock is read-only.** Nothing in the app decrements it; it reflects whatever
  `INVENTORY_URL` reports, or the baseline.
- **The legal pages are drafts.** `/privacy` and `/terms` are written for this
  business but have not been reviewed by a lawyer. Get counsel to read them
  before relying on them.

## Deploying

```bash
npx vercel          # preview
npx vercel --prod   # production
```

Set the environment variables in the Vercel dashboard (Project → Settings →
Environment Variables) before the production deploy, or the booking form will
ship without email delivery.
