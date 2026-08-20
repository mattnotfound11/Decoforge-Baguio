# Decoforge Baguio

A small full-stack web app for a custom furniture and decor workshop in Baguio
City: a public catalog, a quote-request flow, and a staff-only pipeline for the
requests that come in.

No dependencies, no build step. `backend/` is a Node.js HTTP server; `frontend/`
is plain HTML, CSS, and ES modules that the backend also serves.

## Layout

```
.
├── backend/
│   ├── package.json          scripts and engine range — nothing to install
│   ├── .env.example          every setting, with comments
│   ├── data/                 db.json, created on first boot (gitignored)
│   ├── src/
│   │   ├── server.js         entry point: listen, shut down cleanly
│   │   ├── app.js            route table, headers, one error funnel
│   │   ├── config.js         environment with defaults
│   │   ├── logger.js
│   │   ├── db/
│   │   │   ├── seed.js       catalog seed, categories, statuses
│   │   │   └── store.js      the JSON store and its atomic writes
│   │   ├── lib/
│   │   │   ├── auth.js       constant-time bearer token check
│   │   │   ├── http.js       send / fail / capped body reader
│   │   │   ├── rate-limit.js in-memory sliding window
│   │   │   ├── static.js     static files with traversal guards
│   │   │   └── validate.js   input cleaning, quote validation
│   │   └── routes/
│   │       ├── meta.routes.js
│   │       ├── products.routes.js
│   │       └── quotes.routes.js
│   └── test/
│       └── api.test.js       end-to-end tests against a real listener
├── frontend/
│   ├── index.html            the only page
│   ├── assets/favicon.svg
│   ├── css/
│   │   ├── tokens.css        color and type tokens, light and dark
│   │   └── styles.css        everything else
│   └── js/
│       ├── main.js           boot and event wiring
│       ├── api.js            fetch wrapper, typed errors
│       ├── state.js          shared state, cart, tiny pub/sub
│       ├── ui.js             DOM builder, money and date formatting
│       ├── catalog.js        chips, grid, filtered fetches
│       ├── quote.js          quote drawer, form, receipt
│       └── admin.js          staff dialog
├── README.md
└── .gitignore
```

## Requirements

Node.js 18.17 or newer. Nothing else — no `npm install`, no database server, no
bundler. Storage is a JSON file the server writes itself.

## Running it

```bash
cd backend
npm start          # or: node src/server.js
```

Open <http://127.0.0.1:3000>. The backend serves `frontend/` directly, so there
is no second dev server and no CORS setup for local work.

On first boot the server creates `backend/data/db.json` and seeds it with ten
catalog pieces. Delete that file (or run `npm run reset`) to start over.

| Script | What it does |
| --- | --- |
| `npm start` | Run the server |
| `npm run dev` | Same, with `--watch` for reload on save |
| `npm test` | End-to-end tests against a listener on an ephemeral port |
| `npm run reset` | Delete `data/` so the catalog reseeds |

### Configuration

Everything comes from the environment, with development-friendly defaults. See
[`backend/.env.example`](backend/.env.example).

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | Port to listen on |
| `HOST` | `127.0.0.1` | Bind address — `0.0.0.0` to accept LAN traffic |
| `ADMIN_TOKEN` | `decoforge-dev-token` | Bearer token for the staff endpoints |
| `CORS_ORIGIN` | `*` | Value for `Access-Control-Allow-Origin` |
| `DATA_DIR` | `backend/data` | Where `db.json` lives |
| `PUBLIC_DIR` | `frontend/` | Directory served as static files |

```bash
PORT=8080 ADMIN_TOKEN="$(openssl rand -hex 24)" node src/server.js
```

**Set `ADMIN_TOKEN` before this runs anywhere but your laptop.** The server logs
a warning at startup while the development default is in place, precisely so it
is hard to leave there by accident.

## The frontend

Seven ES modules loaded natively by the browser — no framework, no bundler, no
external assets. Product imagery is a gradient derived from each piece's accent
color, so the page renders offline and under a strict content policy.

- Catalog grid with category chips, debounced search, and sorting, all executed
  server-side through `/api/products`
- A quote list (the shopping-cart analogue) that survives a reload via
  `localStorage`, with quantity controls and a running indicative subtotal
- A quote form that paints server-side validation errors onto the individual
  fields that failed
- A staff dialog behind the footer's "Staff sign-in" link for reading the
  pipeline and moving quotes between statuses
- Light and dark themes from `prefers-color-scheme`, keyboard-reachable dialogs,
  visible focus rings, and a reduced-motion path

`catalog.js` and `quote.js` never import each other. Both subscribe to a `cart`
event on `state.js`, which is what keeps the card buttons, the header badge, and
the drawer in agreement.

## API

All responses are JSON. Errors take the shape:

