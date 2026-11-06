'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useBuilder } from '@/lib/store'
import { exportBomPdf, downloadJson } from '@/lib/pdf'
import { useBom } from './BomPanel'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import {
  CircleUserRound, ChevronDown, FileDown, FileJson, Loader2, Pencil, Redo2,
  Save, ShoppingCart, Undo2,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Header row — matches the approved design:
//   BIMA DuctDesigner + claim · „Projekt: <name>" · Speichern ↶↷ Export ▾ ·
//   Angebot anfordern (primär) · Avatar
// ---------------------------------------------------------------------------

export function TopBar({
  onSave,
  saving,
  onQuote,
  onOpenParts,
  onOpenPanels,
  embed,
}: {
  onSave: () => Promise<void>
  saving: boolean
  onQuote: () => void
  onOpenParts: () => void
  onOpenPanels: () => void
  embed: boolean
}) {
  const designName = useBuilder((s) => s.designName)
  const setDesignName = useBuilder((s) => s.setDesignName)
  const customer = useBuilder((s) => s.customer)
  const dirty = useBuilder((s) => s.dirty)
  const shareId = useBuilder((s) => s.shareId)
  const view = useBuilder((s) => s.view)
  const setView = useBuilder((s) => s.setView)
  const settings = useBuilder((s) => s.settings)
  const dealer = useBuilder((s) => s.dealer)
  const room = useBuilder((s) => s.room)
  const items = useBuilder((s) => s.items)
  const past = useBuilder((s) => s.past)
  const future = useBuilder((s) => s.future)
  const undo = useBuilder((s) => s.undo)
  const redo = useBuilder((s) => s.redo)
  const { rows, totals } = useBom()
  const [sharing, setSharing] = useState(false)

  const share = async () => {
    setSharing(true)
    try {
      let id = shareId
      if (!id || dirty) {
        await onSave()
        id = useBuilder.getState().shareId
      }
      if (!id) throw new Error('Plan konnte nicht gespeichert werden')
      const url = `${window.location.origin}/?design=${id}`
      await navigator.clipboard.writeText(url)
      toast.success('Link kopiert', { description: 'Teilen Sie den Link mit Kunde oder Händler.' })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Link konnte nicht erstellt werden')
    } finally {
      setSharing(false)
    }
  }

  const exportPdf = async () => {
    if (rows.length === 0) {
      toast.error('Platzieren Sie zuerst Teile — die Stückliste ist leer.')
      return
    }
    try {
      await exportBomPdf(
        {
          name: designName,
          customer,
          room,
          shareUrl: shareId ? `${window.location.origin}/?design=${shareId}` : undefined,
          dealerName: dealer?.name ?? null,
          itemCount: items.length,
        },
        rows,
        totals,
        settings
      )
      toast.success('PDF exportiert')
    } catch {
      toast.error('PDF-Export fehlgeschlagen')
    }
  }

  const exportJson = () => {
    downloadJson(
      {
        meta: { name: designName, customer, room, shareId, exportedAt: new Date().toISOString(), seller: dealer?.name ?? settings.shopName },
        items,
        bom: rows,
        totals,
      },
      `${designName.replace(/[^a-z0-9-_ ]/gi, '').trim().replace(/\s+/g, '-').toLowerCase() || 'absaug-plan'}`
        .toLowerCase()
        .concat('.json')
    )
    toast.success('JSON exportiert')
  }

  const brandStyle = { background: 'var(--brand)' }

  return (
    <header className="z-20 flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-[#e5e7ee] bg-white px-4 py-2">
      {/* brand — design: blue BIMA + dark DuctDesigner, claim below */}
      <div className="min-w-0 shrink-0 leading-tight">
        <p className="text-[21px] font-extrabold tracking-tight">
          <span className="text-[var(--brand)]">BIMA</span> <span className="text-[#111827]">DuctDesigner</span>
        </p>
        <p className="truncate text-[10px] font-medium text-slate-400">
          {embed ? dealer?.name ?? settings.shopName : 'Absauganlagen planen · visualisieren · konfigurieren'}
        </p>
      </div>

      {/* mobile: open parts library */}
      <Button variant="outline" size="icon" className="h-9 w-9 border-[#d7dae2] lg:hidden" onClick={onOpenParts} aria-label="Bauteilkatalog öffnen">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" /></svg>
      </Button>

      {/* project meta — design: „Projekt: Schreinerei Muster ✎" */}
      <div className="order-last flex w-full min-w-0 items-center gap-1.5 sm:order-none sm:w-auto sm:flex-1">
        <span className="hidden shrink-0 text-sm font-semibold text-slate-800 md:inline">Projekt:</span>
        <div className="relative min-w-0 max-w-64 flex-1">
          <input
            value={designName}
            onChange={(e) => setDesignName(e.target.value)}
            className="w-full rounded-md border border-transparent bg-transparent py-1 pl-1 pr-6 text-sm font-semibold text-slate-800 transition hover:border-slate-200 focus:border-[var(--brand)] focus:bg-white focus:outline-none"
            aria-label="Projektname"
            placeholder="Projektname"
          />
          <Pencil className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      {/* actions — Speichern · ↶↷ · Export ▾ · Angebot anfordern · Avatar */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="relative h-9 gap-1.5 rounded-lg border-[#d7dae2] px-3 text-[13px] font-semibold text-slate-700 shadow-none hover:bg-slate-50"
          onClick={onSave}
          disabled={saving}
          aria-label="Plan speichern"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin text-slate-500" /> : <Save className="h-4 w-4 text-slate-500" />}
          <span className="hidden sm:inline">Speichern</span>
          {dirty && !saving && <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-amber-500" aria-label="Ungespeicherte Änderungen" />}
        </Button>

        {/* undo / redo — one bordered group, design style */}
        <div className="flex h-9 items-center overflow-hidden rounded-lg border border-[#d7dae2]">
          <button
            className="flex h-full w-9 items-center justify-center text-slate-600 transition hover:bg-slate-50 disabled:opacity-30"
            onClick={undo}
            disabled={past.length === 0}
            title="Rückgängig (Strg+Z)"
            aria-label="Rückgängig"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <span className="h-4 w-px bg-[#e5e7ee]" aria-hidden />
          <button
            className="flex h-full w-9 items-center justify-center text-slate-600 transition hover:bg-slate-50 disabled:opacity-30"
            onClick={redo}
            disabled={future.length === 0}
            title="Wiederherstellen (Strg+Umschalt+Z)"
            aria-label="Wiederherstellen"
          >
            <Redo2 className="h-4 w-4" />
          </button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-1.5 rounded-lg border-[#d7dae2] px-3 text-[13px] font-semibold text-slate-700 shadow-none hover:bg-slate-50">
              <FileDown className="h-4 w-4 text-slate-500" />
              <span className="hidden sm:inline">Export</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={exportPdf}>
              <FileDown className="mr-2 h-4 w-4" /> Stückliste als PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportJson}>
              <FileJson className="mr-2 h-4 w-4" /> Plan als JSON
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          size="sm"
          className="h-9 gap-1.5 rounded-lg px-3.5 text-[13px] font-bold text-white shadow-[0_2px_8px_-2px_rgba(11,51,213,0.55)] transition hover:opacity-90"
          style={brandStyle}
          onClick={onQuote}
        >
          <ShoppingCart className="h-4 w-4" />
          <span className="hidden sm:inline">Angebot anfordern</span>
          <span className="sm:hidden">Angebot</span>
        </Button>

        {/* mobile: properties + BOM */}
        <Button variant="outline" size="icon" className="h-9 w-9 border-[#d7dae2] xl:hidden" onClick={onOpenPanels} aria-label="Eigenschaften und Stückliste">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="5" rx="1.5" /><rect x="3" y="13" width="18" height="7" rx="1.5" /></svg>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-0.5 rounded-full p-1 transition hover:bg-slate-100" aria-label="Konto und Hilfe">
              <CircleUserRound className="h-6 w-6 text-slate-400" />
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <div className="px-2 py-1.5">
              <p className="text-[13px] font-semibold text-slate-800">{dealer?.name ?? settings.shopName}</p>
              <p className="text-[11px] text-slate-400">{settings.contactEmail || 'BIMA Absaugtechnik'}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/?docs=1">Dokumentation</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/?admin=1">Verwaltung</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={share} disabled={sharing}>
              Plan-Link kopieren
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setView(view === 'iso' ? 'split' : 'iso')}>
              {view === 'iso' ? '2D & 3D anzeigen' : 'Nur 3D anzeigen'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
