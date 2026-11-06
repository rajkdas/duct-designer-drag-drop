# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.1] - 2026-11-06

### Added
- **Realistic 3D view** — lazy-loaded Three.js scene (client-only code-split chunk):
  PBR metal ducts with flange rings, ribbed flex hoses, machine bodies, room shell
  with windows and ceiling beams, PCF soft shadows, environment lighting and ACES
  tone mapping; orbit controls. The scene graph rebuilds from the plan store, so
  2D and 3D stay in sync on every place / move / rotate / height change.
- **CAD-grade 2D plan rendering** — graph-paper grid, double-line walls with poché
  and double-leaf door swing, engineering dimension lines with arrowheads,
  double-line duct channels with flange ticks, blue joint dots and take-off
  markers, light-blue machine plates with schematic internals and labels.
- Dependency `three` (dynamic import) + `@types/three` (dev).

### Changed
- View header chips and zoom/fit controls are owned solely by the workspace shell;
  canvas components no longer render their own overlays.
- README features, requirements, tech-stack and architecture updated for the
  WebGL 3D view; Vercel install-command note for lockfile-free dependency adds.

### Fixed
- Doubled "2D – Grundriss" / "3D – Ansicht" chips and duplicated zoom stacks
  (rendered by both the workspace shell and the canvas components).

[0.3.1]: https://github.com/rajkdas/duct-designer-drag-drop/releases/tag/v0.3.1

## [0.3.0] - 2026-11-06

### Changed
- **Design overhaul to match the BIMA reference design**: light CAD-style workspace with white cards, hairline borders and soft shadows; BIMA royal-blue (#0b33d5) replaces orange as the default brand colour (dealer white-label colours still override).
- Two-row app chrome: header with text logo (BIMA DuctDesigner) + project name + Save / Share / Export / Request quote, and a toolbar with Parts / Project tabs, selection tool buttons (rotate, duplicate, remove, clear) and 2D / 3D view pills.
- 2D + 3D shown side by side as two rounded cards with header chips (default view is now split); stacked round zoom / fit buttons on the plan card.
- Engineering dimension lines ("18.00 m" / "12.00 m") with arrowheads, workshop walls with a door opening, and blue connection joints on the plan.
- Steel-gradient part rendering with specular highlight on pipes (plan, iso and palette thumbnails).
- Parts catalogue restructured into collapsible category rows with thumbnails and part counts; search flattens across categories.
- Properties panel rebuilt as label/value form rows with a part header (thumbnail + price badge); new Calculation tab with live totals; new Project tab (left) with name / customer / room size.
- Bill of materials moved to a bottom bar: tabbed table (Parts list / Positions / Project info) with Pos / Article / Description / Diameter / Qty / Unit price / Total columns plus a totals card with the gross total in brand blue; compact column set in the share-view sidebar.
- Landing page: text logo, outline feature icon tiles, blue accent.

### Fixed
- Lint errors that failed the GitHub Actions workflow (`react-hooks/set-state-in-effect` in admin panels, carousel and `use-mobile`; ref access during render in the builder) — `npm run lint` is now clean.
- TypeScript errors surfaced by a strict `tsc --noEmit` pass (QuoteDTO `designShareId`, `PartGeo` category unions across palette / canvas / store).

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

[0.3.0]: https://github.com/rajkdas/duct-designer-drag-drop/releases/tag/v0.3.0
[0.2.1]: https://github.com/rajkdas/bima-ductdesigner/releases/tag/v0.2.1
