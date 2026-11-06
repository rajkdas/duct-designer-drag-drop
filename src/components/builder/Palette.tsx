'use client'

import { useMemo, useState } from 'react'
import { useBuilder } from '@/lib/store'
import { MACHINES, paletteGroup, paletteGroupLabel, paletteGroupOrder, type PartGeo } from '@/lib/geo'
import type { ProductDTO } from '@/lib/types'
import { formatMoney, formatMm } from '@/lib/types'
import { CategoryThumb } from './PartThumbs'
import { PartThumb } from './PartShape'
import { ChevronDown, ChevronRight, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'

// ---------------------------------------------------------------------------
// Parts catalogue — matches the approved design: search field on top, then
// bordered category cards with metallic 3D thumbnails (Rohre · Bögen ·
// Abzweiger · Reduzierungen · Absperrschieber · Anschlüsse · Zubehör …),
// expandable into a part grid. Search flattens across categories.
// ---------------------------------------------------------------------------

export function Palette() {
  const products = useBuilder((s) => s.products)
  const settings = useBuilder((s) => s.settings)
  const placing = useBuilder((s) => s.placing)
  const setPlacing = useBuilder((s) => s.setPlacing)
  const [q, setQ] = useState('')
  const [openCats, setOpenCats] = useState<Set<string>>(() => new Set())

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return products
    return products.filter((p) => `${p.sku} ${p.name}`.toLowerCase().includes(needle))
  }, [products, q])

  const searching = q.trim().length > 0

  const grouped = useMemo(() => {
    const groups = new Map<string, ProductDTO[]>()
    for (const p of filtered) {
      const g = paletteGroup(p.category)
      const arr = groups.get(g) ?? []
      arr.push(p)
      groups.set(g, arr)
    }
    return [...groups.entries()].sort((a, b) => paletteGroupOrder(a[0]) - paletteGroupOrder(b[0]))
  }, [filtered])

  const toggleCat = (cat: string) => {
    setOpenCats((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  const thumbGeo = (p: ProductDTO): PartGeo => ({
    category: p.category,
    diameterMm: p.diameterMm,
    diameter2Mm: p.diameter2Mm,
    lengthMm: p.lengthMm,
    angleDeg: p.angleDeg,
    branchAngleDeg: p.branchAngleDeg,
  })

  const activeRing = 'border-[var(--brand)] bg-blue-50/60 ring-1 ring-[var(--brand)]'
  const idleRing = 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-[0_2px_8px_-4px_rgba(15,23,42,0.18)]'

  return (
    <div className="flex h-full flex-col">
      {/* search — design: rounded field with magnifier */}
      <div className="border-b border-[#eceef3] p-3 pb-2.5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Bauteil suchen …"
            className="h-10 rounded-lg border-[#d7dae2] bg-white pl-9 text-sm text-slate-700 placeholder:text-slate-400 focus-visible:bg-white focus-visible:ring-[var(--brand)]/30"
            aria-label="Bauteil suchen"
          />
        </div>
      </div>

      <ScrollArea className="dd-scroll min-h-0 flex-1">
        <div className="space-y-1.5 p-2.5">
          {searching ? (
            /* ---- flat search results ---- */
            grouped.map(([grp, list]) => (
              <section key={grp}>
                <h3 className="mb-1.5 px-1 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">{paletteGroupLabel(grp)}</h3>
                <PartGrid list={list} placing={placing} setPlacing={setPlacing} settings={settings} thumbGeo={thumbGeo} activeRing={activeRing} idleRing={idleRing} />
              </section>
            ))
          ) : (
            /* ---- category cards (design rows) ---- */
            grouped.map(([grp, list]) => {
              const open = openCats.has(grp)
              return (
                <div key={grp}>
                  <button
                    onClick={() => toggleCat(grp)}
                    aria-expanded={open}
                    className="dd-cat-card flex w-full items-center gap-2.5 text-left"
                  >
                    <span className="flex h-[52px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-md">
                      <CategoryThumb kind={grp as never} className="h-full w-full" />
                    </span>
                    <span className="min-w-0 flex-1 text-[15px] font-bold text-[#1f2937]">{paletteGroupLabel(grp)}</span>
                    {open ? (
                      <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                    )}
                  </button>
                  {open && (
                    <div className="px-1 pb-1.5 pt-1.5">
                      <PartGrid list={list} placing={placing} setPlacing={setPlacing} settings={settings} thumbGeo={thumbGeo} activeRing={activeRing} idleRing={idleRing} />
                    </div>
                  )}
                </div>
              )
            })
          )}

          {/* machines — free layout aids */}
          {!searching && (
            <div className="pt-1">
              <button
                onClick={() => toggleCat('__machines')}
                aria-expanded={openCats.has('__machines')}
                className="dd-cat-card flex w-full items-center gap-2.5 text-left"
              >
                <span className="flex h-[52px] w-[72px] shrink-0 items-center justify-center rounded-md bg-gradient-to-b from-slate-50 to-slate-100/80">
                  <CategoryThumb kind="__machines" className="h-full w-full" />
                </span>
                <span className="min-w-0 flex-1 text-[14px] font-bold text-[#1f2937]">Maschinen</span>
                {openCats.has('__machines') ? <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" /> : <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />}
              </button>
              {openCats.has('__machines') && (
                <div className="grid grid-cols-2 gap-1.5 px-1 pb-1.5 pt-1.5">
                  {MACHINES.map((m) => {
                    const active = placing?.kind === 'machine' && placing.machine === m.type
                    return (
                      <button
                        key={m.type}
                        onPointerDown={() => setPlacing(active ? null : { kind: 'machine', machine: m.type })}
                        className={`group flex flex-col items-start gap-1 rounded-lg border p-2 text-left transition ${active ? activeRing : idleRing}`}
                      >
                        <PartThumb geo={{ category: 'MACHINE', diameterMm: m.drop, machineType: m.type }} size={34} />
                        <span className="text-xs leading-tight font-medium text-slate-700">{m.label}</span>
                        <span className="text-[10px] text-slate-400">
                          {m.w} × {m.d} m · Ø{m.drop}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {filtered.length === 0 && (
            <p className="px-2 py-8 text-center text-sm text-slate-400">Keine Teile für „{q}“ gefunden.</p>
          )}
          <p className="px-1.5 pb-2 pt-1 text-[10px] leading-relaxed text-slate-400">
            Tipp: Teil auf die Zeichenfläche ziehen — Anschlüsse rasten automatisch ein. <kbd className="rounded border border-slate-200 bg-slate-50 px-1">R</kbd> dreht,
            <kbd className="ml-1 rounded border border-slate-200 bg-slate-50 px-1">Entf</kbd> löscht.
          </p>
        </div>
      </ScrollArea>
    </div>
  )
}

function PartGrid({
  list,
  placing,
  setPlacing,
  settings,
  thumbGeo,
  activeRing,
  idleRing,
}: {
  list: ProductDTO[]
  placing: ReturnType<typeof useBuilder.getState>['placing']
  setPlacing: ReturnType<typeof useBuilder.getState>['setPlacing']
  settings: ReturnType<typeof useBuilder.getState>['settings']
  thumbGeo: (p: ProductDTO) => PartGeo
  activeRing: string
  idleRing: string
}) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {list.map((p) => {
        const active = placing?.kind === 'product' && placing.productId === p.id
        return (
          <button
            key={p.id}
            onPointerDown={() => setPlacing(active ? null : { kind: 'product', productId: p.id })}
            title={`${p.sku} — ${p.description ?? p.name}`}
            className={`group flex items-start gap-2 rounded-lg border p-2 text-left transition ${active ? activeRing : idleRing}`}
          >
            <PartThumb geo={thumbGeo(p)} sku={p.sku} size={34} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[11px] leading-tight font-medium text-slate-700">{p.name}</span>
              <span className="mt-0.5 block truncate text-[10px] text-slate-400">
                Ø{p.diameterMm}
                {p.lengthMm ? ` · ${formatMm(p.lengthMm)} mm` : ''}
              </span>
              <span className="block text-[11px] font-bold text-[var(--brand)]">{formatMoney(p.price, settings.currency)}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
