'use client'

import { useMemo, useState } from 'react'
import { useBuilder } from '@/lib/store'
import { aggregateBom, bomTotals, formatMoney, formatMm, type BomRow } from '@/lib/types'
import { ScrollArea } from '@/components/ui/scroll-area'

// ---------------------------------------------------------------------------
// Bottom bill-of-materials — approved design: tabbed table (Stückliste ·
// Positionen · Projektinfo) with German columns and a totals card whose
// "Gesamt (brutto)" row carries the light-blue highlight.
// ---------------------------------------------------------------------------

export function useBom() {
  const items = useBuilder((s) => s.items)
  const products = useBuilder((s) => s.products)
  const vatRate = useBuilder((s) => s.settings.vatRate)
  return useMemo(() => {
    const rows = aggregateBom(items, products)
    // approved design order: Rohre → Bögen → Abzweiger → … → Absauganlagen last
    const order = (cat: string) =>
      ({ PIPE: 0, BEND: 1, YBRANCH: 2, TBRANCH: 3, REDUCER: 4, GATE: 5, HOOD: 6, FLEX: 7, COUPLING: 8, CAP: 9, UNIT: 10 } as Record<string, number>)[cat] ?? 20
    rows.sort((a, b) => order(a.category) - order(b.category) || a.sku.localeCompare(b.sku))
    return { rows, totals: bomTotals(rows, vatRate) }
  }, [items, products, vatRate])
}

type BomTab = 'bom' | 'positions' | 'project'

