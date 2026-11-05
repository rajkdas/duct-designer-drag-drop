'use client'

import { useMemo } from 'react'
import { useBuilder } from '@/lib/store'
import { aggregateBom, bomTotals, formatMoney, type BomRow } from '@/lib/types'
import { ScrollArea } from '@/components/ui/scroll-area'

// ---------------------------------------------------------------------------
// Live bill of materials — aggregates placed items by product, prices from
// the current catalogue (which the admin panel / WooCommerce sync maintains).
// ---------------------------------------------------------------------------

export function useBom() {
  const items = useBuilder((s) => s.items)
  const products = useBuilder((s) => s.products)
  const vatRate = useBuilder((s) => s.settings.vatRate)
  return useMemo(() => {
    const rows = aggregateBom(items, products)
    return { rows, totals: bomTotals(rows, vatRate) }
  }, [items, products, vatRate])
}

export function BomPanel({ onQuote }: { onQuote?: () => void }) {
  const { rows, totals } = useBom()
  const settings = useBuilder((s) => s.settings)
  const select = useBuilder((s) => s.select)
  const items = useBuilder((s) => s.items)
  const dealer = useBuilder((s) => s.dealer)
  const seller = dealer?.name ?? settings.shopName

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 border-b border-slate-100 px-4 py-2.5">
        <h3 className="text-sm font-semibold text-slate-700">
          Bill of materials <span className="ml-1 font-normal text-slate-400">({items.length} placed · {rows.reduce((s, r) => s + r.qty, 0)} priced)</span>
        </h3>
        {onQuote && (
          <button onClick={onQuote} className="rounded-md bg-[var(--brand)] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:opacity-90" style={{ background: 'var(--brand)' }}>
            Request quote
          </button>
        )}
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <table className="w-full table-fixed text-left text-[11px]">
          <colgroup>
            <col className="w-[92px]" />
            <col />
            <col className="w-[30px]" />
            <col className="w-[56px]" />
            <col className="w-[70px]" />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_#e2e8f0]">
            <tr className="text-[10px] tracking-wide text-slate-400 uppercase">
              <th className="px-2 py-2 font-semibold">SKU</th>
              <th className="px-1 py-2 font-semibold">Description</th>
              <th className="px-1 py-2 text-center font-semibold">Qty</th>
              <th className="px-1 py-2 text-right font-semibold">Unit</th>
              <th className="px-2 py-2 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <BomRowView key={r.productId} row={r} currency={settings.currency} onSelect={() => {
                const first = items.find((i) => i.productId === r.productId || i.sku === r.sku)
                if (first) select(first.id)
              }} />
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  Your parts list will appear here as you place parts on the canvas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </ScrollArea>
      {rows.length > 0 && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3 text-sm">
          <div className="flex justify-between py-0.5 text-slate-600">
            <span>Net total ({rows.reduce((s, r) => s + r.qty, 0)} priced parts)</span>
            <span className="font-semibold text-slate-800">{formatMoney(totals.net, settings.currency)}</span>
          </div>
          <div className="flex justify-between py-0.5 text-slate-600">
            <span>VAT ({totals.vatRate}%)</span>
            <span className="font-semibold text-slate-800">{formatMoney(totals.vat, settings.currency)}</span>
          </div>
          <div className="mt-1 flex justify-between border-t border-slate-200 pt-1.5 text-base font-bold text-slate-900">
            <span>Gross total</span>
            <span>{formatMoney(totals.gross, settings.currency)}</span>
          </div>
          <p className="mt-1.5 text-[10px] text-slate-400">Live prices from {seller} · priced today</p>
        </div>
      )}
    </div>
  )
}

function BomRowView({ row, currency, onSelect }: { row: BomRow; currency: string; onSelect: () => void }) {
  return (
    <tr className="cursor-pointer border-b border-slate-50 transition hover:bg-orange-50/40" onClick={onSelect}>
      <td className="truncate px-2 py-2 font-mono text-[10px] font-semibold text-slate-500">{row.sku}</td>
      <td className="truncate px-1 py-2 font-medium text-slate-700" title={row.description ?? row.name}>
        {row.name}
      </td>
      <td className="px-1 py-2 text-center font-semibold text-slate-800">{row.qty}×</td>
      <td className="px-1 py-2 text-right whitespace-nowrap text-slate-600">{formatMoney(row.unitPrice, currency)}</td>
      <td className="px-2 py-2 text-right font-semibold whitespace-nowrap text-slate-800">{formatMoney(row.total, currency)}</td>
    </tr>
  )
}
