# BIMA DuctDesigner — white-label duct configurator

Browser-based dust-extraction planner for woodworking shops: drag pipes and fittings
onto a scaled floor plan, get a live-priced bill of materials from the product
catalogue, send quote requests and share designs via link. Machine dealers can embed
the planner on their own sites (white-label) for a monthly licence.

**Live views (single-page app, everything runs on `/`):**

| View | URL |
| --- | --- |
| Landing page | `/` |
| Planner | `/?app=builder` |
| Shared design (read-only, live prices) | `/?design=<shareId>` · example: `/?design=demo` |
| Dealer embed (chrome-less, branded) | `/?embed=1&dealer=<slug>` |
| Admin panel | `/?admin=1` (password from `ADMIN_PASSWORD`, default `admin123`) |
| Operator documentation | `/?docs=1` |
| Embed loader script | `/embed.js` |

## What's inside

- **2D plan editor** (`src/components/builder/PlanCanvas.tsx`) — SVG canvas, pan/zoom
  (wheel + pinch), drag-from-palette placement, 0.25 m grid, **port snapping**
  (green = flow-aligned), rotation handles, keyboard shortcuts (R / D / Del / Esc).
- **Isometric 3D preview** (`IsoView.tsx`) — lightweight projected schematic incl.
  installation heights and flex drops (no WebGL, fast on any device).
- **Live BOM** (`BomPanel.tsx` + `src/lib/types.ts`) — aggregates placed parts by
  SKU, prices from the products table, net / VAT / gross totals.
- **Products & WooCommerce sync** — `src/lib/woocommerce.ts` imports products by SKU
  from WooCommerce REST (`WOO_*` env vars, see docs). Geometry (Ø, length, angle)
  comes from product attributes; the sync is one click in the admin panel.
- **Designs & quotes** — anonymous save with short share IDs (`POST /api/designs`),
  read-only share view re-priced at open time, quote requests stored and managed in
  the admin panel (`POST /api/quotes`).
- **Dealers & white-label** — admin-managed licences (fee, brand colour, status),
  embed via `/embed.js` snippet or iframe, optional sub-domain routing
  (`src/middleware.ts` + `ROOT_DOMAIN`).
- **Admin panel** (`src/components/admin/`) — dashboard with MRR, dealers, products
  (inline price editing), quotes workflow, shop settings (VAT, currency, branding).

## Stack

Next.js 16 (App Router, single route) · TypeScript · Tailwind CSS 4 · shadcn/ui ·
Prisma + SQLite · Zustand · jsPDF (client-side PDF export) · sonner (toasts).

## Quick start (local)

```bash
npm install
npm run dev        # http://localhost:3000
```

The database seeds itself on the first API call (products, settings, demo dealers,
demo design with a complete 18 × 12 m layout). If `DATABASE_URL` is not set, a
database file in `/tmp/ductdesigner.db` is created and bootstrapped automatically.

## Deploying to Vercel

1. Push this folder to a GitHub repository (or use the `vercel` CLI).
2. Import the repo on vercel.com — the Next.js settings are detected automatically.
3. Add two environment variables in the Vercel dashboard:
   - `ADMIN_PASSWORD` — your admin panel password (default fallback: `admin123`)
   - `ADMIN_SECRET` — any long random text (used to sign the admin session cookie)
4. Deploy. On the first page/API call the app creates its tables and demo data by
   itself — no database setup is needed.

**Note on demo mode:** Vercel serverless functions cannot keep files permanently.
The demo uses a temporary database in `/tmp`, so saved designs, price edits and
quote requests are reset whenever the server instance restarts (after idling or a
new deployment). Built-in demo data (catalogue, demo design `/?design=demo`) always
comes back automatically. For permanent storage, connect a hosted database such as
Turso (SQLite-compatible) and point `DATABASE_URL` at it.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | no | SQLite file location. Default on Vercel: `file:/tmp/ductdesigner.db` |
| `ADMIN_PASSWORD` | recommended | Admin panel password (default fallback: `admin123`) |
| `ADMIN_SECRET` | recommended | Random string used to sign the admin session cookie |
| `WOO_STORE_URL` / `WOO_CONSUMER_KEY` / `WOO_CONSUMER_SECRET` | optional | Enables WooCommerce product sync |
| `ROOT_DOMAIN` | optional | Enables dealer sub-domains (needs wildcard DNS) |

## Local development

```bash
npm install
npm run dev        # http://localhost:3000
npm run lint       # eslint
npm run db:push    # apply prisma/schema.prisma changes
npx tsx scripts/reseed-demo.ts   # rebuild the demo design after seed changes
```

## Project layout

```
prisma/schema.prisma        Product, Dealer, Design, QuoteRequest, Settings
src/lib/                    geometry engine, store, BOM, seed, schema bootstrap, woo sync, pdf
src/components/builder/     planner UI (canvas, palette, panels, dialogs)
src/components/admin/       admin panel
src/components/share/       read-only share view
src/components/landing/     marketing page
src/components/docs/        operator documentation
src/app/api/                REST endpoints (products, designs, quotes, dealers, …)
public/embed.js             dealer embed loader
scripts/reseed-demo.ts      demo data helper
```
