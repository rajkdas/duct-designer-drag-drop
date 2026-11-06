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

  const brand = settings?.brandColor ?? '#0b33d5'

  return (
    <div className="flex min-h-dvh flex-col bg-white" style={{ ['--brand' as string]: brand }}>
      {/* header */}
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="leading-tight">
              <p className="text-[17px] font-extrabold tracking-tight">
                <span className="text-[var(--brand)]">BIMA</span> <span className="text-slate-900">DuctDesigner</span>
              </p>
              <p className="text-[10px] font-medium text-slate-400">Absauganlagen planen · visualisieren · konfigurieren</p>
            </div>
          </div>
          <nav className="ml-auto hidden items-center gap-5 text-sm font-medium text-slate-500 md:flex" aria-label="Main">
            <a href="#features" className="transition hover:text-slate-800">Funktionen</a>
            <a href="#dealers" className="transition hover:text-slate-800">Für Händler</a>
            <a href="/?docs=1" className="transition hover:text-slate-800">Dokumentation</a>
          </nav>
          <div className="ml-auto flex items-center gap-2 md:ml-4">
            <a href="/?admin=1">
              <Button variant="outline" size="sm">
                <Lock className="mr-1.5 h-3.5 w-3.5" /> Verwaltung
              </Button>
            </a>
            <a href="/?app=builder">
              <Button size="sm" className="text-white shadow-sm" style={{ background: 'var(--brand)' }}>
                <PencilRuler className="mr-1.5 h-3.5 w-3.5" /> Planer öffnen
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_70%_20%,rgba(11,51,213,0.06),transparent)]" aria-hidden />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 lg:grid-cols-2 lg:py-20">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--brand)' }} />
              Planen · Kalkulieren · Anfragen — direkt im Browser
            </p>
            <h1 className="mt-4 text-4xl leading-tight font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Planen Sie Ihre Absauganlage in <span style={{ color: 'var(--brand)' }}>Minuten</span>, nicht in Abenden.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-500">
              Rohre, Bögen und Absaugstutzen per Drag & Drop auf den Hallengrundriss ziehen. Die Stückliste kalkuliert sich live
              aus unserem Katalog — als Angebot anfordern oder per Link mit jedem Händler teilen.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="/?app=builder">
                <Button size="lg" className="text-white shadow-md" style={{ background: 'var(--brand)' }}>
                  <PencilRuler className="mr-2 h-4 w-4" /> Jetzt planen — kostenlos
                </Button>
              </a>
              <a href="/?design=demo">
                <Button size="lg" variant="outline">
                  Fertiges Beispiel ansehen <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </div>
            <dl className="mt-8 grid max-w-md grid-cols-3 gap-4">
              {[
                ['71', 'Katalogteile'],
                ['Live', 'Preise & Bestand'],
                ['2D + 3D', 'Plan & Vorschau'],
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
          <h2 className="text-center text-2xl font-bold text-slate-800">Alles, was die Werkstatt braucht</h2>
          <p className="mx-auto mt-2 max-w-lg text-center text-sm text-slate-500">
            Für Schreinereien und Maschinenhändler — kein CAD, keine Tabellen, keine PDF-Preislisten von 2019.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: MousePointer2,
                title: 'Drag & Drop Planung',
                text: 'Gerade Rohre, 90°/45°/30°/22,5° Bögen, Y- und T-Stücke, Reduzierungen, Absperrschieber, Hauben und Flexschläuche — mit Anschluss-Magnetik und 0,25-m-Raster.',
              },
              {
                icon: ListOrdered,
                title: 'Live-Stückliste',
                text: 'Jedes platzierte Teil landet mit Artikelnummer, Bezeichnung, Menge und aktuellem Shop-Preis in der Stückliste — inklusive MwSt. auf dem Bruttobetrag.',
              },
              {
                icon: FileText,
                title: 'Angebote & Exporte',
                text: 'Layout mit einem Klick als Angebotsanfrage senden — oder Stückliste als PDF und den gesamten Plan als JSON exportieren.',
              },
              {
                icon: Link2,
                title: 'Teilbare Design-Links',
                text: 'Jedes Design erhält eine eigene URL — Kunden öffnen es im Ansichtsmodus mit frisch kalkulierten Preisen, Händler direkt im Editor.',
              },
              {
                icon: RefreshCw,
                title: 'WooCommerce-Anbindung',
                text: 'Der Katalog synchronisiert per SKU aus Ihrem WooCommerce-Shop. Preis im Shop geändert, sync — und jede neue Anfrage nutzt ihn.',
              },
              {
                icon: Store,
                title: 'White-Label für Händler',
                text: 'Partnerseiten betten den Planer mit eigenen Farben per Snippet oder Subdomain ein — verwaltet mit monatlichen Lizenzen.',
              },
            ].map((f) => (
              <article key={f.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-[var(--brand)] shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
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
          <h2 className="text-center text-2xl font-bold text-slate-800">Von der leeren Halle zum Angebot in drei Schritten</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ['01', 'Werkstatt zeichnen', 'Hallengröße einstellen, Maschinen als Layout-Hilfen ablegen — Formatkreissäge, Hobelmaschine, CNC, Kantenanleimer und mehr.'],
              ['02', 'Rohrleitung führen', 'Absauganlage anklicken, dann Rohre und Formteile vom Auslass zu jeder Maschine verketten. Anschlüsse rasten magnetisch ein.'],
              ['03', 'Senden oder teilen', 'Plan speichern, Link mit einem Händler teilen oder die kalkulierte Stückliste als Angebotsanfrage senden.'],
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
              Für Maschinenhändler
            </p>
            <h2 className="mt-2 text-3xl font-bold">Absauganlagen auf der eigenen Website verkaufen</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300">
              Betten Sie den Planer mit einem Zwei-Zeilen-Snippet auf Ihrer Seite ein — in Ihren Farben. Ihre Kunden planen mit
              unserem Katalog, und die Angebotsanfrage landet bei Ihnen. Monatliche Lizenz, jederzeit kündbar.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href="/?embed=1&dealer=holzprofi" target="_blank">
                <Button size="lg" className="text-slate-900" style={{ background: 'var(--brand)' }}>
                  <Store className="mr-2 h-4 w-4" /> Händler-Embed ansehen
                </Button>
              </a>
              <a href="/?docs=1#dealers">
                <Button size="lg" variant="outline" className="border-slate-700 bg-transparent text-slate-200 hover:bg-slate-800 hover:text-white">
                  <BookOpen className="mr-2 h-4 w-4" /> So funktioniert die Einbindung
                </Button>
              </a>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase">In 30 Sekunden eingebunden</p>
            <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-950 p-4 text-[12px] leading-relaxed text-emerald-300">
{`<div id="duct-designer"></div>
<script
  src="https://app.your-shop.com/embed.js"
  data-dealer="your-slug"
  data-height="760">
</script>`}
            </pre>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              {['Ihre Farben, Ihr Name — unser Katalog', 'Anfragen landen in Ihrem Postfach', 'Lizenz jederzeit pausieren oder kündigen'].map((t) => (
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
            <a href="/?app=builder" className="hover:text-slate-600">Planer</a>
            <a href="/?design=demo" className="hover:text-slate-600">Beispiel-Layout</a>
            <a href="/?docs=1" className="hover:text-slate-600">Dokumentation</a>
            <a href="/?admin=1" className="hover:text-slate-600">Verwaltung</a>
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
            [70, 70, 100, 56, 'Formatkreissäge'],
            [70, 170, 96, 50, 'Hobelmaschine'],
            [220, 70, 104, 88, 'CNC'],
            [70, 262, 110, 44, 'Kantenanleimer'],
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
            <text x="14" y="24" fontSize="10" fill="#94a3b8" fontWeight="700" letterSpacing="1">STÜCKLISTE</text>
            {[
              ['R-200-1000 · Rohr Ø200', '× 8'],
              ['B-200-90 · Bogen 90°', '× 4'],
              ['Y-200-200-45 · Abzweiger', '× 2'],
            ].map(([a, b], i) => (
              <g key={a} transform={`translate(14 ${40 + i * 14})`}>
                <text fontSize="10" fill="#475569">{a}</text>
                <text x="188" fontSize="10" textAnchor="end" fill="#0f172a" fontWeight="700">{b}</text>
              </g>
            ))}
            <text x="14" y="86" fontSize="11" fill={brand} fontWeight="800">Brutto 3.388,64 € inkl. MwSt.</text>
          </g>
        </svg>
      </div>
      <div className="absolute -bottom-3 left-6 rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white shadow-lg">2D-Plan + isometrische 3D-Vorschau</div>
    </div>
  )
}
