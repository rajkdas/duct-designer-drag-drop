'use client'

import { useState } from 'react'
import { useBuilder } from '@/lib/store'
import { formatMoney } from '@/lib/types'
import { useBom } from './BomPanel'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { CheckCircle2, Loader2, Send } from 'lucide-react'

export function QuoteDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { totals, rows } = useBom()
  const settings = useBuilder((s) => s.settings)
  const dealer = useBuilder((s) => s.dealer)
  const designName = useBuilder((s) => s.designName)
  const items = useBuilder((s) => s.items)
  const shareId = useBuilder((s) => s.shareId)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', message: '' })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Please fill in your name and email.')
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          designShareId: shareId,
          dealerSlug: dealer?.slug,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong')
      setDone(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not send the request')
    } finally {
      setBusy(false)
    }
  }

  const seller = dealer?.name ?? settings.shopName

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setTimeout(() => setDone(false), 300) }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {!done ? (
          <>
            <DialogHeader>
              <DialogTitle>Request a quote</DialogTitle>
              <DialogDescription>
                Your layout and live parts list are sent to <strong>{seller}</strong> together with this message.
              </DialogDescription>
            </DialogHeader>
            <div className="mb-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Design</span>
                <span className="font-medium text-slate-700">{designName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Parts</span>
                <span className="font-medium text-slate-700">
                  {items.length} placed · {rows.length} line items
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gross total (incl. {totals.vatRate}% VAT)</span>
                <span className="font-bold text-slate-800">{formatMoney(totals.gross, settings.currency)}</span>
              </div>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="q-name">Name *</Label>
                  <Input id="q-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Markus Muster" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="q-company">Company</Label>
                  <Input id="q-company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Muster Joinery" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="q-email">Email *</Label>
                  <Input id="q-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="q-phone">Phone</Label>
                  <Input id="q-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+49 …" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="q-msg">Message</Label>
                <Textarea id="q-msg" rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Preferred installation date, questions about the collector size…" />
              </div>
              <Button type="submit" disabled={busy} className="w-full text-white" style={{ background: 'var(--brand)' }}>
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {busy ? 'Sending…' : 'Send quote request'}
              </Button>
              <p className="text-center text-[11px] text-slate-400">By sending you agree that {seller} may contact you about this request.</p>
            </form>
          </>
        ) : (
          <div className="py-6 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
            <h3 className="mt-3 text-lg font-semibold text-slate-800">Request sent!</h3>
            <p className="mx-auto mt-1 max-w-xs text-sm text-slate-500">
              {seller} received your layout and parts list and will reply to <strong>{form.email}</strong> shortly.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => onOpenChange(false)}>
              Back to the planner
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
