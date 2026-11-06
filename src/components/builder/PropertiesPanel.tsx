'use client'


import { useBuilder } from '@/lib/store'
import { useBom } from './BomPanel'
import { machineDef, paletteGroup, type PartGeo } from '@/lib/geo'
import { formatMoney, formatMm, type BomRow } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PartThumb } from './PartShape'
import { Copy, RotateCw, Trash2 } from 'lucide-react'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

// ---------------------------------------------------------------------------
// Right-hand properties panel — approved design: label left, bordered control
// right (Durchmesser · Länge · Höhe (Z) · Position X · Position Y · Material).
// Room ("Halle") settings when nothing is selected.
// ---------------------------------------------------------------------------

function Row({ label, children, htmlFor }: { label: string; children: React.ReactNode; htmlFor?: string }) {
  return (
    <div className="grid grid-cols-[80px_1fr] items-center gap-2 py-[5px]">
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-[#3f4a5f]">
        {label}
      </label>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

function FieldInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Input
      {...props}
      className={`h-10 rounded-lg border-[#d7dae2] bg-white text-[12.5px] font-semibold text-slate-800 shadow-none focus-visible:ring-[var(--brand)]/30 ${props.className ?? ''}`}
    />
  )
}

/** German-formatted millimetre text field — displays "2.800", parses dotted input */
function MmField({ id, value, onCommit, min = 0, max = 6000, step = 50, suffix = 'mm', onFocus }: { id?: string; value: number; onCommit: (v: number) => void; min?: number; max?: number; step?: number; suffix?: string; onFocus?: () => void }) {
  return (
    <div className="relative">
      <FieldInput
        id={id}
        type="text"
        inputMode="numeric"
        className="pr-11"
        value={formatMm(value)}
        onFocus={onFocus}
        onChange={(e) => {
          const raw = e.target.value.replace(/[.\s,'’]/g, '')
          const n = Number(raw)
          if (!Number.isNaN(n)) onCommit(Math.min(max, Math.max(min, n)))
        }}
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-medium text-slate-400">{suffix}</span>
    </div>
  )
}

function FieldSelect({ value, onValueChange, children, ariaLabel }: { value: string; onValueChange: (v: string) => void; children: React.ReactNode; ariaLabel?: string }) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        aria-label={ariaLabel}
        className="h-10 w-full gap-1 rounded-lg border-[#d7dae2] bg-white px-2.5 text-[12.5px] font-semibold text-slate-800 shadow-none focus:ring-[var(--brand)]/30"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  )
}

/** compact part name like the approved design ("Rohr (gerade)") */
function shortPartName(geo: { category: string; angleDeg?: number | null; branchAngleDeg?: number | null } | null, machineLabel?: string): string {
  if (!geo) return machineLabel ?? 'Objekt'
  switch (geo.category) {
    case 'PIPE':
      return 'Rohr (gerade)'
    case 'BEND':
      return `Bogen ${geo.angleDeg ?? 90}°`
    case 'YBRANCH':
      return `Y-Abzweiger ${geo.branchAngleDeg ?? 45}°`
    case 'TBRANCH':
      return 'T-Stück 90°'
    case 'REDUCER':
      return 'Reduzierung'
    case 'GATE':
      return 'Absperrschieber'
    case 'COUPLING':
      return 'Muffe'
    case 'CAP':
      return 'Endkappe'
    case 'FLEX':
      return 'Flexschlauch'
    case 'HOOD':
      return 'Absaughaube'
    case 'UNIT':
      return 'Absauganlage'
    default:
      return machineLabel ?? 'Objekt'
  }
}

export function PropertiesPanel() {
  const items = useBuilder((s) => s.items)
  const selectedId = useBuilder((s) => s.selectedId)
  const room = useBuilder((s) => s.room)
  const setRoom = useBuilder((s) => s.setRoom)
  const products = useBuilder((s) => s.products)
  const settings = useBuilder((s) => s.settings)
  const rotateItem = useBuilder((s) => s.rotateItem)
  const removeItem = useBuilder((s) => s.removeItem)
  const duplicateItem = useBuilder((s) => s.duplicateItem)
  const setItemZ = useBuilder((s) => s.setItemZ)
  const setItemLabel = useBuilder((s) => s.setItemLabel)
  const setItemPos = useBuilder((s) => s.setItemPos)
  const swapProduct = useBuilder((s) => s.swapProduct)
  const pushHistory = useBuilder((s) => s.pushHistory)
  const productOf = useBuilder((s) => s.productOf)

  const item = items.find((i) => i.id === selectedId) ?? null
  const product = item ? productOf(item) : undefined
  const machine = item?.machine ? machineDef(item.machine) : undefined

  // --- no selection: hall settings (design uses the same panel for meta) ----
  if (!item) {
    const machines = items.filter((i) => i.machine).length
    const units = items.filter((i) => products.find((p) => p.id === i.productId)?.category === 'UNIT').length
    return (
      <div className="p-4">
        <h3 className="mb-2 text-[15px] font-bold text-[#1f2937]">Halle</h3>
        <div>
          <Row label="Breite (m)" htmlFor="room-w">
            <FieldInput
              id="room-w"
              type="number"
              min={4}
              max={60}
              value={room.w}
              onFocus={pushHistory}
              onChange={(e) => setRoom(Math.min(60, Math.max(4, Number(e.target.value) || 4)), room.h)}
            />
          </Row>
          <Row label="Länge (m)" htmlFor="room-h">
            <FieldInput
              id="room-h"
              type="number"
              min={4}
              max={60}
              value={room.h}
              onFocus={pushHistory}
              onChange={(e) => setRoom(room.w, Math.min(60, Math.max(4, Number(e.target.value) || 4)))}
            />
          </Row>
        </div>
        <div className="mt-3 rounded-lg border border-[#eceef3] bg-[#f7f8fa] p-3">
          <dl className="space-y-1.5 text-[13px]">
            <div className="flex justify-between">
              <dt className="text-slate-500">Teile platziert</dt>
              <dd className="font-semibold text-slate-800">{items.length}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Maschinen</dt>
              <dd className="font-semibold text-slate-800">{machines}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Absauganlagen</dt>
              <dd className="font-semibold text-slate-800">{units}</dd>
            </div>
          </dl>
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
          Teil auf der Zeichenfläche auswählen, um Durchmesser, Höhe, Position und Material zu bearbeiten. Rohre laufen standardmäßig auf 2.800 mm Deckenhöhe; Flexschläuche sinken an der Maschine auf 900 mm.
        </p>
      </div>
    )
  }

  const geo = product ?? null
  const isFlexOrPipe = geo ? ['FLEX', 'PIPE'].includes(geo.category) : false
  const grp = geo ? paletteGroup(geo.category) : null

  // available diameters within the same palette group (for the Ø select) —
  // plain computation, NOT useMemo: hooks must not run after the early return
  const diameters =
    grp && grp !== 'UNIT' && grp !== '__machines' && geo
      ? [...new Set(products.filter((p) => paletteGroup(p.category) === grp).map((p) => p.diameterMm))].sort((a, b) => a - b)
      : []

  // available lengths for the current diameter (pipe / flex)
  const lengths =
    geo && isFlexOrPipe
      ? [
          ...new Set(
            products
              .filter((p) => p.category === geo.category && p.diameterMm === geo.diameterMm && p.lengthMm)
              .map((p) => p.lengthMm!)
          ),
        ].sort((a, b) => a - b)
      : []

  /** find replacement product: same category (+length if applicable), new diameter */
  const productFor = (diameter: number, length?: number | null) => {
    if (!geo) return undefined
    const candidates = products.filter((p) => p.category === geo.category && p.diameterMm === diameter)
    if (length) return candidates.find((p) => p.lengthMm === length) ?? candidates.sort((a, b) => (a.lengthMm ?? 0) - (b.lengthMm ?? 0))[0]
    return candidates.find((p) => p.lengthMm === geo.lengthMm) ?? candidates.sort((a, b) => (a.lengthMm ?? 0) - (b.lengthMm ?? 0))[0]
  }

  return (
    <div className="p-4">
      {/* part header — thumbnail + name, design style */}
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-12 w-[68px] shrink-0 items-center justify-center overflow-hidden rounded-md border border-[#eceef3] bg-white">
          <PartThumb geo={machine ? { category: 'MACHINE', diameterMm: machine.drop, machineType: machine.type } : { category: product!.category as PartGeo['category'], diameterMm: product!.diameterMm, diameter2Mm: product!.diameter2Mm, lengthMm: product!.lengthMm, angleDeg: product!.angleDeg, branchAngleDeg: product!.branchAngleDeg }} sku={product?.sku} size={56} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-bold text-[#1f2937]" title={machine ? machine.label : product?.name}>
            {machine ? machine.label : shortPartName(geo)}
          </p>
          {product && (
            <p className="text-[12px] font-semibold text-[var(--brand)]">{formatMoney(product.price, settings.currency)}</p>
          )}
        </div>
      </div>

      {machine && (
        <p className="mb-2 text-[11px] leading-relaxed text-slate-400">
          Layout-Hilfe ohne Preis — Stellfläche {machine.w} × {machine.d} m, Absaugstutzen Ø{machine.drop} mm.
        </p>
      )}

      <div>
        {/* Durchmesser */}
        {machine ? (
          <Row label="Durchmesser">
            <FieldInput value={`Ø ${machine.drop} mm`} readOnly aria-label="Absaugstutzen" />
          </Row>
        ) : diameters.length > 0 && geo ? (
          <Row label="Durchmesser">
            <FieldSelect
              ariaLabel="Durchmesser"
              value={String(geo.diameterMm)}
              onValueChange={(v) => {
                const next = productFor(Number(v))
                if (next) swapProduct(item.id, next.id)
              }}
            >
              {diameters.map((d) => (
                <SelectItem key={d} value={String(d)}>
                  Ø {d} mm
                </SelectItem>
              ))}
            </FieldSelect>
          </Row>
        ) : geo ? (
          <Row label="Durchmesser">
            <FieldInput value={`Ø ${geo.diameterMm} mm`} readOnly aria-label="Durchmesser" />
          </Row>
        ) : null}

        {/* Länge */}
        {geo && isFlexOrPipe && lengths.length > 0 && (
          <Row label="Länge">
            <FieldSelect
              ariaLabel="Länge"
              value={String(geo.lengthMm ?? lengths[0])}
              onValueChange={(v) => {
                const next = productFor(geo.diameterMm, Number(v))
                if (next) swapProduct(item.id, next.id)
              }}
            >
              {lengths.map((l) => (
                <SelectItem key={l} value={String(l)}>
                  {formatMm(l)} mm
                </SelectItem>
              ))}
            </FieldSelect>
          </Row>
        )}

        {/* Höhe (Z) */}
        <Row label="Höhe (Z)" htmlFor="z-height">
          <MmField
            id="z-height"
            value={item.z}
            onFocus={pushHistory}
            onCommit={(v) => setItemZ(item.id, v)}
          />
        </Row>

        {/* Position X / Y */}
        <Row label="Position X" htmlFor="pos-x">
          <MmField
            id="pos-x"
            value={Math.round(item.x * 1000)}
            max={60000}
            onFocus={pushHistory}
            onCommit={(v) => setItemPos(item.id, v / 1000, item.y)}
          />
        </Row>
        <Row label="Position Y" htmlFor="pos-y">
          <MmField
            id="pos-y"
            value={Math.round(item.y * 1000)}
            max={60000}
            onFocus={pushHistory}
            onCommit={(v) => setItemPos(item.id, item.x, v / 1000)}
          />
        </Row>

        {/* Material */}
        <Row label="Material">
          <FieldSelect ariaLabel="Material" value="verzinkt" onValueChange={() => {}}>
            <SelectItem value="verzinkt">Verzinkter Stahl</SelectItem>
          </FieldSelect>
        </Row>

        {/* Drehung */}
        <Row label="Drehung">
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-lg border-[#d7dae2]" onClick={() => rotateItem(item.id, -22.5)} aria-label="Nach links drehen">
              <RotateCw className="h-4 w-4 -scale-x-100" />
            </Button>
            <span className="w-12 text-center text-[13px] font-semibold text-slate-700">{item.rot}°</span>
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-lg border-[#d7dae2]" onClick={() => rotateItem(item.id, 22.5)} aria-label="Nach rechts drehen">
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>
        </Row>

        {/* Beschriftung */}
        <Row label="Beschriftung" htmlFor="item-label">
          <FieldInput
            id="item-label"
            value={item.label ?? ''}
            placeholder={machine?.label ?? 'z. B. Hobellinie'}
            onFocus={pushHistory}
            onChange={(e) => setItemLabel(item.id, e.target.value)}
          />
        </Row>
      </div>

      <div className="mt-4 flex gap-1.5">
        <Button variant="outline" size="sm" className="h-9 flex-1 rounded-lg border-[#d7dae2] px-2 text-[12px] font-semibold" onClick={() => duplicateItem(item.id)}>
          <Copy className="mr-1 h-3.5 w-3.5" /> Duplizieren
        </Button>
        <Button variant="outline" size="sm" className="h-9 flex-1 rounded-lg border-red-200 px-2 text-[12px] font-semibold text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => removeItem(item.id)}>
          <Trash2 className="mr-1 h-3.5 w-3.5" /> Entfernen
        </Button>
      </div>
    </div>
  )
}

export type { BomRow }

// ---------------------------------------------------------------------------
// Project panel — left-aside "Projekt" tab.
// ---------------------------------------------------------------------------

export function ProjectPanel() {
  const designName = useBuilder((s) => s.designName)
  const setDesignName = useBuilder((s) => s.setDesignName)
  const customer = useBuilder((s) => s.customer)
  const setCustomer = useBuilder((s) => s.setCustomer)
  const room = useBuilder((s) => s.room)
  const setRoom = useBuilder((s) => s.setRoom)
  const items = useBuilder((s) => s.items)
  const products = useBuilder((s) => s.products)

  const machines = items.filter((i) => i.machine).length
  const units = items.filter((i) => products.find((p) => p.id === i.productId)?.category === 'UNIT').length

  return (
    <div className="p-4">
      <h3 className="mb-2 text-[15px] font-bold text-[#1f2937]">Projekt</h3>
      <div>
        <Row label="Name" htmlFor="proj-name">
          <FieldInput id="proj-name" value={designName} onChange={(e) => setDesignName(e.target.value)} placeholder="Projektname" />
        </Row>
        <Row label="Kunde" htmlFor="proj-customer">
          <FieldInput id="proj-customer" value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Kunde (optional)" />
        </Row>
        <Row label="Breite (m)" htmlFor="proj-w">
          <FieldInput id="proj-w" type="number" min={4} max={60} value={room.w} onFocus={() => useBuilder.getState().pushHistory()} onChange={(e) => setRoom(Math.min(60, Math.max(4, Number(e.target.value) || 4)), room.h)} />
        </Row>
        <Row label="Länge (m)" htmlFor="proj-h">
          <FieldInput id="proj-h" type="number" min={4} max={60} value={room.h} onFocus={() => useBuilder.getState().pushHistory()} onChange={(e) => setRoom(room.w, Math.min(60, Math.max(4, Number(e.target.value) || 4)))} />
        </Row>
      </div>
      <div className="mt-3 rounded-lg border border-[#eceef3] bg-[#f7f8fa] p-3">
        <dl className="space-y-1.5 text-[13px]">
          <div className="flex justify-between">
            <dt className="text-slate-500">Teile platziert</dt>
            <dd className="font-semibold text-slate-800">{items.length}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Maschinen</dt>
            <dd className="font-semibold text-slate-800">{machines}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Absauganlagen</dt>
            <dd className="font-semibold text-slate-800">{units}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Calculation panel — "Berechnung" tab: live totals summary.
// ---------------------------------------------------------------------------

export function CalculationPanel() {
  const { rows, totals } = useBom()
  const settings = useBuilder((s) => s.settings)
  const items = useBuilder((s) => s.items)
  const dealer = useBuilder((s) => s.dealer)
  const seller = dealer?.name ?? settings.shopName

  return (
    <div className="p-4">
      <h3 className="mb-2 text-[15px] font-bold text-[#1f2937]">Berechnung</h3>
      <div className="rounded-lg border border-[#eceef3] bg-[#f7f8fa] p-3 text-[13px]">
        <dl className="space-y-1.5">
          <div className="flex justify-between">
            <dt className="text-slate-500">Positionen (Artikel)</dt>
            <dd className="font-semibold text-slate-800">{rows.length}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Preisbelegte Teile</dt>
            <dd className="font-semibold text-slate-800">{rows.reduce((s, r) => s + r.qty, 0)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Gesamt (netto)</dt>
            <dd className="font-semibold text-slate-800">{formatMoney(totals.net, settings.currency)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">MwSt. ({totals.vatRate} %)</dt>
            <dd className="font-semibold text-slate-800">{formatMoney(totals.vat, settings.currency)}</dd>
          </div>
        </dl>
      </div>
      <div className="mt-3 flex items-baseline justify-between border-t border-[#e5e7ee] pt-3">
        <span className="text-[14px] font-bold text-[#111827]">Gesamt (brutto)</span>
        <span className="text-lg font-extrabold text-[var(--brand)]">{formatMoney(totals.gross, settings.currency)}</span>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
        Live-Preise aus dem Katalog von {seller}. Mengen werden pro Artikel aus allen platzierten Teilen aggregiert.
      </p>
    </div>
  )
}
