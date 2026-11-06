'use client'

import { useCallback, useEffect, useState } from 'react'
import type { DealerDTO } from '@/lib/types'
import { formatMoney } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Plus, Pencil, PauseCircle, PlayCircle, Trash2, Loader2, Code2, ExternalLink } from 'lucide-react'
import { StatusBadge } from './AdminApp'

// ---------------------------------------------------------------------------
// Dealer & licence management: add dealers, set the monthly fee, brand colour,
// suspend/reactivate, and copy the embed snippet for their website.
// ---------------------------------------------------------------------------

const emptyForm = { slug: '', name: '', contactEmail: '', monthlyFee: 49, brandColor: '#ea580c', status: 'TRIAL', notes: '' }

export function DealersPanel() {
  const [dealers, setDealers] = useState<DealerDTO[] | null>(null)
  const [editing, setEditing] = useState<DealerDTO | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [busy, setBusy] = useState(false)
  const [snippetFor, setSnippetFor] = useState<DealerDTO | null>(null)

  const load = useCallback(async () => {
    const r = await fetch('/api/dealers')
    if (r.ok) setDealers(await r.json())
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const r = await fetch('/api/dealers')
      if (!cancelled && r.ok) setDealers(await r.json())
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const save = async () => {
    setBusy(true)
    try {
      const r = await fetch(editing ? `/api/dealers/${editing.id}` : '/api/dealers', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? 'Save failed')
      toast.success(editing ? 'Dealer updated' : 'Dealer added')
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

  const patch = async (d: DealerDTO, data: Record<string, unknown>) => {
    await fetch(`/api/dealers/${d.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    load()
  }

  const remove = async (d: DealerDTO) => {
    if (!confirm(`Delete dealer "${d.name}"? Their designs and quotes stay in the database but lose the dealer label.`)) return
    const r = await fetch(`/api/dealers/${d.id}`, { method: 'DELETE' })
    if (r.ok) {
      toast.success('Dealer deleted')
      load()
    } else toast.error('Could not delete dealer')
  }

  const openEdit = (d: DealerDTO) => {
    setEditing(d)
    setForm({
      slug: d.slug,
      name: d.name,
      contactEmail: d.contactEmail ?? '',
      monthlyFee: d.monthlyFee,
      brandColor: d.brandColor,
      status: d.status,
      notes: d.notes ?? '',
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Dealers & licences</h1>
          <p className="text-xs text-slate-400">White-label partners embedding the configurator on their own sites for a monthly fee.</p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setAdding(true)
            setForm(emptyForm)
          }}
        >
          <Plus className="mr-1.5 h-4 w-4" /> Add dealer
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] tracking-wide text-slate-400 uppercase">
              <th className="px-4 py-2.5 font-semibold">Dealer</th>
              <th className="px-3 py-2.5 font-semibold">Licence</th>
              <th className="px-3 py-2.5 text-right font-semibold">Fee / month</th>
              <th className="px-3 py-2.5 text-center font-semibold">Designs</th>
              <th className="px-3 py-2.5 text-center font-semibold">Quotes</th>
              <th className="px-4 py-2.5 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(dealers ?? []).map((d) => (
              <tr key={d.id} className="border-b border-slate-50 last:border-0">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="h-7 w-7 shrink-0 rounded-lg ring-1 ring-slate-200" style={{ background: d.brandColor }} aria-hidden />
                    <div>
                      <p className="font-semibold text-slate-700">{d.name}</p>
                      <p className="font-mono text-[11px] text-slate-400">{d.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <StatusBadge status={d.status} />
                </td>
                <td className="px-3 py-2.5 text-right font-semibold text-slate-700">{formatMoney(d.monthlyFee)}</td>
                <td className="px-3 py-2.5 text-center text-slate-600">{d.designCount ?? 0}</td>
                <td className="px-3 py-2.5 text-center text-slate-600">{d.quoteCount ?? 0}</td>
                <td className="px-4 py-2.5">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Embed snippet" onClick={() => setSnippetFor(d)}>
                      <Code2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit" onClick={() => openEdit(d)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title={d.status === 'SUSPENDED' ? 'Reactivate' : 'Suspend'}
                      onClick={() => patch(d, { status: d.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED' })}
                    >
                      {d.status === 'SUSPENDED' ? <PlayCircle className="h-4 w-4 text-green-600" /> : <PauseCircle className="h-4 w-4 text-amber-500" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" title="Delete" onClick={() => remove(d)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {dealers && dealers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">
                  No dealers yet — add your first white-label partner.
                </td>
              </tr>
            )}
            {!dealers && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-slate-400" />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* add / edit dialog */}
      <Dialog open={adding || !!editing} onOpenChange={(v) => { if (!v) { setAdding(false); setEditing(null) } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.name}` : 'Add a dealer'}</DialogTitle>
            <DialogDescription>The slug is used in the embed snippet and as the white-label sub-domain.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Company name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="HolzProfi Werkzeuge GmbH" />
              </div>
              <div className="space-y-1.5">
                <Label>Slug</Label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="holzprofi" disabled={!!editing} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Contact email</Label>
                <Input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} placeholder="sales@dealer.com" />
              </div>
              <div className="space-y-1.5">
                <Label>Monthly fee (€)</Label>
                <Input type="number" min={0} value={form.monthlyFee} onChange={(e) => setForm({ ...form, monthlyFee: Number(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="TRIAL">Trial</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Brand colour</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.brandColor} onChange={(e) => setForm({ ...form, brandColor: e.target.value })} className="h-9 w-12 cursor-pointer rounded-md border border-slate-200 bg-white p-1" aria-label="Brand colour" />
                  <Input value={form.brandColor} onChange={(e) => setForm({ ...form, brandColor: e.target.value })} className="font-mono text-xs" />
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Contract start, invoicing notes…" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
              <span>Suspended dealers see a “licence suspended” screen instead of the configurator.</span>
              <Switch checked={form.status !== 'SUSPENDED'} onCheckedChange={(v) => setForm({ ...form, status: v ? 'ACTIVE' : 'SUSPENDED' })} aria-label="Licence active" />
            </div>
            <Button onClick={save} disabled={busy} className="w-full">
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {editing ? 'Save changes' : 'Create dealer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* embed snippet dialog */}
      <Dialog open={!!snippetFor} onOpenChange={(v) => !v && setSnippetFor(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Embed code — {snippetFor?.name}</DialogTitle>
            <DialogDescription>
              Either paste this snippet where the configurator should appear, or link the white-label sub-domain to the app (see Documentation → Dealers).
            </DialogDescription>
          </DialogHeader>
          {snippetFor && (
            <div className="space-y-3">
              <div>
                <p className="mb-1 text-xs font-semibold text-slate-500">Option A — script snippet (auto-height iframe)</p>
                <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 text-[11px] leading-relaxed text-slate-100">
                  {`<div id="duct-designer"></div>\n<script\n  src="${typeof window !== 'undefined' ? window.location.origin : ''}/embed.js"\n  data-dealer="${snippetFor.slug}"\n  data-height="760">\n</script>`}
                </pre>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold text-slate-500">Option B — iframe (WordPress “Custom HTML” block)</p>
                <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 text-[11px] leading-relaxed text-slate-100">
                  {`<iframe\n  src="${typeof window !== 'undefined' ? window.location.origin : ''}/?embed=1&dealer=${snippetFor.slug}"\n  style="width:100%;height:760px;border:0"\n  title="Dust extraction configurator">\n</iframe>`}
                </pre>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold text-slate-500">Option C — white-label sub-domain</p>
                <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-600">
                  {snippetFor.slug}.your-domain.com <span className="font-sans text-slate-400">(DNS wildcard → this app, see docs)</span>
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `<div id="duct-designer"></div>\n<script src="${window.location.origin}/embed.js" data-dealer="${snippetFor.slug}" data-height="760"></script>`
                  )
                  toast.success('Snippet copied')
                }}
              >
                Copy snippet
              </Button>
              <a href={`/?embed=1&dealer=${snippetFor.slug}`} target="_blank" rel="noreferrer">
                <Button variant="ghost" className="w-full text-slate-500">
                  Preview embedded version <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
