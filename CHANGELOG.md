# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.1] - 2026-11-06

### Added
- Browser-based dust-extraction planner: scaled SVG plan canvas (0.25 m grid,
  pan/zoom, drag-from-palette, rotation handles, keyboard shortcuts) with
  port snapping that only joins matching, flow-aligned ports.
- Live priced bill of materials: per-SKU rollup of placed parts, net / VAT /
  gross totals, one-click client-side PDF export (jsPDF).
- Isometric 3D preview (projected schematic, no WebGL) with installation
  heights and flex drops.
- Designs with short share IDs; read-only share view re-prices the BOM at
  open time; built-in sample layout at `/?design=demo` (18 × 12 m workshop).
- Quote requests stored via `/api/quotes` and managed in the admin pipeline
  (new → in touch → offered → won / lost).
- White-label dealer system: admin-managed licences (fee, brand colour,
  status), embed via `/embed.js` loader or iframe, optional sub-domain
  routing through `middleware.ts` + `ROOT_DOMAIN`.
- WooCommerce product sync by SKU (REST v3): price from the shop, geometry
  (Ø, length, angle) from product attributes.
- Admin panel (`/?admin=1`): dashboard with MRR and open quotes, dealer
  licences, inline product price editing, shop settings (VAT, currency,
  branding); session cookie signed with `ADMIN_SECRET`.
- Operator documentation at `/?docs=1`.
- Runtime database bootstrap: tables are created and 71 demo products, demo
  dealers and the sample design are seeded on first request — Vercel-deployable
  with no database setup (demo mode uses `file:/tmp/ductdesigner.db`).
- Brand assets: neon duct-elbow favicon (favicon.ico / icon.svg / apple-icon),
  `.github/assets/banner.png`.
- CI (GitHub Actions): lint, type-check and build on Node 20 and 22.
- Vercel deployment guide: `docs/DEPLOY-VERCEL.md`.

### Changed
- `package.json` builds a standard Vercel target (standalone output removed);
  `postinstall` runs `prisma generate`.
- `DATABASE_URL` is resolved at runtime and passed to Prisma explicitly, with
  a `/tmp` fallback for serverless environments.

[0.2.1]: https://github.com/rajkdas/bima-ductdesigner/releases/tag/v0.2.1
