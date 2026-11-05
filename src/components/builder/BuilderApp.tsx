'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useBuilder } from '@/lib/store'
import type { DealerDTO, DesignData, ProductDTO, SettingsDTO } from '@/lib/types'
import { isDesignData } from '@/lib/types'
import { PlanCanvas } from './PlanCanvas'
import { IsoView } from './IsoView'
import { Palette } from './Palette'
import { PropertiesPanel } from './PropertiesPanel'
import { BomPanel } from './BomPanel'
import { TopBar } from './TopBar'
import { QuoteDialog } from './QuoteDialog'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Fan, ShieldAlert } from 'lucide-react'

const DRAFT_KEY = 'dd-draft-v1'

export function BuilderApp({ embed = false, dealerSlug, loadShareId }: { embed?: boolean; dealerSlug?: string | null; loadShareId?: string | null }) {
  const [ready, setReady] = useState(false)
  const [saving, setSaving] = useState(false)
  const [quoteOpen, setQuoteOpen] = useState(false)
  const [partsOpen, setPartsOpen] = useState(false)
  const [panelsOpen, setPanelsOpen] = useState(false)
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
            }
          } else {
            toast.error('Design not found — started a new layout instead.')
          }
        } else if (!activeDealer) {
          // restore local draft (own-site use only)
          try {
            const raw = localStorage.getItem(DRAFT_KEY)
            if (raw) {
              const draft = JSON.parse(raw) as { data: DesignData; name?: string; customer?: string }
              if (isDesignData(draft.data) && draft.data.items.length > 0) {
                loadDesign(draft.data, { name: draft.name, customer: draft.customer })
                toast.info('Restored your unsaved draft.')
              }
            }
          } catch {
            /* ignore corrupt drafts */
          }
        }
      } catch {
        toast.error('Could not load the parts catalogue — please reload.')
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
      toast.error('Place at least one part before saving.')
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
      if (!res.ok) throw new Error(data.error ?? 'Save failed')
      markSaved(data.shareId)
      toast.success('Design saved', { description: 'Use “Share link” to send it to a customer or dealer.' })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed')
      throw e
    } finally {
      setSaving(false)
    }
  }, [items.length, markSaved])
  saveRef.current = onSave

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
  }, [selectedId, rotateItem, removeItem, duplicateItem, select])

  // --- suspended dealer screen ---------------------------------------------------
  if (suspended) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-200 text-slate-500">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-xl font-bold text-slate-800">Configurator licence suspended</h1>
        <p className="mt-2 max-w-sm text-sm text-slate-500">
          The dust-extraction planner for <strong>{suspended.name}</strong> is currently unavailable. Please contact your dealer or {` `}
          reach out to us to reactivate the licence.
        </p>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Fan className="h-8 w-8 animate-spin" style={{ animationDuration: '2.5s' }} />
          <p className="text-sm font-medium">Loading parts catalogue…</p>
        </div>
      </div>
    )
  }

  const brandColor = dealer?.brandColor ?? useBuilder.getState().settings.brandColor

  return (
    <div className="flex h-dvh flex-col bg-slate-100" style={{ ['--brand' as string]: brandColor }}>
      <TopBar onSave={onSave} saving={saving} onQuote={() => setQuoteOpen(true)} onOpenParts={() => setPartsOpen(true)} onOpenPanels={() => setPanelsOpen(true)} embed={embed} />

      <div className="flex min-h-0 flex-1">
        {/* parts library — desktop */}
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 lg:block" aria-label="Parts library">
          <Palette />
        </aside>

        {/* canvas area */}
        <main className="relative min-w-0 flex-1">
          {view === 'plan' && <PlanCanvas />}
          {view === 'iso' && <IsoView />}
          {view === 'split' && (
            <div className="flex h-full w-full flex-col md:flex-row">
              <div className="min-h-0 flex-1 border-b border-slate-200 md:border-r md:border-b-0">
                <PlanCanvas />
              </div>
              <div className="min-h-0 flex-1">
                <IsoView compact />
              </div>
            </div>
          )}
        </main>

        {/* right panel — desktop */}
        <aside className="hidden w-[340px] shrink-0 flex-col divide-y divide-slate-200 border-l border-slate-200 bg-white lg:flex" aria-label="Properties and parts list">
          <div className="max-h-[46%] shrink-0 overflow-y-auto">
            <PropertiesPanel />
          </div>
          <div className="min-h-0 flex-1">
            <BomPanel onQuote={() => setQuoteOpen(true)} />
          </div>
        </aside>
      </div>

      {/* mobile parts library */}
      <Sheet open={partsOpen} onOpenChange={setPartsOpen}>
        <SheetContent side="left" className="w-[85vw] max-w-80 p-0">
          <SheetTitle className="sr-only">Parts library</SheetTitle>
          <Palette />
        </SheetContent>
      </Sheet>

      {/* mobile properties + BOM */}
      <Sheet open={panelsOpen} onOpenChange={setPanelsOpen}>
        <SheetContent side="bottom" className="h-[70vh] p-0">
          <SheetTitle className="sr-only">Properties and parts list</SheetTitle>
          <Tabs defaultValue="bom" className="h-full">
            <TabsList className="mx-auto mt-2">
              <TabsTrigger value="bom">Parts list</TabsTrigger>
              <TabsTrigger value="props">Properties</TabsTrigger>
            </TabsList>
            <TabsContent value="bom" className="h-[calc(70vh-56px)] data-[state=inactive]:hidden">
              <BomPanel onQuote={() => setQuoteOpen(true)} />
            </TabsContent>
            <TabsContent value="props" className="h-[calc(70vh-56px)] overflow-y-auto data-[state=inactive]:hidden">
              <PropertiesPanel />
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      <QuoteDialog open={quoteOpen} onOpenChange={setQuoteOpen} />

      {embed && (
        <footer className="border-t border-slate-200 bg-white px-3 py-1.5 text-center text-[10px] text-slate-400">
          Powered by {dealer?.name ?? useBuilder.getState().settings.shopName} · BIMA DuctDesigner
        </footer>
      )}
    </div>
  )
}
