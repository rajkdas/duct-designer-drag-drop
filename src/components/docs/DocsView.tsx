'use client'

import { Fan, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

// ---------------------------------------------------------------------------
// Operator documentation: products, prices, dealers, embedding, WooCommerce,
// maintenance and the delivery roadmap. Shown at /?docs=1.
// ---------------------------------------------------------------------------

const NAV = [
  ['overview', 'Overview'],
  ['quickstart', 'Quick start'],
  ['products', 'Products & prices'],
  ['woocommerce', 'WooCommerce sync'],
  ['dealers', 'Dealers & embedding'],
  ['quotes', 'Quotes & sharing'],
  ['maintenance', 'Maintenance'],
  ['roadmap', 'Roadmap & milestones'],
] as const

export function DocsView() {
  return (
    <div className="flex min-h-dvh flex-col bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-white">
              <Fan className="h-4.5 w-4.5" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold text-slate-800">DuctDesigner Documentation</p>
              <p className="text-[10px] text-slate-400">Operating & maintenance manual</p>
            </div>
          </div>
          <div className="ml-auto flex gap-2">
            <a href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back
              </Button>
            </a>
            <a href="/?admin=1">
              <Button size="sm">Open admin panel</Button>
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-8 px-4 py-6 lg:py-10">
        <nav className="sticky top-20 hidden h-fit w-56 shrink-0 flex-col gap-0.5 text-sm lg:flex" aria-label="Documentation sections">
          {NAV.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="rounded-lg px-3 py-1.5 font-medium text-slate-500 transition hover:bg-white hover:text-slate-800">
              {label}
            </a>
          ))}
        </nav>

        <main className="min-w-0 flex-1 space-y-10 pb-16">
          <Section id="overview" title="Overview">
            <P>
              BIMA DuctDesigner is a browser-based configurator for dust-extraction systems. Customers drag pipes and fittings onto a
              scaled workshop plan, the bill of materials prices itself from the live catalogue, and the result is sent as a quote
              request or shared via link. Machine dealers can embed the same tool on their own websites as a white-label version for a
              monthly licence.
            </P>
            <P>
              This deployment is a fully working reference implementation: a Next.js app with a SQLite database (Prisma), a client-side
              2D editor with port snapping, an isometric 3D preview, PDF/JSON export, quote storage and an admin panel. It is prepared
              to run on your hosting; the catalogue is seeded with demo prices that you overwrite with your own data via the admin panel
              or the WooCommerce sync.
            </P>
            <Card title="The pieces at a glance">
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-600">
                <li><B>Planner</B> — <Code>/?app=builder</Code> — the drag &amp; drop editor (desktop &amp; touch).</li>
                <li><B>Share view</B> — <Code>/?design=&lt;id&gt;</Code> — read-only layout + freshly priced BOM.</li>
                <li><B>Embed</B> — <Code>/?embed=1&amp;dealer=&lt;slug&gt;</Code> — chrome-less planner for dealer sites.</li>
                <li><B>Admin</B> — <Code>/?admin=1</Code> — dealers, products, quotes, settings.</li>
                <li><B>API</B> — <Code>/api/*</Code> — products, designs, quotes, dealers, settings, WooCommerce sync.</li>
              </ul>
            </Card>
          </Section>

          <Section id="quickstart" title="Quick start">
            <Steps
              steps={[
                ['Try the demo', 'Open /?design=demo to see a complete 18 × 12 m workshop, then click “Open in planner” to edit it.'],
                ['Plan a layout', 'Open /?app=builder. Set the room size, drag machines from the library, then chain the collector → reducer → pipes → Y-branches → gates → flex hoses.'],
                ['Save & share', 'Press Save (or Ctrl/Cmd+S), then “Share link”. The link opens read-only for customers, or in the editor with “?app=builder&design=…”.'],
                ['Request a quote', 'The quote button sends layout + BOM + contact details to the admin panel (and, once configured, to your inbox).'],
                ['Administer', 'Open /?admin=1 (demo password admin123 — change immediately in .env) and explore dealers, products, quotes and settings.'],
              ]}
            />
            <Card title="Keyboard & touch">
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-600">
                <li><Kbd>R</Kbd> / <Kbd>Shift+R</Kbd> — rotate the selected part ±22.5° (also drag the round handle, hold Shift for 1° steps).</li>
                <li><Kbd>D</Kbd> duplicate · <Kbd>Del</Kbd> remove · <Kbd>Esc</Kbd> deselect / cancel placement.</li>
                <li>Wheel or pinch to zoom, drag empty space to pan, “fit” button to recentre.</li>
                <li>Parts magnetise: drop a pipe end near another part’s port (green = flow-aligned).</li>
              </ul>
            </Card>
          </Section>

          <Section id="products" title="Products & prices">
            <P>
              Everything the planner can price lives in the products table. Each part has a SKU, name, description, price, stock and
              geometry fields (diameter, second diameter, length, angle, branch angle). Geometry controls how the part is drawn and
              where its connection ports sit — the category decides the drawing style:
            </P>
            <Card title="Categories">
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-600">
                <li><B>PIPE</B> — straight pipe, draw length from “Length mm”.</li>
                <li><B>BEND</B> — arc with “Angle °” (90/45/30/22.5), radius = 1.5 × D.</li>
                <li><B>YBRANCH / TBRANCH</B> — main run with a take-off at “Branch angle °”, branch Ø from “Second Ø”.</li>
                <li><B>REDUCER</B> — taper from Ø to “Second Ø”.</li>
                <li><B>GATE, COUPLING, CAP, FLEX, HOOD</B> — blast gate, socket, end cap, flexible hose (sawtooth), machine hood.</li>
                <li><B>UNIT</B> — dust collector units (priced products with a fixed footprint).</li>
                <li><B>Machines</B> are not products — they are free layout aids shipped with the app.</li>
              </ul>
            </Card>
            <P>
              To change a price: admin → Products &amp; prices → type the new price in the row and click elsewhere (saves instantly).
              Use the pencil icon to edit geometry or the switch to hide a product from the planner. “Add product” creates new SKUs;
              SKU and geometry can follow your own naming scheme (e.g. <Code>R-200-1000</Code>).
            </P>
          </Section>

          <Section id="woocommerce" title="WooCommerce sync">
            <P>
              The catalogue can be imported from your WooCommerce shop so prices and names are always identical to the shop. Syncing
              matches products by <B>SKU</B> — parts without a SKU or price are skipped.
            </P>
            <Steps
              steps={[
                ['Create API keys', 'In WordPress: WooCommerce → Settings → Advanced → REST API → “Add key”. Permissions: Read. Copy the consumer key (ck_…) and secret (cs_…).'],
                ['Configure the app', `Add to the .env file on the server:\nWOO_STORE_URL=https://your-shop.com\nWOO_CONSUMER_KEY=ck_xxx\nWOO_CONSUMER_SECRET=cs_xxx\nthen restart the app.`],
                ['Run the sync', 'Admin → Products & prices → “Sync from WooCommerce”. Created/updated counts appear at the top.'],
                ['Check geometry', 'The sync guesses category from product/category names and reads Ø/length/angle from product attributes named “durchmesser/diameter”, “länge/length”, “winkel/angle”, “abgang/branch”. Anything it cannot parse keeps its current geometry — review new SKUs once with the pencil icon.'],
              ]}
            />
            <Card title="Recommended attribute setup in WooCommerce">
              <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 text-[12px] leading-relaxed text-emerald-300">
{`Product: B-200-90 (Bend 90° Ø200)
  Attributes:
    Durchmesser  = 200      → diameterMm
    Winkel       = 90       → angleDeg
Product: R-200-1000 (Straight pipe Ø200)
  Attributes:
    Durchmesser  = 200      → diameterMm
    Länge        = 1000     → lengthMm`}
              </pre>
            </Card>
            <P>
              Run the sync after every price change in the shop (one click), or schedule it — the endpoint is{' '}
              <Code>POST /api/products/sync</Code> with an admin session. Prices in share links are always re-calculated when the link is
              opened, so customers never see stale totals.
            </P>
          </Section>

          <Section id="dealers" title="Dealers, licences & embedding">
            <P>
              Dealers are white-label partners. Each dealer has a slug, a brand colour, a monthly fee and a licence status. Create them
              in admin → Dealers &amp; licences; the “&lt;/&gt;” button shows ready-made embed code.
            </P>
            <Card title="Option A — snippet (recommended)">
              <p className="mb-2 text-sm text-slate-600">The dealer pastes this into any page (works in WordPress “Custom HTML” blocks):</p>
              <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 text-[12px] leading-relaxed text-emerald-300">
{`<div id="duct-designer"></div>
<script
  src="https://CONFIGURATOR-DOMAIN/embed.js"
  data-dealer="dealer-slug"
  data-height="760">
</script>`}
              </pre>
            </Card>
            <Card title="Option B — iframe">
              <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 text-[12px] leading-relaxed text-emerald-300">
{`<iframe
  src="https://CONFIGURATOR-DOMAIN/?embed=1&dealer=dealer-slug"
  style="width:100%;height:760px;border:0"
  title="Dust extraction configurator">
</iframe>`}
              </pre>
            </Card>
            <Card title="Option C — white-label sub-domain">
              <p className="text-sm leading-relaxed text-slate-600">
                Point a DNS record <Code>*.CONFIGURATOR-DOMAIN</Code> (wildcard) at the app server and set{' '}
                <Code>ROOT_DOMAIN=CONFIGURATOR-DOMAIN</Code> in .env. The middleware then serves{' '}
                <Code>dealer.CONFIGURATOR-DOMAIN</Code> as the dealer-branded planner automatically. On typical hosts (Vercel, Netlify,
                a VPS with Caddy/Nginx) add the wildcard certificate once.
              </p>
            </Card>
            <Card title="Licence lifecycle">
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-600">
                <li><B>TRIAL</B> — full function, marked as trial in the admin list (e.g. 30-day trials).</li>
                <li><B>ACTIVE</B> — the embed works; quotes are tagged with the dealer and visible in admin → Quotes.</li>
                <li><B>SUSPENDED</B> — the embed shows a neutral “licence suspended” screen. One click to re-activate after payment.</li>
                <li>The monthly fee is informational — invoicing happens in your accounting tool; the dashboard shows the MRR sum.</li>
              </ul>
            </Card>
          </Section>

          <Section id="quotes" title="Quotes & sharing">
            <P>
              Every design can be saved anonymously — no customer accounts needed. Saving returns a short share ID; the share URL is{' '}
              <Code>https://CONFIGURATOR-DOMAIN/?design=&lt;id&gt;</Code>. Opening it renders the plan read-only with{' '}
              <B>current</B> prices and offers “Open in planner” and “Request quote”. “Share link” copies it to the clipboard.
            </P>
            <P>
              Quote requests store contact details, the design reference and the gross total, and appear in admin → Quote requests with a
              status workflow (New → In progress → Quoted → Closed) and a direct link to the customer’s layout. To receive them by email
              as well, point a webhook/notification at <Code>POST /api/quotes</Code> or connect your SMTP/Resend key where the API route
              marks the TODO in the code (one function, ~10 lines).
            </P>
            <Card title="Exports">
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-600">
                <li><B>PDF</B> — branded parts list with net/VAT/gross totals and the design link (jsPDF, generated in the browser).</li>
                <li><B>JSON</B> — full design (room, items with positions/heights/rotations) plus the BOM — importable for ERP or future features.</li>
              </ul>
            </Card>
          </Section>

          <Section id="maintenance" title="Maintenance">
            <Card title="Daily / weekly">
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-600">
                <li>After shop price changes: admin → Products → “Sync from WooCommerce”.</li>
                <li>Work the quote list (admin → Quote requests) like an inbox.</li>
                <li>Check the dashboard: designs, quotes and licence MRR at a glance.</li>
              </ul>
            </Card>
            <Card title="Server basics">
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-600">
                <li><B>Database</B> — a single SQLite file (<Code>db/custom.db</Code>). Back it up by copying the file (e.g. nightly cron + offsite). Restore = copy back.</li>
                <li><B>Admin password</B> — <Code>ADMIN_PASSWORD</Code> in .env (default admin123). Also set <Code>ADMIN_SECRET</Code> to a random string.</li>
                <li><B>Updates</B> — the app is a standard Next.js project: <Code>npm install &amp;&amp; npm run build &amp;&amp; npm start</Code> (or your host’s deploy button).</li>
                <li><B>Logs</B> — standard Next.js stdout; API errors also surface as toasts in the UI.</li>
              </ul>
            </Card>
            <Card title="Security notes for go-live">
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-600">
                <li>Change the admin password and secret, and put the app behind HTTPS (the embed requires it anyway).</li>
                <li>Consider rate-limiting <Code>POST /api/quotes</Code> and <Code>/api/designs</Code> at the reverse proxy for public launches.</li>
                <li>The share IDs are random 7-character tokens; treat links as semi-public (like shopping lists) — they contain no personal data until a quote is sent.</li>
              </ul>
            </Card>
          </Section>

          <Section id="roadmap" title="Roadmap & milestones">
            <P>
              This prototype already covers the core builder, BOM pricing, sharing, quotes, PDF/JSON export, dealer embedding and the
              admin panel with demo data. The following plan takes it to a production launch on your WordPress site and the first dealer
              sites (indicative effort for one senior developer):
            </P>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] tracking-wide text-slate-400 uppercase">
                    <th className="px-4 py-2.5 font-semibold">Milestone</th>
                    <th className="px-3 py-2.5 font-semibold">Scope</th>
                    <th className="px-4 py-2.5 font-semibold">Effort</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['M1 · Builder MVP', 'This prototype: canvas, snapping, live BOM, save/share, quote dialog, PDF/JSON, admin, embed mechanics', 'delivered in this build'],
                    ['M2 · Live integration', 'Real WooCommerce keys + product import, e-mail notifications for quotes, branding polish against your WordPress theme, deploy to your hosting/sub-domain', '1–2 weeks'],
                    ['M3 · Dealer platform', 'Licence billing runbook (invoices), wildcard sub-domains with SSL, 3–5 pilot dealers onboarded, per-dealer quote routing', '2 weeks'],
                    ['M4 · Launch hardening', 'German/localised UI, mobile polish, analytics (designs, quotes per dealer), security review & rate limits, backup automation', '2 weeks'],
                    ['M5 · Growth (later)', 'Airflow/pressure suggestions per machine, WooCommerce cart hand-off (“order parts”), saved customer accounts, 3D orbit view', 'backlog'],
                  ].map(([m, s, e]) => (
                    <tr key={m} className="border-b border-slate-50 last:border-0 align-top">
                      <td className="px-4 py-3 font-semibold text-slate-700">{m}</td>
                      <td className="px-3 py-3 text-slate-600">{s}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500">{e}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <P>
              Total to production launch: roughly <B>5–6 weeks</B> after this build, with the first dealer pilot possible immediately
              after M2. Everything after M5 is optional and driven by dealer feedback.
            </P>
          </Section>
        </main>
      </div>

      <footer className="mt-auto border-t border-slate-200 bg-white px-4 py-2 text-center text-[11px] text-slate-400">
        BIMA DuctDesigner — operator documentation · keep next to the admin panel
      </footer>
    </div>
  )
}

// --- tiny layout helpers ------------------------------------------------------

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="text-xl font-bold text-slate-800">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm leading-relaxed text-slate-600">{children}</p>
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-2 text-sm font-bold text-slate-700">{title}</h3>
      {children}
    </div>
  )
}

function Steps({ steps }: { steps: [string, string][] }) {
  return (
    <ol className="space-y-2">
      {steps.map(([t, d], i) => (
        <li key={t} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[11px] font-bold text-white">{i + 1}</span>
          <div>
            <p className="text-sm font-semibold text-slate-700">{t}</p>
            <p className="mt-0.5 text-sm leading-relaxed whitespace-pre-line text-slate-500">{d}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

function Code({ children }: { children: React.ReactNode }) {
  return <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[12px] text-slate-700">{children}</code>
}

function B({ children }: { children: React.ReactNode }) {
  return <strong className="font-semibold text-slate-700">{children}</strong>
}

function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="rounded border border-slate-300 bg-slate-50 px-1.5 py-0.5 font-mono text-[11px] text-slate-600">{children}</kbd>
}
