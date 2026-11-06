'use client'

import { useEffect, useState } from 'react'
import { useBuilder } from '@/lib/store'
import type { DesignData, ProductDTO, SettingsDTO } from '@/lib/types'
import { isDesignData } from '@/lib/types'
import { PlanCanvas } from '@/components/builder/PlanCanvas'
import { IsoView } from '@/components/builder/IsoView'
import { BomPanel } from '@/components/builder/BomPanel'
import { QuoteDialog } from '@/components/builder/QuoteDialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Fan, PencilRuler, Send } from 'lucide-react'

// ---------------------------------------------------------------------------
// Public read-only design view for shared links (/?design=<shareId>).
// Re-prices the parts list against the *current* catalogue every time it is
// opened, so shared links never show stale prices.
// ---------------------------------------------------------------------------

export function ShareView({ shareId }: { shareId: string }) {
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading')
  const [dealerLabel, setDealerLabel] = useState<string | null>(null)
  const [mode, setMode] = useState<'plan' | 'iso'>('plan')
  const [quoteOpen, setQuoteOpen] = useState(false)

  const setProducts = useBuilder((s) => s.setProducts)
  const setSettings = useBuilder((s) => s.setSettings)
  const loadDesign = useBuilder((s) => s.loadDesign)
  const settings = useBuilder((s) => s.settings)
  const designName = useBuilder((s) => s.designName)
  const customer = useBuilder((s) => s.customer)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [dRes, pRes, sRes] = await Promise.all([fetch(`/api/designs/${shareId}`), fetch('/api/products'), fetch('/api/settings')])
        if (!dRes.ok) {
          if (!cancelled) setState('missing')
          return
        }
        const d = await dRes.json()
        const products = (await pRes.json()) as ProductDTO[]
        const shopSettings = (await sRes.json()) as SettingsDTO
        if (cancelled) return
        setProducts(products)
        setSettings(shopSettings)
        if (d.dealerName) setDealerLabel(d.dealerName)
        const data = d.data as DesignData
        if (isDesignData(data)) {
          loadDesign(data, { name: d.name, customer: d.customer ?? '', shareId: d.shareId })
        }
        setState('ready')
      } catch {
        if (!cancelled) setState('missing')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [shareId, loadDesign, setProducts, setSettings])

  if (state === 'loading') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Fan className="h-8 w-8 animate-spin" style={{ animationDuration: '2.5s' }} />
          <p className="text-sm font-medium">Geteiltes Design wird geladen…</p>
        </div>
      </div>
    )
  }

  if (state === 'missing') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <h1 className="text-xl font-bold text-slate-800">Design nicht gefunden</h1>
        <p className="mt-2 max-w-sm text-sm text-slate-500">Dieser Teilen-Link ist ungültig oder das Design wurde entfernt. Bitten Sie den Absender um einen neuen Link.</p>
        <Button className="mt-4" onClick={() => (window.location.href = '/?app=builder')}>
          <PencilRuler className="mr-2 h-4 w-4" /> Eigenes Layout starten
        </Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-slate-100" style={{ ['--brand' as string]: settings.brandColor }}>
      <header className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-2.5">
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ background: 'var(--brand)' }}>
            <Fan className="h-4.5 w-4.5" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-slate-800">{dealerLabel ?? settings.shopName}</p>
            <p className="text-[10px] text-slate-400">Geteiltes Absaug-Layout</p>
          </div>
        </div>
        <div className="min-w-0 flex-1 truncate text-center">
          <p className="truncate text-sm font-semibold text-slate-800">{designName}</p>
          {customer && <p className="truncate text-[11px] text-slate-400">für {customer}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <a href={`/?app=builder&design=${shareId}`}>
            <Button variant="outline" size="sm">
              <PencilRuler className="mr-1.5 h-3.5 w-3.5" /> Im Planer öffnen
            </Button>
          </a>
          <Button size="sm" className="text-white" style={{ background: 'var(--brand)' }} onClick={() => setQuoteOpen(true)}>
            <Send className="mr-1.5 h-3.5 w-3.5" /> Angebot anfordern
          </Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1500px] flex-1 flex-col gap-3 p-3 lg:flex-row">
        <section className="relative min-h-[420px] flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {mode === 'plan' ? <PlanCanvas readOnly /> : <IsoView />}
          <div className="absolute right-3 top-3 flex items-center gap-2">
            <Tabs value={mode} onValueChange={(v) => setMode(v as 'plan' | 'iso')}>
              <TabsList className="h-8">
                <TabsTrigger value="plan" className="h-6 px-3 text-xs">
                  2D – Grundriss
                </TabsTrigger>
                <TabsTrigger value="iso" className="h-6 px-3 text-xs">
                  3D – Ansicht
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </section>
        <aside className="flex max-h-[70vh] min-h-[320px] w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:max-h-none lg:w-[420px]">
          <BomPanel onQuote={() => setQuoteOpen(true)} readOnly side />
        </aside>
      </main>

      <footer className="border-t border-slate-200 bg-white px-4 py-2 text-center text-[11px] text-slate-400">
        Preise kommen live aus dem Katalog von {settings.shopName} und wurden beim Öffnen dieses Links aktualisiert.
      </footer>

      <QuoteDialog open={quoteOpen} onOpenChange={setQuoteOpen} />
    </div>
  )
}
