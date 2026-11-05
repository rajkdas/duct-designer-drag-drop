'use client'

import { useEffect, useState } from 'react'
import type { SettingsDTO } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Fan, MousePointer2, ListOrdered, FileText, Link2, Store, PencilRuler, ArrowRight, ShieldCheck, RefreshCw, BookOpen, Lock } from 'lucide-react'

export function Landing() {
  const [settings, setSettings] = useState<SettingsDTO | null>(null)

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then(setSettings)
      .catch(() => {})
  }, [])

  const brand = settings?.brandColor ?? '#ea580c'

  return (
    <div className="flex min-h-dvh flex-col bg-white" style={{ ['--brand' as string]: brand }}>
      {/* header */}
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-sm" style={{ background: 'var(--brand)' }}>
              <Fan className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold text-slate-800">{settings?.shopName ?? 'BIMA Absaugtechnik'}</p>
              <p className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">DuctDesigner</p>
            </div>
          </div>
          <nav className="ml-auto hidden items-center gap-5 text-sm font-medium text-slate-500 md:flex" aria-label="Main">
            <a href="#features" className="transition hover:text-slate-800">Features</a>
            <a href="#dealers" className="transition hover:text-slate-800">For dealers</a>
            <a href="/?docs=1" className="transition hover:text-slate-800">Documentation</a>
          </nav>
          <div className="ml-auto flex items-center gap-2 md:ml-4">
            <a href="/?admin=1">
              <Button variant="outline" size="sm">
                <Lock className="mr-1.5 h-3.5 w-3.5" /> Admin
              </Button>
            </a>
            <a href="/?app=builder">
              <Button size="sm" className="text-white shadow-sm" style={{ background: 'var(--brand)' }}>
                <PencilRuler className="mr-1.5 h-3.5 w-3.5" /> Open the planner
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_70%_20%,rgba(234,88,12,0.07),transparent)]" aria-hidden />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 lg:grid-cols-2 lg:py-20">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--brand)' }} />
              Plan · Price · Quote — in the browser
            </p>
            <h1 className="mt-4 text-4xl leading-tight font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Design your dust extraction system in <span style={{ color: 'var(--brand)' }}>minutes</span>, not evenings.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-500">
              Drag pipes, bends and take-offs onto your workshop floor plan. The bill of materials prices itself live from our
              catalogue — then send it to us as a quote request or share it with any dealer via link.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="/?app=builder">
                <Button size="lg" className="text-white shadow-md" style={{ background: 'var(--brand)' }}>
                  <PencilRuler className="mr-2 h-4 w-4" /> Start planning — it&apos;s free
                </Button>
              </a>
              <a href="/?design=demo">
                <Button size="lg" variant="outline">
                  See a finished example <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </div>
            <dl className="mt-8 grid max-w-md grid-cols-3 gap-4">
              {[
                ['50+', 'catalogue parts'],
                ['Live', 'prices & stock'],
                ['2D + 3D', 'plan & preview'],
              ].map(([v, l]) => (
                <div key={l}>
                  <dt className="text-lg font-extrabold text-slate-800">{v}</dt>
                  <dd className="text-xs text-slate-400">{l}</dd>
                </div>
              ))}
            </dl>
          </div>
          <HeroArt brand={brand} />
        </div>
      </section>

      {/* features */}
      <section id="features" className="border-t border-slate-100 bg-slate-50/60 py-14">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-bold text-slate-800">Everything the workshop needs</h2>
          <p className="mx-auto mt-2 max-w-lg text-center text-sm text-slate-500">
            Built for joiners and machine dealers — no CAD, no spreadsheets, no PDF price lists from 2019.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: MousePointer2,
                title: 'Drag & drop planning',
                text: 'Straight pipes, 90°/45°/30°/22.5° bends, Y- and T-branches, reducers, blast gates, hoods and flex hoses — with port snapping and a 0.25 m grid.',
              },
              {
                icon: ListOrdered,
                title: 'Live bill of materials',
                text: 'Every placed part lands in the BOM with SKU, description, quantity and the current shop price — VAT included at the bottom line.',
              },
              {
                icon: FileText,
                title: 'Quotes & exports',
                text: 'Send the layout as a quote request in one click, or export the parts list as PDF and the full design as JSON.',
              },
              {
                icon: Link2,
                title: 'Shareable design links',
                text: 'Every design gets a unique URL — customers reopen it read-only with freshly priced parts, dealers open it straight into the editor.',
              },
              {
                icon: RefreshCw,
                title: 'WooCommerce connected',
                text: 'The catalogue syncs from your WooCommerce shop by SKU. Change a price in the shop, sync, and every new quote uses it.',
              },
              {
                icon: Store,
                title: 'Dealer white-label',
                text: 'Partner sites embed the planner with their own colours via snippet or sub-domain — managed with monthly licences.',
              },
            ].map((f) => (
              <article key={f.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ background: 'var(--brand)' }}>
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-3 text-sm font-bold text-slate-800">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{f.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* how it works */}
      <section className="py-14">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-bold text-slate-800">From empty hall to quote in three steps</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ['01', 'Draw the workshop', 'Set the room size, drop in machines as layout aids — table saw, planer, CNC, edge bander and more.'],
              ['02', 'Route the ducting', 'Click a dust collector, then chain pipes and fittings from its outlet to every machine. Ports magnetise.'],
              ['03', 'Send or share', 'Save the design, share the link with a dealer, or send the priced parts list as a quote request.'],
            ].map(([n, t, d]) => (
              <div key={n} className="relative rounded-2xl border border-slate-200 bg-white p-5 pt-8 shadow-sm">
                <span className="absolute -top-4 left-5 flex h-9 w-9 items-center justify-center rounded-xl text-sm font-extrabold text-white shadow-md" style={{ background: 'var(--brand)' }}>
                  {n}
                </span>
                <h3 className="text-sm font-bold text-slate-800">{t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* dealers */}
      <section id="dealers" className="border-t border-slate-100 bg-slate-900 py-14 text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--brand)' }}>
              For machine dealers
            </p>
            <h2 className="mt-2 text-3xl font-bold">Sell extraction systems on your own website</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300">
              Embed the planner on your site with a two-line snippet — branded with your colours. Your customers plan with our
              parts catalogue, and the quote request lands with you. Monthly licence, cancel anytime.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href="/?embed=1&dealer=holzprofi" target="_blank">
                <Button size="lg" className="text-slate-900" style={{ background: 'var(--brand)' }}>
                  <Store className="mr-2 h-4 w-4" /> Preview a dealer embed
                </Button>
              </a>
              <a href="/?docs=1#dealers">
                <Button size="lg" variant="outline" className="border-slate-700 bg-transparent text-slate-200 hover:bg-slate-800 hover:text-white">
                  <BookOpen className="mr-2 h-4 w-4" /> How embedding works
                </Button>
              </a>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase">Embed in 30 seconds</p>
            <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-950 p-4 text-[12px] leading-relaxed text-emerald-300">
{`<div id="duct-designer"></div>
<script
  src="https://app.your-shop.com/embed.js"
  data-dealer="your-slug"
  data-height="760">
</script>`}
            </pre>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              {['Your colours, your name — our catalogue', 'Quotes routed to your inbox', 'Suspend or resize the licence anytime'].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-6 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg text-white" style={{ background: 'var(--brand)' }}>
              <Fan className="h-3.5 w-3.5" />
            </div>
            <span className="font-semibold text-slate-600">{settings?.shopName ?? 'BIMA Absaugtechnik'} DuctDesigner</span>
          </div>
          <nav className="ml-auto flex flex-wrap gap-4" aria-label="Footer">
            <a href="/?app=builder" className="hover:text-slate-600">Planner</a>
            <a href="/?design=demo" className="hover:text-slate-600">Example layout</a>
            <a href="/?docs=1" className="hover:text-slate-600">Documentation</a>
            <a href="/?admin=1" className="hover:text-slate-600">Admin</a>
          </nav>
        </div>
      </footer>
    </div>
  )
}

function HeroArt({ brand }: { brand: string }) {
  // decorative schematic of a duct layout (mirrors the real canvas)
  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3 shadow-xl shadow-slate-200/50">
        <svg viewBox="0 0 560 380" className="w-full rounded-2xl bg-white" role="img" aria-label="Schematic example of a dust extraction layout">
          <defs>
            <pattern id="g" width="28" height="28" patternUnits="userSpaceOnUse">
              <path d="M28 0H0V28" fill="none" stroke="#eef1f4" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="560" height="380" fill="url(#g)" />
          <rect x="24" y="24" width="512" height="332" fill="none" stroke="#cbd5e1" strokeWidth="2" rx="6" />
          {/* machines */}
          {[
            [70, 70, 90, 56, 'Table saw'],
            [70, 170, 72, 50, 'Planer'],
            [220, 70, 104, 88, 'CNC'],
            [70, 262, 116, 44, 'Edge bander'],
          ].map(([x, y, w, h, label]) => (
            <g key={label as string}>
              <rect x={x as number} y={y as number} width={w as number} height={h as number} rx="6" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />
              <text x={(x as number) + (w as number) / 2} y={(y as number) + (h as number) / 2 + 4} textAnchor="middle" fontSize="10" fill="#64748b" fontWeight="600">
                {label as string}
              </text>
            </g>
          ))}
          {/* collector */}
          <g>
            <rect x="428" y="150" width="72" height="60" rx="6" fill="#f1f5f9" stroke="#64748b" strokeWidth="1.5" />
            <circle cx="450" cy="180" r="14" fill="none" stroke={brand} strokeWidth="2.5" />
            <rect x="470" y="162" width="18" height="36" rx="3" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
          </g>
          {/* main duct */}
          <path d="M428 180 H 300 L 262 130 V 96" fill="none" stroke="#94a3b8" strokeWidth="16" strokeLinecap="round" />
          <path d="M428 180 H 300 L 262 130 V 96" fill="none" stroke="#e8edf3" strokeWidth="12" strokeLinecap="round" />
          {/* branch drops */}
          {[
            'M160 96 V 150',
            'M104 220 V 262',
            'M84 126 V 170',
          ].map((d) => (
            <g key={d}>
              <path d={d} fill="none" stroke="#94a3b8" strokeWidth="10" strokeLinecap="round" />
              <path d={d} fill="none" stroke="#e8d5c4" strokeWidth="7" strokeLinecap="round" />
            </g>
          ))}
          {/* connection dots */}
          {[
            [300, 180],
            [262, 130],
            [160, 150],
            [104, 262],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="4" fill={brand} />
          ))}
          {/* BOM card */}
          <g transform="translate(300 250)">
            <rect width="216" height="96" rx="10" fill="#fff" stroke="#e2e8f0" strokeWidth="1.5" />
            <text x="14" y="24" fontSize="10" fill="#94a3b8" fontWeight="700" letterSpacing="1">BILL OF MATERIALS</text>
            {[
              ['R-200-1000 · Pipe Ø200', '× 8'],
              ['B-200-90 · Bend 90°', '× 4'],
              ['Y-200-200-45 · Y-branch', '× 2'],
            ].map(([a, b], i) => (
              <g key={a} transform={`translate(14 ${40 + i * 14})`}>
                <text fontSize="10" fill="#475569">{a}</text>
                <text x="188" fontSize="10" textAnchor="end" fill="#0f172a" fontWeight="700">{b}</text>
              </g>
            ))}
            <text x="14" y="86" fontSize="11" fill={brand} fontWeight="800">Gross € 3,388.64 incl. VAT</text>
          </g>
        </svg>
      </div>
      <div className="absolute -bottom-3 left-6 rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white shadow-lg">2D plan + isometric 3D preview</div>
    </div>
  )
}
