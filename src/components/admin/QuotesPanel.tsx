'use client'

import { useEffect, useMemo, useState } from 'react'
import type { QuoteDTO } from '@/lib/types'
import { formatMoney } from '@/lib/types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, ExternalLink } from 'lucide-react'
import { StatusBadge } from './AdminApp'

const STATUS_LABELS: Record<string, string> = {
  NEW: 'New',
  IN_PROGRESS: 'In progress',
  QUOTED: 'Quoted',
  CLOSED: 'Closed',
}

export function QuotesPanel() {
  const [quotes, setQuotes] = useState<QuoteDTO[] | null>(null)
  const [filter, setFilter] = useState('all')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let alive = true
    fetch('/api/quotes')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && d) setQuotes(d)
      })
    return () => {
      alive = false
    }
  }, [reload])

  const set = async (q: QuoteDTO, status: string) => {
    setQuotes((prev) => prev?.map((x) => (x.id === q.id ? { ...x, status } : x)) ?? prev)
    await fetch(`/api/quotes/${q.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
  }

  const filtered = useMemo(() => (quotes ?? []).filter((q) => filter === 'all' || q.status === filter), [quotes, filter])

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Quote requests</h1>
          <p className="text-xs text-slate-400">Submitted from the configurator — on your site or via a dealer embed.</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="h-9 w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] tracking-wide text-slate-400 uppercase">
              <th className="px-4 py-2.5 font-semibold">Customer</th>
              <th className="px-3 py-2.5 font-semibold">Contact</th>
              <th className="px-3 py-2.5 font-semibold">Design</th>
              <th className="px-3 py-2.5 font-semibold">Channel</th>
              <th className="px-3 py-2.5 text-right font-semibold">Total (gross)</th>
              <th className="px-3 py-2.5 font-semibold">Received</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((q) => (
              <tr key={q.id} className="border-b border-slate-50 align-top last:border-0">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-700">{q.name}</p>
                  {q.company && <p className="text-xs text-slate-400">{q.company}</p>}
                  {q.message && <p className="mt-1 max-w-[280px] text-xs leading-relaxed text-slate-500 italic">“{q.message}”</p>}
                </td>
                <td className="px-3 py-3 text-xs">
                  <p className="text-slate-600">{q.email}</p>
                  {q.phone && <p className="text-slate-400">{q.phone}</p>}
                </td>
                <td className="px-3 py-3">
                  {q.designShareId ? (
                    <a href={`/?design=${q.designShareId}`} target="_blank" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-[var(--brand)]">
                      {q.designName ?? 'Open design'} <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
                <td className="px-3 py-3 text-xs text-slate-500">{q.dealerName ?? 'Own site'}</td>
                <td className="px-3 py-3 text-right font-semibold text-slate-700">{formatMoney(q.totalGross)}</td>
                <td className="px-3 py-3 text-xs text-slate-400">{new Date(q.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col items-start gap-1.5">
                    <StatusBadge status={q.status} />
                    <Select value={q.status} onValueChange={(v) => set(q, v)}>
                      <SelectTrigger className="h-7 w-32 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </td>
              </tr>
            ))}
            {quotes && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-400">
                  No quote requests in this view.
                </td>
              </tr>
            )}
            {!quotes && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-slate-400" />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