```json
{ "error": { "status": 422, "message": "Some fields need attention.",
             "details": { "email": "Enter a valid email address." } } }
```

### Public

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/api/health` | Uptime and record counts |
| `GET` | `/api/meta` | Categories, project types, budget ranges, statuses |
| `GET` | `/api/products` | `?category=&search=&maxPrice=&sort=` |
| `GET` | `/api/products/:id` | One product plus up to three related pieces |
| `POST` | `/api/quotes` | Submit a quote request |

`sort` takes `price-asc`, `price-desc`, `lead-time`, or `name`; the default puts
featured pieces first. `search` matches names, descriptions, and materials.

```bash
curl 'http://127.0.0.1:3000/api/products?category=lighting&sort=price-asc'

curl -X POST http://127.0.0.1:3000/api/quotes \
  -H 'Content-Type: application/json' \
  -d '{
        "name": "Marites Bautista",
        "email": "marites@example.com",
        "phone": "+63 917 555 0123",
        "projectType": "Full room",
        "message": "Dining set for a 20 sqm room in Camp 7, narra if possible.",
        "items": [{ "productId": "p-cordillera-dining-table", "quantity": 1 }]
      }'
```

A successful submission returns a reference like `DFB-260820-4F1A`, the
indicative subtotal, and a lead time taken from the slowest item on the list.
Either catalog items or a written description is enough; neither is required if
the other is present.

### Staff

Send `Authorization: Bearer $ADMIN_TOKEN`.

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/api/quotes` | `?status=new\|reviewing\|quoted\|won\|closed\|all` |
| `PATCH` | `/api/quotes/:id` | Body `{ "status": "quoted" }`; accepts id or reference |

```bash
curl http://127.0.0.1:3000/api/quotes -H 'Authorization: Bearer decoforge-dev-token'
```

## How the backend is put together

A request travels `server.js` → `app.js` → a route module, and every failure
exits through one `catch` in `app.js` that converts an `HttpError` into a JSON
body and logs anything 500-and-above with a stack.

Points worth knowing:

- **The store is one JSON object in memory**, mirrored to `data/db.json`. Writes
  are serialized through a promise chain and land via temp-file-then-rename, so
  a crash mid-write cannot truncate the file. Shutdown awaits pending writes.
- **Prices are never taken from the client.** `validateQuote` looks every line
  item up in the catalog and recomputes the totals; a payload claiming
  `unitPrice: 1` is priced at the real figure. There is a test for this.
- **Rate limits** are 5 quote submissions and 240 API calls per minute per IP,
  swept periodically so the map cannot grow without bound.
- **Static serving** resolves each path and rejects anything landing outside
  `frontend/`, so neither `../` nor an absolute path escapes. Dotfiles are
  refused outright, because tooling has a habit of dropping `.git`, `.env`, and
  state directories into working folders. Weak ETags are served and
  `If-None-Match` answered with a 304.
- **The admin token comparison** uses `crypto.timingSafeEqual`, with a length
  check first because that function throws on mismatched lengths.
- **A known path with the wrong verb returns 405**, not 404 — the route table
  distinguishes the two.

## Tests

```bash
cd backend && npm test
```

Twenty-two tests boot the real app on an ephemeral port with `DATA_DIR` pointed
at a temp folder, then exercise the catalog, quote validation, price tampering,
the rate limit, the staff endpoints, static serving, ETags, path traversal,
dotfile refusal, and malformed JSON.

## Deliberate limits

The shortcuts here are chosen, not overlooked. Before this takes real traffic:

- **The JSON file is not a database.** Fine for hundreds of quotes on one
  process; two processes will clobber each other. Move to SQLite or Postgres
  before scaling out — `db/store.js` is the only file that would change.
- **One shared admin token, no user accounts.** There is no record of which
  staff member changed a status.
- **Rate limits are per process and reset on restart.** Behind a load balancer,
  enforce them at the edge instead.
- **No email is sent.** A submitted quote lands in `db.json` and nowhere else;
  wire a mail provider into `routes/quotes.routes.js`.
- **Plain HTTP by design.** Terminate TLS at nginx, Caddy, or your platform's
  proxy.

## Deploying

Run it behind a reverse proxy and keep the process alive with systemd:

```ini
# /etc/systemd/system/decoforge.service
[Unit]
Description=Decoforge Baguio
After=network.target

[Service]
WorkingDirectory=/srv/decoforge/backend
ExecStart=/usr/bin/node src/server.js
Environment=PORT=3000
Environment=HOST=127.0.0.1
Environment=NODE_ENV=production
Environment=ADMIN_TOKEN=replace-me
Environment=DATA_DIR=/var/lib/decoforge
Restart=always
User=decoforge

[Install]
WantedBy=multi-user.target
```

Back up `db.json` — it is the only stateful thing here, and `.gitignore`
deliberately keeps it out of the repository.

## License

MIT.
