'use client'

import { useState } from 'react'
import { useBuilder } from '@/lib/store'
import { fitToRoom } from './PlanCanvas'
import { useBom } from './BomPanel'
import { downloadJson, exportBomPdf } from '@/lib/pdf'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { Fan, FileDown, FileJson, Link2, Loader2, Maximize2, Minus, Plus, Save, Send, Columns2, Map, Box, PanelLeft, PanelBottom } from 'lucide-react'

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
  const setCustomer = useBuilder((s) => s.setCustomer)
  const dirty = useBuilder((s) => s.dirty)
  const shareId = useBuilder((s) => s.shareId)
  const view = useBuilder((s) => s.view)
  const setView = useBuilder((s) => s.setView)
  const zoom = useBuilder((s) => s.zoom)
  const zoomBy = useBuilder((s) => s.zoomBy)
  const settings = useBuilder((s) => s.settings)
  const dealer = useBuilder((s) => s.dealer)
  const room = useBuilder((s) => s.room)
  const items = useBuilder((s) => s.items)
  const markSaved = useBuilder((s) => s.markSaved)
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
      if (!id) throw new Error('Could not save the design')
      const url = `${window.location.origin}/?design=${id}`
      await navigator.clipboard.writeText(url)
      toast.success('Share link copied to clipboard', { description: url })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create the link')
    } finally {
      setSharing(false)
    }
  }

  const exportPdf = async () => {
    if (rows.length === 0) {
      toast.error('Place some parts first — the parts list is empty.')
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
      toast.success('PDF exported')
    } catch {
      toast.error('PDF export failed')
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
      `${designName.replace(/[^a-z0-9-_ ]/gi, '').trim().replace(/\s+/g, '-').toLowerCase() || 'duct-layout'}.json`
    )
    toast.success('JSON exported')
  }

  const brandStyle = { background: 'var(--brand)' }

  return (
    <header className="z-20 flex flex-wrap items-center gap-x-2 gap-y-1.5 border-b border-slate-200 bg-white px-3 py-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      {/* brand */}
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white" style={brandStyle}>
          <Fan className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-bold text-slate-800">{dealer?.name ?? settings.shopName}</p>
          <p className="truncate text-[10px] text-slate-400">Duct layout planner</p>
        </div>
      </div>

      {/* mobile: open parts library */}
      <Button variant="outline" size="sm" className="lg:hidden" onClick={onOpenParts} aria-label="Open parts library">
        <PanelLeft className="h-4 w-4" />
      </Button>

      {/* design meta */}
      <div className="order-last flex w-full min-w-0 items-center gap-2 sm:order-none sm:w-auto sm:flex-1">
        <input
          value={designName}
          onChange={(e) => setDesignName(e.target.value)}
          className="min-w-0 flex-1 rounded-md border border-transparent px-2 py-1 text-sm font-semibold text-slate-800 transition hover:border-slate-200 focus:border-slate-300 focus:bg-white focus:outline-none sm:max-w-56"
          aria-label="Design name"
          placeholder="Design name"
        />
        <input
          value={customer}
          onChange={(e) => setCustomer(e.target.value)}
          className="hidden min-w-0 flex-1 rounded-md border border-transparent px-2 py-1 text-sm text-slate-500 transition hover:border-slate-200 focus:border-slate-300 focus:bg-white focus:outline-none sm:block sm:max-w-44"
          aria-label="Customer name"
          placeholder="Customer (optional)"
        />
      </div>

      {/* view toggle */}
      <div className="hidden items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 md:flex">
        {(
          [
            ['plan', 'Plan', Map],
            ['split', 'Both', Columns2],
            ['iso', '3D', Box],
          ] as const
        ).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition ${view === key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            aria-pressed={view === key}
          >
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* zoom */}
      <div className="hidden items-center gap-0.5 rounded-lg border border-slate-200 p-0.5 sm:flex">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => zoomBy(1 / 1.2)} aria-label="Zoom out">
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <span className="w-10 text-center text-[11px] font-semibold text-slate-500">{Math.round(zoom * 100)}%</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => zoomBy(1.2)} aria-label="Zoom in">
          <Plus className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fitToRoom} aria-label="Fit to room">
          <Maximize2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* actions */}
      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="sm" onClick={onSave} disabled={saving} className="relative">
          {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
          <span className="hidden sm:inline">Save</span>
          {dirty && !saving && <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-amber-500" aria-label="Unsaved changes" />}
        </Button>
        <Button variant="outline" size="sm" onClick={share} disabled={sharing}>
          <Link2 className="mr-1.5 h-3.5 w-3.5" />
          <span className="hidden sm:inline">Share link</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <FileDown className="mr-1.5 h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={exportPdf}>
              <FileDown className="mr-2 h-4 w-4" /> Parts list as PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportJson}>
              <FileJson className="mr-2 h-4 w-4" /> Design as JSON
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button size="sm" onClick={onQuote} className="text-white shadow-sm transition hover:opacity-90" style={brandStyle}>
          <Send className="mr-1.5 h-3.5 w-3.5" />
          <span className="hidden sm:inline">Request quote</span>
          <span className="sm:hidden">Quote</span>
        </Button>
        {/* mobile: properties/BOM */}
        <Button variant="outline" size="sm" className="lg:hidden" onClick={onOpenPanels} aria-label="Properties and parts list">
          <PanelBottom className="h-4 w-4" />
        </Button>
      </div>

      {embed && (
        <span className="ml-1 hidden rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 xl:inline">
          {dealer?.name ?? settings.shopName}
        </span>
      )}
    </header>
  )
}
