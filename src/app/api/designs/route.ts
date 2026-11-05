import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { ensureSeeded } from '@/lib/seed'
import { isAdmin } from '@/lib/admin-auth'
import { isDesignData } from '@/lib/types'

export const dynamic = 'force-dynamic'

async function newShareId(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const id = randomBytes(4).toString('base64url').replace(/[-_]/g, '').slice(0, 7).toLowerCase()
    const clash = await db.design.findUnique({ where: { shareId: id } })
    if (!clash) return id
  }
  return randomBytes(6).toString('hex').slice(0, 10)
}

/** admin: list recent designs */
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await ensureSeeded()
  const designs = await db.design.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 200,
    include: { quotes: { select: { id: true } } },
  })
  return NextResponse.json(
    designs.map((d) => ({
      id: d.id,
      shareId: d.shareId,
      name: d.name,
      customer: d.customer,
      dealerSlug: d.dealerSlug,
      dealerName: d.dealerName,
      totalNet: d.totalNet,
      totalGross: d.totalGross,
      itemCount: d.itemCount,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      quoteCount: d.quotes.length,
    }))
  )
}

/** public: save (create or update) a design */
export async function POST(req: NextRequest) {
  await ensureSeeded()
  const b = await req.json().catch(() => null)
  if (!b || !isDesignData(b.data) || typeof b.name !== 'string') {
    return NextResponse.json({ error: 'name and data are required' }, { status: 400 })
  }
  const items = b.data.items
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Design has no parts yet' }, { status: 400 })
  }

  const products = await db.product.findMany()
  const byId = new Map(products.map((p) => [p.id, p.price]))
  const bySku = new Map(products.map((p) => [p.sku, p.price]))
  let net = 0
  for (const it of items) {
    if (it.productId) net += byId.get(it.productId) ?? 0
    else if (it.sku) net += bySku.get(it.sku) ?? 0
  }
  net = Math.round(net * 100) / 100

  let dealerName: string | null = null
  if (b.dealerSlug) {
    const dealer = await db.dealer.findUnique({ where: { slug: b.dealerSlug } })
    if (dealer && dealer.status !== 'SUSPENDED') dealerName = dealer.name
  }

  const vat = (await db.settings.findUnique({ where: { id: 'main' } }))?.vatRate ?? 19
  const gross = Math.round(net * (1 + vat / 100) * 100) / 100

  // update existing design (only when the caller owns the share id)
  if (typeof b.shareId === 'string' && b.shareId) {
    const existing = await db.design.findUnique({ where: { shareId: b.shareId } })
    if (existing) {
      const updated = await db.design.update({
        where: { shareId: b.shareId },
        data: {
          name: b.name.slice(0, 120),
          customer: typeof b.customer === 'string' ? b.customer.slice(0, 120) : existing.customer,
          data: JSON.stringify(b.data),
          itemCount: items.length,
          totalNet: net,
          totalGross: gross,
          ...(dealerName ? { dealerSlug: b.dealerSlug, dealerName } : {}),
        },
      })
      return NextResponse.json({ shareId: updated.shareId, updatedAt: updated.updatedAt })
    }
  }

  const shareId = await newShareId()
  const created = await db.design.create({
    data: {
      shareId,
      name: b.name.slice(0, 120) || 'Untitled layout',
      customer: typeof b.customer === 'string' ? b.customer.slice(0, 120) : null,
      dealerSlug: dealerName ? b.dealerSlug : null,
      dealerName,
      data: JSON.stringify(b.data),
      itemCount: items.length,
      totalNet: net,
      totalGross: gross,
    },
  })
  return NextResponse.json({ shareId: created.shareId, updatedAt: created.updatedAt })
}
