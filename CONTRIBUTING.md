# Contributing to BIMA DuctDesigner

Thanks for your interest in improving BIMA DuctDesigner — a browser-based
dust-extraction planner built with Next.js 16, TypeScript, Prisma/SQLite and
Tailwind CSS 4.

## Getting started (local dev)

```bash
git clone https://github.com/rajkdas/bima-ductdesigner.git
cd bima-ductdesigner
npm install          # postinstall runs prisma generate
cp .env.example .env # adjust ADMIN_PASSWORD / ADMIN_SECRET for local testing
npm run dev          # http://localhost:3000
```

The SQLite database bootstraps itself on the first API call (tables + 71 demo
products + demo dealers + sample design). To pre-create it explicitly:

```bash
npm run db:push
```

## Before you open a PR

Run all three locally; CI runs the same checks on Node 20 and 22:

```bash
npm run lint         # ESLint (eslint-config-next)
npx tsc --noEmit     # full type-check
npm run build        # next build
```

If you change the demo seed data, regenerate the sample design:

```bash
npx tsx scripts/reseed-demo.ts
```

## Code style

- TypeScript strict mode; avoid `any` in new code.
- [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`,
  `docs:`, `chore:`).
- Planner geometry lives in `src/lib/` — keep canvas components thin and put
  math where it can be unit-tested.
- Prices are stored as integers (cents) — never floats.
- All shop-facing strings are English; German market terms appear only in the
  seed catalogue where they match real product names.

## Areas that especially welcome PRs

- Geometry engine: collision checks, auto-routing, flow-direction validation.
- BOM logic: discount rules, cutting optimization for fixed pipe lengths.
- White-label theming: more CSS-variable hooks for dealer branding.
- Documentation: `/?docs=1` content and `docs/DEPLOY-VERCEL.md`.

## Reporting bugs

Open a [GitHub issue](https://github.com/rajkdas/bima-ductdesigner/issues) with
the view URL (`/?app=builder`, `/?admin=1`, …), expected vs. actual behaviour,
and the browser/OS. Security issues go through
[SECURITY.md](SECURITY.md), not public issues.
