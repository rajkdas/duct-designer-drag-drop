'use client'

import { useMemo, useState } from 'react'
import { useBuilder } from '@/lib/store'
import { CATEGORIES, MACHINES, categoryLabel, categoryOrder } from '@/lib/geo'
import type { ProductDTO } from '@/lib/types'
import { formatMoney } from '@/lib/types'
import { PartThumb } from './PartShape'
import { Search, Factory } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'

export function Palette() {
  const products = useBuilder((s) => s.products)
  const settings = useBuilder((s) => s.settings)
  const placing = useBuilder((s) => s.placing)
  const setPlacing = useBuilder((s) => s.setPlacing)
  const [q, setQ] = useState('')
  const [dia, setDia] = useState<number | null>(null)

  const diameters = useMemo(() => [...new Set(products.map((p) => p.diameterMm))].sort((a, b) => a - b), [products])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return products.filter((p) => {
      if (dia !== null && p.diameterMm !== dia && p.diameter2Mm !== dia) return false
      if (!needle) return true
      return `${p.sku} ${p.name}`.toLowerCase().includes(needle)
    })
  }, [products, q, dia])

  const machinesShown = !q.trim()

  const grouped = useMemo(() => {
    const groups = new Map<string, ProductDTO[]>()
    for (const p of filtered) {
      const arr = groups.get(p.category) ?? []
      arr.push(p)
      groups.set(p.category, arr)
    }
    return [...groups.entries()].sort((a, b) => categoryOrder(a[0]) - categoryOrder(b[0]))
  }, [filtered])

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="space-y-2 border-b border-slate-100 p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search SKU or name…"
            className="h-9 border-slate-200 pl-8 text-sm"
            aria-label="Search parts"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setDia(null)}
            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition ${dia === null ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-200 text-slate-600 hover:border-slate-400'}`}
          >
            All Ø
          </button>
          {diameters.map((d) => (
            <button
              key={d}
              onClick={() => setDia(dia === d ? null : d)}
              className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition ${dia === d ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-200 text-slate-600 hover:border-slate-400'}`}
            >
              Ø{d}
            </button>
          ))}
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-4 p-3">
          {machinesShown && (
            <section>
              <h3 className="mb-1.5 flex items-center gap-1.5 px-1 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
                <Factory className="h-3.5 w-3.5" /> Machines — free layout aids
              </h3>
              <div className="grid grid-cols-2 gap-1.5">
                {MACHINES.map((m) => {
                  const active = placing?.kind === 'machine' && placing.machine === m.type
                  return (
                    <button
                      key={m.type}
                      onPointerDown={() => setPlacing(active ? null : { kind: 'machine', machine: m.type })}
                      className={`group flex flex-col items-start gap-1 rounded-lg border p-2 text-left transition ${
                        active ? 'border-[var(--brand)] bg-orange-50/60 ring-1 ring-[var(--brand)]' : 'border-slate-200 bg-white hover:border-slate-400 hover:shadow-sm'
                      }`}
                    >
                      <PartThumb geo={{ category: 'MACHINE', diameterMm: m.drop, machineType: m.type }} size={38} />
                      <span className="text-xs leading-tight font-medium text-slate-700">{m.label}</span>
                      <span className="text-[10px] text-slate-400">
                        {m.w} × {m.d} m · Ø{m.drop} take-off
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>
          )}

          {grouped.map(([cat, list]) => (
            <section key={cat}>
              <h3 className="mb-1.5 px-1 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">{categoryLabel(cat)}</h3>
              <div className="grid grid-cols-2 gap-1.5">
                {list.map((p) => {
                  const active = placing?.kind === 'product' && placing.productId === p.id
                  const geo = {
                    category: p.category,
                    diameterMm: p.diameterMm,
                    diameter2Mm: p.diameter2Mm,
                    lengthMm: p.lengthMm,
                    angleDeg: p.angleDeg,
                    branchAngleDeg: p.branchAngleDeg,
                  }
                  return (
                    <button
                      key={p.id}
                      onPointerDown={() => setPlacing(active ? null : { kind: 'product', productId: p.id })}
                      title={`${p.sku} — ${p.description ?? p.name}`}
                      className={`group flex items-start gap-2 rounded-lg border p-2 text-left transition ${
                        active ? 'border-[var(--brand)] bg-orange-50/60 ring-1 ring-[var(--brand)]' : 'border-slate-200 bg-white hover:border-slate-400 hover:shadow-sm'
                      }`}
                    >
                      <PartThumb geo={geo} sku={p.sku} size={40} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-mono text-[10px] font-semibold text-slate-400">{p.sku}</span>
                        <span className="block truncate text-xs leading-tight font-medium text-slate-700">{shortLabel(p)}</span>
                        <span className="mt-0.5 block text-xs font-semibold text-[var(--brand)]">{formatMoney(p.price, settings.currency)}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>
          ))}

          {filtered.length === 0 && !machinesShown && (
            <p className="px-2 py-8 text-center text-sm text-slate-400">No parts match “{q}”.</p>
          )}
          <p className="px-2 pb-2 text-[10px] leading-relaxed text-slate-400">
            Tip: drag a part onto the canvas — connection ports snap together automatically. Press <kbd className="rounded border border-slate-200 bg-slate-50 px-1">R</kbd> to rotate,
            <kbd className="ml-1 rounded border border-slate-200 bg-slate-50 px-1">Del</kbd> to remove.
          </p>
        </div>
      </ScrollArea>
    </div>
  )
}

function shortLabel(p: ProductDTO) {
  const cut = p.name.replace('Straight pipe', 'Pipe').replace('segmental bend', 'bend')
  return cut.length > 26 ? cut.slice(0, 25) + '…' : cut
}

export { CATEGORIES }
