'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ProductDTO } from '@/lib/types'
import { formatMoney } from '@/lib/types'
import { categoryLabel, CATEGORIES } from '@/lib/geo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Plus, RefreshCw, Search, Loader2, Pencil } from 'lucide-react'

// ---------------------------------------------------------------------------
// Product & price maintenance. Prices shown in the configurator come from
// here; keep them in sync with WooCommerce with one click (see docs).
// ---------------------------------------------------------------------------

const emptyForm = {
  sku: '',
  name: '',
  description: '',
  category: 'PIPE',
  diameterMm: 160,
  diameter2Mm: '' as number | '',
  lengthMm: '' as number | '',
  angleDeg: '' as number | '',
  branchAngleDeg: '' as number | '',
  price: 0,
  stock: 25,
  active: true,
}

export function ProductsPanel() {
  const [products, setProducts] = useState<ProductDTO[] | null>(null)
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<string>('all')
  const [editing, setEditing] = useState<ProductDTO | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [busy, setBusy] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    const r = await fetch('/api/products')
    if (r.ok) setProducts(await r.json())
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const r = await fetch('/api/products')
      if (!cancelled && r.ok) setProducts(await r.json())
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return (products ?? []).filter(
      (p) => (cat === 'all' || p.category === cat) && (!needle || `${p.sku} ${p.name}`.toLowerCase().includes(needle))
    )
  }, [products, q, cat])

  const save = async () => {
    setBusy(true)
    try {
      const payload = {
        ...form,
        diameter2Mm: form.diameter2Mm === '' ? null : form.diameter2Mm,
        lengthMm: form.lengthMm === '' ? null : form.lengthMm,
        angleDeg: form.angleDeg === '' ? null : form.angleDeg,
        branchAngleDeg: form.branchAngleDeg === '' ? null : form.branchAngleDeg,
      }
      const r = await fetch(editing ? '/api/products' : '/api/products', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing ? { ...payload, id: editing.id } : payload),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? 'Save failed')
      toast.success(editing ? 'Product updated' : 'Product added')
      setAdding(false)
      setEditing(null)
      setForm(emptyForm)
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  const patch = async (p: ProductDTO, data: Record<string, unknown>) => {
    const r = await fetch('/api/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: p.id, ...data }),
    })
    if (r.ok) load()
    else toast.error('Update failed')
  }

  const sync = async () => {
    setSyncing(true)
    setSyncMsg(null)
    try {
      const r = await fetch('/api/products/sync', { method: 'POST' })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? 'Sync failed')
      if (d.configured) {
        setSyncMsg(`Sync finished: ${d.created} created, ${d.updated} updated, ${d.skipped} skipped. Category mapping runs automatically — check the geometry fields.`)
        toast.success('WooCommerce sync complete')
        load()
      } else {
        setSyncMsg(d.message)
        toast.info('WooCommerce not configured yet')
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  const openEdit = (p: ProductDTO) => {
    setEditing(p)
    setForm({
      sku: p.sku,
      name: p.name,
      description: p.description ?? '',
      category: p.category,
      diameterMm: p.diameterMm,
      diameter2Mm: p.diameter2Mm ?? '',
      lengthMm: p.lengthMm ?? '',
      angleDeg: p.angleDeg ?? '',
      branchAngleDeg: p.branchAngleDeg ?? '',
      price: p.price,
      stock: p.stock ?? 0,
      active: p.active,
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Products & prices</h1>
          <p className="text-xs text-slate-400">
            {products?.length ?? '…'} SKUs · the configurator prices its bill of materials from this table
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={sync} disabled={syncing}>
            {syncing ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1.5 h-4 w-4" />} Sync from WooCommerce
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setAdding(true)
              setForm(emptyForm)
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Add product
          </Button>
        </div>
      </div>

      {syncMsg && <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">{syncMsg}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search SKU or name…" className="h-9 pl-8" />
        </div>
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="h-9 w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.filter((c) => c.key !== 'MACHINE').map((c) => (
              <SelectItem key={c.key} value={c.key}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] tracking-wide text-slate-400 uppercase">
              <th className="px-4 py-2.5 font-semibold">SKU</th>
              <th className="px-3 py-2.5 font-semibold">Name</th>
              <th className="px-3 py-2.5 font-semibold">Geometry</th>
              <th className="px-3 py-2.5 text-right font-semibold">Price €</th>
              <th className="px-3 py-2.5 text-center font-semibold">Stock</th>
              <th className="px-4 py-2.5 text-center font-semibold">Active</th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-slate-50 last:border-0">
                <td className="px-4 py-2 font-mono text-xs font-semibold text-slate-500">{p.sku}</td>
                <td className="max-w-[260px] truncate px-3 py-2 font-medium text-slate-700" title={p.description ?? ''}>
                  {p.name}
                </td>
                <td className="px-3 py-2 text-xs text-slate-500">
                  {categoryLabel(p.category).replace(' (free layout aids)', '')} · Ø{p.diameterMm}
                  {p.diameter2Mm ? `/${p.diameter2Mm}` : ''}
                  {p.lengthMm ? ` · ${p.lengthMm}mm` : ''}
                  {p.angleDeg ? ` · ${p.angleDeg}°` : ''}
                </td>
                <td className="px-3 py-2 text-right">
                  <input
                    type="number"
                    step="0.1"
                    defaultValue={p.price}
                    onBlur={(e) => {
                      const v = Number(e.target.value)
                      if (v !== p.price && v >= 0) patch(p, { price: v })
                    }}
                    className="w-20 rounded-md border border-transparent px-2 py-1 text-right text-sm font-semibold text-slate-800 hover:border-slate-200 focus:border-slate-400 focus:outline-none"
                    aria-label={`Price for ${p.sku}`}
                  />
                </td>
                <td className="px-3 py-2 text-center text-slate-600">{p.stock ?? '—'}</td>
                <td className="px-4 py-2 text-center">
                  <Switch checked={p.active} onCheckedChange={(v) => patch(p, { active: v })} aria-label={`Active ${p.sku}`} />
                </td>
                <td className="px-3 py-2 text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)} title="Edit">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {products && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-400">
                  No products match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={adding || !!editing} onOpenChange={(v) => { if (!v) { setAdding(false); setEditing(null) } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.sku}` : 'Add product'}</DialogTitle>
            <DialogDescription>Geometry drives how the part is drawn on the canvas. Widths are in mm.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>SKU *</Label>
              <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="R-200-1000" disabled={!!editing} />
            </div>
            <div className="space-y-1.5">
              <Label>Price € *</Label>
              <Input type="number" step="0.1" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) || 0 })} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Straight pipe Ø200 × 1000 mm" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Galvanised steel, with sealing lip" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.filter((c) => c.key !== 'MACHINE').map((c) => (
                    <SelectItem key={c.key} value={c.key}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Diameter mm</Label>
              <Input type="number" value={form.diameterMm} onChange={(e) => setForm({ ...form, diameterMm: Number(e.target.value) || 0 })} />
            </div>
            <div className="space-y-1.5">
              <Label>Second Ø (reducer/branch)</Label>
              <Input type="number" value={form.diameter2Mm} onChange={(e) => setForm({ ...form, diameter2Mm: e.target.value === '' ? '' : Number(e.target.value) })} />
            </div>
            <div className="space-y-1.5">
              <Label>Length mm (pipes/flex)</Label>
              <Input type="number" value={form.lengthMm} onChange={(e) => setForm({ ...form, lengthMm: e.target.value === '' ? '' : Number(e.target.value) })} />
            </div>
            <div className="space-y-1.5">
              <Label>Angle ° (bends)</Label>
              <Input type="number" value={form.angleDeg} onChange={(e) => setForm({ ...form, angleDeg: e.target.value === '' ? '' : Number(e.target.value) })} />
            </div>
            <div className="space-y-1.5">
              <Label>Branch angle ° (Y-pieces)</Label>
              <Input type="number" value={form.branchAngleDeg} onChange={(e) => setForm({ ...form, branchAngleDeg: e.target.value === '' ? '' : Number(e.target.value) })} />
            </div>
            <div className="space-y-1.5">
              <Label>Stock</Label>
              <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) || 0 })} />
            </div>
            <div className="col-span-2 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
              <span>Active (visible in the configurator)</span>
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
            </div>
          </div>
          <Button onClick={save} disabled={busy} className="w-full">
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {editing ? 'Save changes' : 'Add product'}
          </Button>
          {editing && (
            <p className="text-center text-[11px] text-slate-400">
              Current price {formatMoney(editing.price)} · geometry preview updates in the configurator immediately.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
