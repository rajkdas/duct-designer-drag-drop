'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useBuilder } from '@/lib/store'
import { paletteGroup, type PaletteGroup } from '@/lib/geo'
import type { DealerDTO, DesignData, ProductDTO, SettingsDTO } from '@/lib/types'
import { isDesignData } from '@/lib/types'
import { PlanCanvas } from './PlanCanvas'
import { IsoView } from './IsoView'
import { Palette } from './Palette'
import { PropertiesPanel, ProjectPanel, CalculationPanel } from './PropertiesPanel'
import { BomPanel, BomTotalsCard } from './BomPanel'
import { TopBar } from './TopBar'
import { QuoteDialog } from './QuoteDialog'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { toast } from 'sonner'
import { Boxes, Columns2, Copy, Fan, MousePointer2, PanelLeft, Ruler, ShieldAlert, Trash2 } from 'lucide-react'

const DRAFT_KEY = 'dd-draft-v1'

// ---------------------------------------------------------------------------
// App frame — approved design:
//   header · [Bauteile | canvas + toolbar + Stückliste | Eigenschaften]
//   dark chips „2D – Grundriss" / „3D – Ansicht", tool row above the canvas.
// ---------------------------------------------------------------------------

/** mini drawing-tool icons matching the design's toolbar */
function ToolPipe() {
  return (
    <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M4.5 15.5 L15.5 4.5" />
      <circle cx="4.5" cy="15.5" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="4.5" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  )
}
function ToolFlex() {
  return (
    <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M3.5 14 C 6 7.5, 9.5 16, 12 10 S 15.5 6, 16.5 5.5" />
    </svg>
  )
}
function ToolBend() {
  return (
    <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round">
      <path d="M4.5 16 A 9 9 0 0 1 13.5 4.5" />
    </svg>
  )
}
function ToolBranch() {
  return (
    <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
      <path d="M10 16.5 L10 10 M10 10 L4.5 4.5 M10 10 L15.5 4.5" />
    </svg>
  )
}
function ToolGate() {
  return (
    <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="10" cy="10" r="6.2" />
      <path d="M5.4 14.6 L14.6 5.4" />
    </svg>
  )
}
function ToolDrag() {
  return (
    <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="currentColor" stroke="none">
      {[5, 10, 15].flatMap((y) => [6.5, 13.5].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.35" />))}
    </svg>
  )
}

function CanvasToolbar() {
  const products = useBuilder((s) => s.products)
  const placing = useBuilder((s) => s.placing)
  const setPlacing = useBuilder((s) => s.setPlacing)
  const selectedId = useBuilder((s) => s.selectedId)
  const select = useBuilder((s) => s.select)
  const removeItem = useBuilder((s) => s.removeItem)
  const duplicateItem = useBuilder((s) => s.duplicateItem)
  const view = useBuilder((s) => s.view)
  const setView = useBuilder((s) => s.setView)

  const defaultFor = useCallback(
    (grp: PaletteGroup) =>
      products.find((p) => paletteGroup(p.category) === grp && p.diameterMm === 200) ??
      products.find((p) => paletteGroup(p.category) === grp),
    [products]
  )

  const tools: { key: string; title: string; icon: React.ReactNode; active: boolean; run: () => void; disabled?: boolean }[] = [
    {
      key: 'select',
      title: 'Auswählen (Esc)',
      icon: <MousePointer2 className="h-4 w-4" />,
      active: !placing,
      run: () => {
        setPlacing(null)
        select(null)
      },
    },
    ...(
      [
        { key: 'pipe', grp: 'PIPE' as PaletteGroup, title: 'Rohr platzieren', icon: <ToolPipe /> },
        { key: 'flex', grp: 'ACCESSORY' as PaletteGroup, title: 'Flexschlauch platzieren', icon: <ToolFlex /> },
        { key: 'bend', grp: 'BEND' as PaletteGroup, title: 'Bogen platzieren', icon: <ToolBend /> },
        { key: 'branch', grp: 'BRANCH' as PaletteGroup, title: 'Abzweiger platzieren', icon: <ToolBranch /> },
        { key: 'gate', grp: 'GATE' as PaletteGroup, title: 'Absperrschieber platzieren', icon: <ToolGate /> },
      ] satisfies { key: string; grp: PaletteGroup; title: string; icon: React.ReactNode }[]
    ).map((t) => {
      const p = defaultFor(t.grp)
      return {
        key: t.key,
        title: p ? `${t.title} — ${p.name}` : t.title,
        icon: t.icon,
        active: placing?.kind === 'product' && placing.productId === p?.id,
        disabled: !p,
        run: () => p && setPlacing(placing?.kind === 'product' && placing.productId === p.id ? null : { kind: 'product', productId: p.id }),
      }
    }),
  ]

  const brandStyle = { background: 'var(--brand)' }

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto px-0.5 pb-0.5 md:overflow-visible">
      {tools.map((t) => (
        <button
          key={t.key}
          className="dd-tool"
          data-active={t.active}
          title={t.title}
          aria-label={t.title}
          aria-pressed={t.active}
          disabled={t.disabled}
          onClick={t.run}
        >
          {t.icon}
        </button>
      ))}

      <span className="mx-0.5 h-5 w-px bg-[#e5e7ee]" aria-hidden />

      <button
        className="dd-tool hover:bg-red-50 hover:text-red-600"
        title="Auswahl löschen (Entf)"
        aria-label="Auswahl löschen"
        disabled={!selectedId}
        onClick={() => selectedId && removeItem(selectedId)}
      >
        <Trash2 className="h-4 w-4" />
      </button>
      <button
        className="dd-tool text-slate-500"
        title="Auswahl duplizieren (D)"
        aria-label="Auswahl duplizieren"
        disabled={!selectedId}
        onClick={() => selectedId && duplicateItem(selectedId)}
      >
        <ToolDrag />
      </button>

      {/* 2D / 3D segmented toggle — design: blue active square */}
      <div className="ml-1 flex items-center overflow-hidden rounded-lg border border-[#d7dae2] bg-white p-[3px] gap-[3px]">
        <button
          onClick={() => setView('split')}
          className={`rounded-md px-3.5 py-1 text-[13px] font-bold transition ${view !== 'iso' ? 'text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
          style={view !== 'iso' ? brandStyle : undefined}
          aria-pressed={view !== 'iso'}
        >
          2D
        </button>
        <button
          onClick={() => setView('iso')}
          className={`rounded-md px-3.5 py-1 text-[13px] font-bold transition ${view === 'iso' ? 'text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
          style={view === 'iso' ? brandStyle : undefined}
          aria-pressed={view === 'iso'}
        >
          3D
        </button>
      </div>

      {/* view layout buttons — split / 2D / 3D */}
      <div className="ml-0.5 hidden items-center gap-1 sm:flex">
        <button className="dd-tool" data-active={view === 'split'} title="2D + 3D nebeneinander" aria-label="Geteilte Ansicht" onClick={() => setView('split')}>
          <Columns2 className="h-4 w-4" />
        </button>
        <button className="dd-tool" data-active={view === 'plan'} title="Nur 2D-Grundriss" aria-label="2D-Ansicht" onClick={() => setView('plan')}>
          <Ruler className="h-4 w-4" />
        </button>
        <button className="dd-tool" data-active={view === 'iso'} title="Nur 3D-Ansicht" aria-label="3D-Ansicht" onClick={() => setView('iso')}>
          <Boxes className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export function BuilderApp({ embed = false, dealerSlug, loadShareId }: { embed?: boolean; dealerSlug?: string | null; loadShareId?: string | null }) {
  const [ready, setReady] = useState(false)
  const [saving, setSaving] = useState(false)
  const [quoteOpen, setQuoteOpen] = useState(false)
  const [partsOpen, setPartsOpen] = useState(false)
  const [panelsOpen, setPanelsOpen] = useState(false)
  const [leftOpen, setLeftOpen] = useState(true)
  const [leftTab, setLeftTab] = useState<'parts' | 'project'>('parts')
  const [rightTab, setRightTab] = useState<'props' | 'calc'>('props')
  const [suspended, setSuspended] = useState<DealerDTO | null>(null)
  const saveRef = useRef<() => Promise<void>>(async () => {})

  const setProducts = useBuilder((s) => s.setProducts)
  const setSettings = useBuilder((s) => s.setSettings)
  const setDealer = useBuilder((s) => s.setDealer)
  const loadDesign = useBuilder((s) => s.loadDesign)
  const markSaved = useBuilder((s) => s.markSaved)
  const view = useBuilder((s) => s.view)
  const dirty = useBuilder((s) => s.dirty)
  const selectedId = useBuilder((s) => s.selectedId)
  const rotateItem = useBuilder((s) => s.rotateItem)
  const removeItem = useBuilder((s) => s.removeItem)
  const duplicateItem = useBuilder((s) => s.duplicateItem)
  const select = useBuilder((s) => s.select)
  const undo = useBuilder((s) => s.undo)
  const redo = useBuilder((s) => s.redo)
  const designName = useBuilder((s) => s.designName)
  const customer = useBuilder((s) => s.customer)
  const room = useBuilder((s) => s.room)
  const items = useBuilder((s) => s.items)
  const dealer = useBuilder((s) => s.dealer)

  // --- bootstrap: products, settings, dealer, optional design ---------------
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [prodRes, setRes] = await Promise.all([fetch('/api/products'), fetch('/api/settings')])
        const products = (await prodRes.json()) as ProductDTO[]
        const settings = (await setRes.json()) as SettingsDTO
        if (cancelled) return
        setProducts(products)
        setSettings(settings)

        let activeDealer: DealerDTO | null = null
        if (dealerSlug) {
          const r = await fetch(`/api/dealers?slug=${encodeURIComponent(dealerSlug)}`)
          if (r.ok) {
            const d = await r.json()
            if (d.status === 'SUSPENDED') {
              setSuspended(d)
              return
            }
            activeDealer = d
            setDealer(d)
          }
        }

        if (loadShareId) {
          const r = await fetch(`/api/designs/${loadShareId}`)
          if (r.ok) {
            const d = await r.json()
            const data = d.data
            if (isDesignData(data)) {
              loadDesign(data, { name: d.name, customer: d.customer ?? '', shareId: d.shareId })
              // the approved design opens with a straight pipe selected —
              // pick a PIPE item (falls back to the first duct part)
              const productsNow = products
              const firstDuct =
                data.items.find((it: { productId?: string; sku?: string; machine?: string }) => {
                  if (it.machine) return false
                  const p = productsNow.find((pp: ProductDTO) => pp.id === it.productId || pp.sku === it.sku)
                  return p?.category === 'PIPE'
                }) ?? data.items.find((it: { machine?: string }) => !it.machine)
              if (firstDuct) useBuilder.getState().select(firstDuct.id)
            }
          } else {
            toast.error('Design nicht gefunden — es wurde ein neuer Plan gestartet.')
          }
        } else if (!activeDealer) {
          // restore local draft (own-site use only)
          try {
            const raw = localStorage.getItem(DRAFT_KEY)
            if (raw) {
              const draft = JSON.parse(raw) as { data: DesignData; name?: string; customer?: string }
              if (isDesignData(draft.data) && draft.data.items.length > 0) {
                loadDesign(draft.data, { name: draft.name, customer: draft.customer })
                toast.info('Ungespeicherter Entwurf wiederhergestellt.')
              }
            }
          } catch {
            /* ignore corrupt drafts */
          }
        }
      } catch {
        toast.error('Bauteilkatalog konnte nicht geladen werden — bitte Seite neu laden.')
      } finally {
        if (!cancelled) setReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [dealerSlug, loadShareId, setDealer, loadDesign, setProducts, setSettings])

  // --- draft autosave ---------------------------------------------------------
  useEffect(() => {
    if (!ready) return
    const t = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ data: { v: 1, room, items }, name: designName, customer }))
      } catch {
        /* storage full — ignore */
      }
    }, 800)
    return () => clearTimeout(t)
  }, [items, room, designName, customer, ready])

  // --- save --------------------------------------------------------------------
  const onSave = useCallback(async () => {
    if (items.length === 0) {
      toast.error('Platzieren Sie mindestens ein Teil, bevor Sie speichern.')
      return
    }
    setSaving(true)
    try {
      const s = useBuilder.getState()
      const res = await fetch('/api/designs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shareId: s.shareId,
          name: s.designName,
          customer: s.customer,
          dealerSlug: s.dealer?.slug,
          data: { v: 1, room: s.room, items: s.items },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Speichern fehlgeschlagen')
      markSaved(data.shareId)
      toast.success('Plan gespeichert', { description: 'Über „Export ▾ → Plan-Link“ können Sie ihn an Kunde oder Händler senden.' })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Speichern fehlgeschlagen')
      throw e
    } finally {
      setSaving(false)
    }
  }, [items.length, markSaved])
  useEffect(() => {
    saveRef.current = onSave
  }, [onSave])

  // --- keyboard shortcuts -------------------------------------------------------
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        saveRef.current()
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        redo()
        return
      }
      if (!selectedId) return
      if (e.key === 'r' || e.key === 'R') rotateItem(selectedId, e.shiftKey ? -22.5 : 22.5)
      else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        removeItem(selectedId)
      } else if (e.key === 'd' || e.key === 'D') duplicateItem(selectedId)
      else if (e.key === 'Escape') select(null)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [selectedId, rotateItem, removeItem, duplicateItem, select, undo, redo])

  // --- suspended dealer screen ---------------------------------------------------
  if (suspended) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-200 text-slate-500">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-xl font-bold text-slate-800">Konfigurator-Lizenz gesperrt</h1>
        <p className="mt-2 max-w-sm text-sm text-slate-500">
          Der Absaugplaner für <strong>{suspended.name}</strong> ist derzeit nicht verfügbar. Bitte wenden Sie sich an Ihren Händler oder an uns, um die Lizenz freizuschalten.
        </p>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Fan className="h-8 w-8 animate-spin" style={{ animationDuration: '2.5s' }} />
          <p className="text-sm font-medium">Bauteilkatalog wird geladen…</p>
        </div>
      </div>
    )
  }

  const brandColor = dealer?.brandColor ?? useBuilder.getState().settings.brandColor

  const leftTabs = (
    <>
      <button className="dd-tab" data-active={leftTab === 'parts'} onClick={() => setLeftTab('parts')}>
        Bauteile
      </button>
      <button className="dd-tab" data-active={leftTab === 'project'} onClick={() => setLeftTab('project')}>
        Projekt
      </button>
    </>
  )

  const rightTabs = (
    <>
      <button className="dd-tab" data-active={rightTab === 'props'} onClick={() => setRightTab('props')}>
        Eigenschaften
      </button>
      <button className="dd-tab" data-active={rightTab === 'calc'} onClick={() => setRightTab('calc')}>
        Berechnung
      </button>
    </>
  )

  return (
    <div
      className="flex h-dvh flex-col overflow-hidden bg-[var(--workspace)]"
      style={{ ['--brand' as string]: brandColor }}
    >
      <TopBar
        onSave={onSave}
        saving={saving}
        onQuote={() => setQuoteOpen(true)}
        onOpenParts={() => setPartsOpen(true)}
        onOpenPanels={() => setPanelsOpen(true)}
        embed={embed}
      />

      {/* workspace: catalogue · canvas cards · properties */}
      <div className="flex min-h-0 flex-1 flex-col gap-2.5 p-2.5 xl:flex-row">
        {/* left aside — Bauteile / Projekt with close button (design header) */}
        {leftOpen ? (
          <aside className="dd-card hidden w-[224px] shrink-0 flex-col overflow-hidden xl:flex" aria-label="Bauteilkatalog">
            <div className="flex items-stretch gap-0.5 border-b border-[#eceef3] pl-1.5 pr-1">
              {leftTabs}
              <button
                className="ml-auto flex h-9 w-8 items-center justify-center text-slate-400 transition hover:text-slate-700"
                onClick={() => setLeftOpen(false)}
                title="Bauteilkatalog schließen"
                aria-label="Bauteilkatalog schließen"
              >
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M3 3 L13 13 M13 3 L3 13" />
                </svg>
              </button>
            </div>
            <div className="dd-scroll min-h-0 flex-1 overflow-y-auto">
              {leftTab === 'parts' ? <Palette /> : <ProjectPanel />}
            </div>
          </aside>
        ) : (
          <button
            className="dd-card hidden w-11 shrink-0 flex-col items-center gap-2.5 pt-3 text-slate-500 transition hover:text-[var(--brand)] xl:flex"
            onClick={() => setLeftOpen(true)}
            title="Bauteilkatalog öffnen"
            aria-label="Bauteilkatalog öffnen"
          >
            <PanelLeft className="h-4 w-4" />
            <span className="text-[11px] font-semibold" style={{ writingMode: 'vertical-rl' }}>
              Bauteile
            </span>
          </button>
        )}

        {/* centre — toolbar · 2D/3D cards · bottom BOM bar */}
        <main className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
          <CanvasToolbar />
          <div
            className={`grid min-h-0 gap-2.5 ${
              view === 'split' ? 'flex-1 grid-cols-1 lg:grid-cols-2' : 'flex-1 grid-cols-1'
            }`}
          >
            {view !== 'iso' && (
              <section className="dd-card relative min-h-0 overflow-hidden">
                <div className="absolute left-3 top-3 z-10">
                  <span className="dd-chip-dark">
                    <Ruler className="h-3 w-3" /> 2D – Grundriss
                  </span>
                </div>
                <PlanCanvas />
              </section>
            )}
            {view !== 'plan' && (
              <section className="dd-card relative min-h-0 overflow-hidden">
                <div className="absolute left-3 top-3 z-10">
                  <span className="dd-chip-dark">
                    <Boxes className="h-3 w-3" /> 3D – Ansicht
                  </span>
                </div>
                <IsoView compact={view !== 'split'} />
              </section>
            )}
          </div>
          {/* BOM bottom bar (table only — totals live in the right column) */}
          <div className="hidden min-h-0 flex-[0_0_158px] xl:block">
            <BomPanel totalsAside />
          </div>
        </main>

        {/* right aside — Eigenschaften / Berechnung + totals card (design layout) */}
        <aside className="hidden w-[260px] shrink-0 flex-col gap-2.5 xl:flex" aria-label="Eigenschaften und Berechnung">
          <div className="dd-card flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex items-stretch gap-0.5 border-b border-[#eceef3] px-1.5">
              {rightTabs}
            </div>
            <div className="dd-scroll min-h-0 flex-1 overflow-y-auto">
              {rightTab === 'props' ? <PropertiesPanel /> : <CalculationPanel />}
            </div>
          </div>
          <BomTotalsCard />
        </aside>
      </div>

      {/* BOM bottom bar — full width on smaller screens */}
      <div className="h-[46vh] min-h-[240px] shrink-0 px-2.5 pb-2.5 xl:hidden">
        <BomPanel />
      </div>

      {/* mobile parts library */}
      <Sheet open={partsOpen} onOpenChange={setPartsOpen}>
        <SheetContent side="left" className="w-[85vw] max-w-80 p-0">
          <SheetTitle className="sr-only">Bauteilkatalog</SheetTitle>
          <Palette />
        </SheetContent>
      </Sheet>

      {/* mobile properties + BOM */}
      <Sheet open={panelsOpen} onOpenChange={setPanelsOpen}>
        <SheetContent side="bottom" className="h-[70vh] p-0">
          <SheetTitle className="sr-only">Eigenschaften und Stückliste</SheetTitle>
          <div className="flex items-stretch gap-0.5 border-b border-[#eceef3] px-2">
            {rightTabs}
          </div>
          <div className="dd-scroll h-[calc(70vh-42px)] overflow-y-auto">
            {rightTab === 'props' ? <PropertiesPanel /> : <CalculationPanel />}
          </div>
        </SheetContent>
      </Sheet>

      <QuoteDialog open={quoteOpen} onOpenChange={setQuoteOpen} />

      {embed && (
        <footer className="shrink-0 border-t border-slate-200 bg-white px-3 py-1.5 text-center text-[10px] text-slate-400">
          Bereitgestellt von {dealer?.name ?? useBuilder.getState().settings.shopName} · BIMA DuctDesigner
        </footer>
      )}
    </div>
  )
}
