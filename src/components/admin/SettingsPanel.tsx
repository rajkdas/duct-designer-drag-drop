'use client'

import { useEffect, useState } from 'react'
import type { SettingsDTO } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'

const CURRENCIES = ['EUR', 'CHF', 'GBP', 'USD', 'DKK', 'SEK', 'NOK', 'PLN']

export function SettingsPanel({ onSaved }: { onSaved: () => void }) {
  const [form, setForm] = useState<SettingsDTO | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then(setForm)
  }, [])

  if (!form) return <Loader2 className="mx-auto mt-10 h-6 w-6 animate-spin text-slate-400" />

  const save = async () => {
    setBusy(true)
    try {
      const r = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, vatRate: Number(form.vatRate) }),
      })
      if (!r.ok) throw new Error()
      toast.success('Settings saved')
      onSaved()
    } catch {
      toast.error('Could not save settings')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-xl space-y-4">
      <div>
        <h1 className="text-lg font-bold text-slate-800">Shop settings</h1>
        <p className="text-xs text-slate-400">Branding and pricing basics used across the configurator, share links and PDF exports.</p>
      </div>

      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Shop name</Label>
            <Input value={form.shopName} onChange={(e) => setForm({ ...form, shopName: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Contact email (quotes)</Label>
            <Input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Tagline</Label>
          <Input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label>Currency</Label>
            <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>VAT rate %</Label>
            <Input type="number" step="0.5" value={form.vatRate} onChange={(e) => setForm({ ...form, vatRate: Number(e.target.value) || 0 })} />
          </div>
          <div className="space-y-1.5">
            <Label>Brand colour</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.brandColor}
                onChange={(e) => setForm({ ...form, brandColor: e.target.value })}
                className="h-9 w-12 cursor-pointer rounded-md border border-slate-200 bg-white p-1"
                aria-label="Brand colour"
              />
              <Input value={form.brandColor} onChange={(e) => setForm({ ...form, brandColor: e.target.value })} className="font-mono text-xs" />
            </div>
          </div>
        </div>
        <Button onClick={save} disabled={busy} className="w-full">
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save settings
        </Button>
      </div>

      <p className="rounded-lg border border-slate-200 bg-white p-4 text-xs leading-relaxed text-slate-500">
        <strong className="text-slate-700">WooCommerce connection:</strong> set <code className="rounded bg-slate-100 px-1">WOO_STORE_URL</code>,{' '}
        <code className="rounded bg-slate-100 px-1">WOO_CONSUMER_KEY</code> and <code className="rounded bg-slate-100 px-1">WOO_CONSUMER_SECRET</code> in the
        server <code className="rounded bg-slate-100 px-1">.env</code>, then use “Sync from WooCommerce” in Products. Details in the documentation.
      </p>
    </div>
  )
}