export function BomPanel({ readOnly = false, side = false, totalsAside = false }: { onQuote?: () => void; readOnly?: boolean; side?: boolean; totalsAside?: boolean }) {
  const { rows, totals } = useBom()
  const settings = useBuilder((s) => s.settings)
  const select = useBuilder((s) => s.select)
  const items = useBuilder((s) => s.items)
  const products = useBuilder((s) => s.products)
  const dealer = useBuilder((s) => s.dealer)
  const designName = useBuilder((s) => s.designName)
  const customer = useBuilder((s) => s.customer)
  const room = useBuilder((s) => s.room)
  const geoOf = useBuilder((s) => s.geoOf)
  const seller = dealer?.name ?? settings.shopName
  const [tab, setTab] = useState<BomTab>('bom')

  const pricedQty = rows.reduce((s, r) => s + r.qty, 0)
  const machines = items.filter((i) => i.machine).length
  const units = items.filter((i) => products.find((p) => p.id === i.productId)?.category === 'UNIT').length

  const positions = useMemo(
    () =>
      items.map((it, idx) => {
        const geo = geoOf(it)
        const p = products.find((x) => x.id === it.productId)
        return {
          idx: idx + 1,
          id: it.id,
          sku: p?.sku ?? geo.category,
          name: it.label || p?.name || geo.category,
          z: it.z,
          price: p?.price ?? null,
        }
      }),
    [items, products, geoOf]
  )

  const tabs: { key: BomTab; label: string }[] = [
    { key: 'bom', label: `Stückliste (${pricedQty})` },
    { key: 'positions', label: `Positionen (${items.length})` },
    { key: 'project', label: 'Projektinfo' },
  ]

  return (
    <div className={`flex h-full min-h-0 flex-col gap-3 ${side ? '' : 'lg:flex-row'}`}>
      {/* left: tabbed table card */}
      <div className="dd-card flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex items-center gap-1 border-b border-[#eceef3] px-2">
          {tabs.map((t) => (
            <button key={t.key} className="dd-tab" data-active={tab === t.key} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        <ScrollArea className="dd-scroll min-h-0 flex-1">
          {tab === 'bom' && (
            <table className={`w-full text-left text-[13px] ${side ? 'table-fixed' : ''}`}>
              <colgroup>{side && <><col className="w-10" /><col className="w-[92px]" /><col /><col className="w-[58px]" /><col className="w-[86px]" /></>}</colgroup>
              <thead className="sticky top-0 z-10 bg-[#f8f9fb]/95 shadow-[0_1px_0_0_#e5e7ee] backdrop-blur">
                <tr className="text-[12px] font-semibold text-[#4b5568]">
                  <th className="w-12 px-3 py-2">Pos.</th>
                  <th className="w-28 px-1 py-2">Artikel</th>
                  <th className="px-1 py-2">Bezeichnung</th>
                  {!side && <th className="w-24 px-1 py-2">Durchmesser</th>}
                  {!side && <th className="w-20 px-1 py-2">Länge</th>}
                  <th className="w-16 px-1 py-2 text-right">Menge</th>
                  {!side && <th className="w-24 px-1 py-2 text-right">Einzelpreis</th>}
                  <th className="w-24 px-3 py-2 text-right">Gesamt</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <BomRowView
                    key={r.productId}
                    row={r}
                    pos={i + 1}
                    side={side}
                    currency={settings.currency}
                    onSelect={
                      readOnly
                        ? undefined
                        : () => {
                            const first = items.find((it) => it.productId === r.productId || it.sku === r.sku)
                            if (first) select(first.id)
                          }
                    }
                  />
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={side ? 5 : 8} className="px-4 py-10 text-center text-slate-400">
                      Die Stückliste füllt sich automatisch, sobald Sie Teile auf der Zeichenfläche platzieren.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {tab === 'positions' && (
            <table className="w-full text-left text-[13px]">
              <colgroup>{side && <><col className="w-10" /><col className="w-[92px]" /><col /><col className="w-[70px]" /><col className="w-[86px]" /></>}</colgroup>
              <thead className="sticky top-0 z-10 bg-[#f8f9fb]/95 shadow-[0_1px_0_0_#e5e7ee] backdrop-blur">
                <tr className="text-[12px] font-semibold text-[#4b5568]">
                  <th className="w-12 px-3 py-2">Pos.</th>
                  <th className="w-28 px-1 py-2">Artikel</th>
                  <th className="px-1 py-2">Bezeichnung</th>
                  <th className="w-24 px-1 py-2 text-right">Höhe</th>
                  <th className="w-24 px-3 py-2 text-right">Preis</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((p) => (
                  <tr
                    key={p.id}
                    className={`cursor-pointer border-b border-[#f2f3f7] transition hover:bg-blue-50/40 ${!readOnly ? '' : 'cursor-default'}`}
                    onClick={() => !readOnly && select(p.id)}
                  >
                    <td className="px-3 py-1.5 text-slate-400">{p.idx}</td>
                    <td className="truncate px-1 py-1.5 font-mono text-[11px] font-semibold text-slate-500">{p.sku}</td>
                    <td className="truncate px-1 py-1.5 font-medium text-slate-700">{p.name}</td>
                    <td className="px-1 py-1.5 text-right whitespace-nowrap text-slate-600">{formatMm(p.z)} mm</td>
                    <td className="px-3 py-1.5 text-right whitespace-nowrap font-medium text-slate-700">
                      {p.price === null ? '—' : formatMoney(p.price, settings.currency)}
                    </td>
                  </tr>
                ))}
                {positions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                      Noch keine Teile platziert.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {tab === 'project' && (
            <dl className="grid grid-cols-[130px_1fr] gap-x-3 gap-y-1.5 p-4 text-[13px] sm:grid-cols-[150px_1fr]">
              <dt className="text-slate-500">Projekt</dt>
              <dd className="font-medium text-slate-800">{designName}</dd>
              <dt className="text-slate-500">Kunde</dt>
              <dd className="font-medium text-slate-800">{customer || '—'}</dd>
              <dt className="text-slate-500">Hallengröße</dt>
              <dd className="font-medium text-slate-800">
                {room.w.toFixed(2).replace('.', ',')} × {room.h.toFixed(2).replace('.', ',')} m
              </dd>
              <dt className="text-slate-500">Teile platziert</dt>
              <dd className="font-medium text-slate-800">
                {items.length} · {machines} Maschinen · {units} Absauganlagen
              </dd>
              <dt className="text-slate-500">Preisbelegte Teile</dt>
              <dd className="font-medium text-slate-800">{pricedQty}</dd>
              <dt className="text-slate-500">Anbieter</dt>
              <dd className="font-medium text-slate-800">{seller}</dd>
              <dt className="text-slate-500">Preise</dt>
              <dd className="font-medium text-slate-800">Live aus dem Katalog · MwSt. {totals.vatRate} %</dd>
            </dl>
          )}
        </ScrollArea>
      </div>

      {/* right: totals card — skipped when the parent renders it in its own aside */}
      {!totalsAside && <BomTotalsCard />}
    </div>
  )
}

/**
 * Totals card — approved design places it in the RIGHT column below the
 * properties panel: Gesamt (netto) · MwSt. · Gesamt (brutto, highlighted).
 */
export function BomTotalsCard() {
  const { totals } = useBom()
  const settings = useBuilder((s) => s.settings)
  const dealer = useBuilder((s) => s.dealer)
  const seller = dealer?.name ?? settings.shopName
  return (
    <div className="dd-card flex shrink-0 flex-col justify-center gap-1 p-4">
      <div className="space-y-1 text-[13px]">
        <div className="flex justify-between">
          <span className="text-[#4b5568]">Gesamt (netto)</span>
          <span className="font-semibold text-slate-700">{formatMoney(totals.net, settings.currency)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#4b5568]">MwSt. ({totals.vatRate} %)</span>
          <span className="font-semibold text-slate-700">{formatMoney(totals.vat, settings.currency)}</span>
        </div>
        <div className="mt-1.5 flex items-baseline justify-between rounded-lg bg-[#e8eefc] px-3 py-2">
          <span className="text-[13px] font-bold text-[var(--brand)]">Gesamt (brutto)</span>
          <span className="text-[15px] font-extrabold text-[var(--brand)]">{formatMoney(totals.gross, settings.currency)}</span>
        </div>
        <p className="pt-0.5 text-[10px] leading-relaxed text-slate-400">Live-Preise von {seller} · heute kalkuliert</p>
      </div>
    </div>
  )
}

function BomRowView({ row, pos, currency, onSelect, side = false }: { row: BomRow; pos: number; currency: string; onSelect?: () => void; side?: boolean }) {
  return (
    <tr className={`border-b border-[#f2f3f7] transition hover:bg-blue-50/40 ${onSelect ? 'cursor-pointer' : ''}`} onClick={onSelect}>
      <td className="px-3 py-1.5 text-slate-500">{pos}</td>
      <td className="truncate px-1 py-1.5 font-mono text-[11px] font-semibold text-slate-600">{row.sku}</td>
      <td className="truncate px-1 py-1.5 font-medium text-slate-700" title={row.description ?? row.name}>
        {row.name}
      </td>
      {!side && <td className="px-1 py-1.5 whitespace-nowrap text-slate-600">{row.diameterMm ? `Ø ${row.diameterMm} mm` : '—'}</td>}
      {!side && <td className="px-1 py-1.5 whitespace-nowrap text-slate-600">{row.lengthMm ? `${formatMm(row.lengthMm)} mm` : '—'}</td>}
      <td className="px-1 py-1.5 text-right font-semibold whitespace-nowrap text-slate-800">{row.qty} Stk.</td>
      {!side && <td className="px-1 py-1.5 text-right whitespace-nowrap text-slate-600">{formatMoney(row.unitPrice, currency)}</td>}
      <td className="px-3 py-1.5 text-right font-bold whitespace-nowrap text-slate-900">{formatMoney(row.total, currency)}</td>
    </tr>
  )
}
