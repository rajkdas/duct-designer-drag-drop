'use client'

import { useBuilder } from '@/lib/store'
import { machineDef, categoryLabel } from '@/lib/geo'
import { formatMoney, type BomRow } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { RotateCw, Trash2, Copy, Mountain } from 'lucide-react'

// ---------------------------------------------------------------------------
// Right-hand properties panel: room settings when nothing is selected, part
// properties (SKU, price, height, rotation, label) when a part is selected.
// ---------------------------------------------------------------------------

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
  const productOf = useBuilder((s) => s.productOf)

  const item = items.find((i) => i.id === selectedId) ?? null
  const product = item ? productOf(item) : undefined
  const machine = item?.machine ? machineDef(item.machine) : undefined

  if (!item) {
    const machines = items.filter((i) => i.machine).length
    const units = items.filter((i) => products.find((p) => p.id === i.productId)?.category === 'UNIT').length
    return (
      <div className="space-y-4 p-4">
        <h3 className="text-sm font-semibold text-slate-700">Workshop & layout</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="room-w" className="text-xs text-slate-500">Room width (m)</Label>
            <Input
              id="room-w"
              type="number"
              min={4}
              max={60}
              value={room.w}
              onChange={(e) => setRoom(Math.min(60, Math.max(4, Number(e.target.value) || 4)), room.h)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="room-h" className="text-xs text-slate-500">Room depth (m)</Label>
            <Input
              id="room-h"
              type="number"
              min={4}
              max={60}
              value={room.h}
              onChange={(e) => setRoom(room.w, Math.min(60, Math.max(4, Number(e.target.value) || 4)))}
            />
          </div>
        </div>
        <Separator />
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Parts placed</dt>
            <dd className="font-semibold text-slate-700">{items.length}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Machines</dt>
            <dd className="font-semibold text-slate-700">{machines}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Collector units</dt>
            <dd className="font-semibold text-slate-700">{units}</dd>
          </div>
        </dl>
        <p className="rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-500">
          Select a part on the canvas to edit its height, rotation and label. Pipes default to a 2,800 mm ceiling run; flex hoses drop to 900 mm at the machine.
        </p>
      </div>
    )
  }

  const geo = product ?? null
  const hasZ2 = geo ? ['FLEX', 'PIPE'].includes(geo.category) : false

  return (
    <div className="space-y-4 p-4">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-mono text-[11px] font-semibold tracking-wide text-slate-400">{machine ? 'LAYOUT AID' : product?.sku}</p>
            <h3 className="truncate text-sm font-semibold text-slate-800">{machine ? machine.label : product?.name}</h3>
          </div>
          {product && (
            <span className="shrink-0 rounded-md bg-slate-800 px-2 py-1 text-xs font-bold text-white">{formatMoney(product.price, settings.currency)}</span>
          )}
        </div>
        {machine && <p className="mt-1 text-xs text-slate-500">Not priced — represents a machine in the workshop. Footprint {machine.w} × {machine.d} m, take-off Ø{machine.drop} mm.</p>}
        {product && <p className="mt-1 text-xs leading-relaxed text-slate-500">{product.description}</p>}
        {product && (
          <p className="mt-1.5 text-[11px] text-slate-400">
            {categoryLabel(product.category)}
            {product.diameter2Mm ? ` · Ø${product.diameterMm}/Ø${product.diameter2Mm}` : ` · Ø${product.diameterMm}`}
            {product.lengthMm ? ` · ${product.lengthMm} mm` : ''}
            {product.angleDeg ? ` · ${product.angleDeg}°` : ''}
            {product.stock !== null ? ` · ${product.stock} in stock` : ''}
          </p>
        )}
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-slate-500">Rotation</Label>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => rotateItem(item.id, -22.5)} aria-label="Rotate left">
              <RotateCw className="h-4 w-4 -scale-x-100" />
            </Button>
            <span className="w-14 text-center text-sm font-semibold text-slate-700">{item.rot}°</span>
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => rotateItem(item.id, 22.5)} aria-label="Rotate right">
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="z-height" className="flex items-center gap-1 text-xs text-slate-500">
            <Mountain className="h-3 w-3" /> Height (mm)
          </Label>
          <Input
            id="z-height"
            type="number"
            min={0}
            max={6000}
            step={50}
            value={item.z}
            onChange={(e) => setItemZ(item.id, Math.min(6000, Math.max(0, Number(e.target.value) || 0)))}
          />
        </div>
      </div>

      {hasZ2 && (
        <div className="space-y-1.5">
          <Label htmlFor="z2-height" className="text-xs text-slate-500">Outlet height (mm) — for drops</Label>
          <Input
            id="z2-height"
            type="number"
            min={0}
            max={6000}
            step={50}
            value={item.z2 ?? item.z}
            onChange={(e) => setItemZ(item.id, Math.min(6000, Math.max(0, Number(e.target.value) || 0)), true)}
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="item-label" className="text-xs text-slate-500">Label (shown on plan)</Label>
        <Input
          id="item-label"
          value={item.label ?? ''}
          placeholder={machine?.label ?? 'e.g. Planer line'}
          onChange={(e) => setItemLabel(item.id, e.target.value)}
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button variant="outline" size="sm" className="flex-1" onClick={() => duplicateItem(item.id)}>
          <Copy className="mr-1.5 h-3.5 w-3.5" /> Duplicate
        </Button>
        <Button variant="outline" size="sm" className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => removeItem(item.id)}>
          <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Remove
        </Button>
      </div>
    </div>
  )
}

export type { BomRow }
