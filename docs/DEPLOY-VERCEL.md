# Deploying BIMA DuctDesigner to Vercel

Step-by-step deployment guide. The repo is a standard **Next.js 16** application —
no custom Vercel settings are needed, and the database bootstraps itself on the
first request. Total time: **about 10 minutes**.

## Prerequisites

- A [GitHub](https://github.com) account (free) — for the Git-based workflow
- A [Vercel](https://vercel.com) account (free Hobby plan is enough) — sign in with GitHub
- The two admin secrets you want to use:
  - `ADMIN_PASSWORD` — the password for the admin panel (`/?admin=1`)
  - `ADMIN_SECRET` — any long random string (signs the admin session cookie)

Generate a good secret in one line:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Method A — GitHub import (recommended)

1. **Push this folder to a new GitHub repository**

   ```bash
   cd bima-ductdesigner
   git init
   git add .
   git commit -m "feat: initial release of BIMA DuctDesigner v0.2.1 (Next.js 16 + Prisma)"
   git branch -M main
   git remote add origin https://github.com/<your-username>/bima-ductdesigner.git
   git push -u origin main
   ```

2. **Import on Vercel** — go to [vercel.com/new](https://vercel.com/new), pick the
   repository, and let Vercel detect the framework (Next.js). Leave **Build
   Command** (`npm run build`), **Output Directory**, and **Install Command**
   (`npm install`) at their defaults.

3. **Add environment variables** — under *Environment Variables* add:

   | Key | Value | Required |
   | --- | --- | --- |
   | `ADMIN_PASSWORD` | your admin password | yes |
   | `ADMIN_SECRET` | long random string | yes |
   | `DATABASE_URL` | leave unset for demo mode | no |
   | `WOO_STORE_URL` / `WOO_CONSUMER_KEY` / `WOO_CONSUMER_SECRET` | WooCommerce REST credentials | no |
   | `ROOT_DOMAIN` | `duct.your-domain.com` (wildcard DNS needed) | no |

4. **Deploy** — the build takes 1–2 minutes. Open the URL Vercel gives you.

5. **First request** — the first page or API call creates the SQLite tables and
   seeds 71 demo products, demo dealers, and the sample design. This takes a few
   seconds; reload once afterwards.

## Method B — Vercel CLI

```bash
npm i -g vercel
cd bima-ductdesigner
vercel                 # link the project (accept the defaults)
vercel env add ADMIN_PASSWORD
vercel env add ADMIN_SECRET
vercel --prod          # deploy to production
```

## Post-deploy test checklist

Open each URL on your Vercel domain and confirm:

| # | Check | Expected |
| --- | --- | --- |
| 1 | `/` | Landing page renders, no console errors |
| 2 | `/?app=builder` | Palette on the left, grid canvas, drag a pipe onto the plan |
| 3 | BOM panel | Placed parts listed with prices, totals update live |
| 4 | Save | Short share ID appears, copy the `/?design=…` link |
| 5 | `/?design=demo` | Sample layout opens, BOM re-priced from the catalogue |
| 6 | `/?docs=1` | Operator documentation renders |
| 7 | `/?admin=1` | Login with `ADMIN_PASSWORD`, dashboard shows stats |
| 8 | `/?embed=1&dealer=holzprofi` | Chrome-less branded embed view |
| 9 | `/embed.js` | Loader script served with `text/javascript` |

## Embedding on a WordPress dealer site

1. In the admin panel create the dealer (slug, brand colour, licence).
2. Give the dealer this snippet, replacing the host:

   ```html
   <div id="bima-ductdesigner"></div>
   <script src="https://your-app.vercel.app/embed.js"
           data-container="bima-ductdesigner"
           data-dealer="holzprofi"></script>
   ```

3. For sites that strip third-party scripts, use the iframe variant from `/?docs=1`.

## Demo mode vs. permanent storage

| | Demo mode (default) | Permanent (`DATABASE_URL` set) |
| --- | --- | --- |
| Database | SQLite file in `/tmp` | Hosted SQLite (e.g. free [Turso](https://turso.tech)) |
| Setup effort | none | create DB, set one variable, redeploy |
| Saved designs / quotes | reset on idle / redeploy | kept |
| Built-in demo data | always re-seeded automatically | seeded once on first request |

The runtime bootstrap (schema creation + seeding) works identically for both —
switching to Turso later needs **no code changes**, just the `DATABASE_URL`.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Build fails with Prisma errors | Environment changed mid-build | Redeploy; check that no custom Build Command overrides `npm run build` |
| Catalogue stays empty | First-request bootstrap failed | Check Vercel function logs (`Runtime Logs`); redeploy |
| Admin login always rejected | Env var typo or stale deployment | Fix `ADMIN_PASSWORD`, wait for redeploy to finish |
| Share link shows 404 | Design saved in a reset `/tmp` DB | Expected in demo mode after a reset; save again, or switch to Turso |
| Quote requests not stored | Same as above | Same fix |
| WooCommerce sync empty | Wrong URL or read-only keys rejected | Store URL must start with `https://`; keys need read access; products match by SKU |
| Embed blank on WordPress | Security plugin or mixed http/https | Load `/embed.js` over https, or use the iframe variant |
| Function timeout on first call | Cold start + bootstrap (rare) | Reload once; bootstrap only runs when tables are missing |

## Updating the app

Push to `main` — Vercel rebuilds and redeploys automatically. Saved data in demo
mode resets on each deployment; with `DATABASE_URL` it survives.
