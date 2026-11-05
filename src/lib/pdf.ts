'use client'

import type { BomRow, BomTotals, SettingsDTO } from '@/lib/types'
import { formatMoney } from '@/lib/types'

// ---------------------------------------------------------------------------
// Client-side PDF export of the BOM / quote document (jsPDF + autotable).
// Dynamically imported so jsPDF never loads during SSR.
// ---------------------------------------------------------------------------

export interface PdfDesignInfo {
  name: string
  customer?: string | null
  room: { w: number; h: number }
  shareUrl?: string
  dealerName?: string | null
  itemCount: number
}

export async function exportBomPdf(info: PdfDesignInfo, rows: BomRow[], totals: BomTotals, settings: SettingsDTO) {
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const brand = settings.brandColor
  const seller = info.dealerName ? `${settings.shopName} × ${info.dealerName}` : settings.shopName

  // header band
  doc.setFillColor(15, 23, 42)
  doc.rect(0, 0, 210, 30, 'F')
  doc.setFillColor(brand)
  doc.rect(0, 30, 210, 1.4, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text(seller, 14, 12)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(settings.tagline, 14, 18.5)
  doc.setFontSize(8)
  doc.text(`Generated ${new Date().toLocaleDateString('en-GB')} · BIMA DuctDesigner`, 196, 18.5, { align: 'right' })

  // meta block
  doc.setTextColor(30, 41, 59)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text(info.name, 14, 43)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  let y = 49
  const metaLeft: string[] = []
  if (info.customer) metaLeft.push(`Customer: ${info.customer}`)
  metaLeft.push(`Workshop: ${info.room.w} × ${info.room.h} m`)
  metaLeft.push(`Parts placed: ${info.itemCount}`)
  for (const line of metaLeft) {
    doc.text(line, 14, y)
    y += 5
  }
  if (info.shareUrl) {
    doc.setTextColor(234, 88, 12)
    doc.text(`Design link: ${info.shareUrl}`, 14, y + 1)
    doc.setTextColor(100, 116, 139)
  }

  // table
  autoTable(doc, {
    startY: y + 8,
    head: [['SKU', 'Description', 'Qty', 'Unit price', 'Line total']],
    body: rows.map((r) => [r.sku, r.name, `${r.qty} ×`, formatMoney(r.unitPrice, settings.currency), formatMoney(r.total, settings.currency)]),
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 2.4, textColor: [51, 65, 85] },
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 30, fontStyle: 'bold', textColor: [100, 116, 139] },
      2: { halign: 'center', cellWidth: 14 },
      3: { halign: 'right', cellWidth: 26 },
      4: { halign: 'right', cellWidth: 28, fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  })

  // totals
  const afterY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6
  doc.setDrawColor(226, 232, 240)
  doc.line(120, afterY, 196, afterY)
  doc.setFontSize(9.5)
  doc.setTextColor(71, 85, 105)
  doc.text(`Net total`, 130, afterY + 6)
  doc.text(formatMoney(totals.net, settings.currency), 196, afterY + 6, { align: 'right' })
  doc.text(`VAT (${totals.vatRate}%)`, 130, afterY + 11)
  doc.text(formatMoney(totals.vat, settings.currency), 196, afterY + 11, { align: 'right' })
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(15, 23, 42)
  doc.text('Gross total', 130, afterY + 17.5)
  doc.text(formatMoney(totals.gross, settings.currency), 196, afterY + 17.5, { align: 'right' })

  // footer
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text(`${settings.shopName} · ${settings.contactEmail} · Prices are indicative and valid for 30 days.`, 14, 289)
    doc.text(`Page ${i}/${pages}`, 196, 289, { align: 'right' })
  }

  const safe = info.name.replace(/[^a-z0-9-_ ]/gi, '').trim().replace(/\s+/g, '-').toLowerCase() || 'duct-layout'
  doc.save(`bom-${safe}.pdf`)
}

export function downloadJson(data: unknown, name: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}
