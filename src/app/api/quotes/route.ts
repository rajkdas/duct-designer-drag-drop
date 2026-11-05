import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ensureSeeded } from '@/lib/seed'
import { isAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

/** admin: list quotes */
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await ensureSeeded()
  const quotes = await db.quoteRequest.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { design: { select: { name: true, shareId: true } } },
  })
  return NextResponse.json(
    quotes.map((q) => ({
      id: q.id,
      designId: q.designId,
      designName: q.design?.name ?? null,
      designShareId: q.design?.shareId ?? null,
      dealerSlug: q.dealerSlug,
      dealerName: q.dealerName,
      name: q.name,
      company: q.company,
      email: q.email,
      phone: q.phone,
      message: q.message,
      totalGross: q.totalGross,
      status: q.status,
      createdAt: q.createdAt,
    }))
  )
}

/** public: submit a quote request */
export async function POST(req: NextRequest) {
  await ensureSeeded()
  const b = await req.json().catch(() => null)
  if (!b?.name || !b?.email || typeof b.name !== 'string' || typeof b.email !== 'string') {
    return NextResponse.json({ error: 'name and email are required' }, { status: 400 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email)) {
    return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 })
  }

  let designId: string | null = null
  let totalGross = 0
  if (typeof b.designShareId === 'string' && b.designShareId) {
    const design = await db.design.findUnique({ where: { shareId: b.designShareId } })
    if (design) {
      designId = design.id
      totalGross = design.totalGross
    }
  }

  let dealerName: string | null = null
  if (typeof b.dealerSlug === 'string' && b.dealerSlug) {
    const dealer = await db.dealer.findUnique({ where: { slug: b.dealerSlug } })
    if (dealer) dealerName = dealer.name
  }

  const q = await db.quoteRequest.create({
    data: {
      designId,
      dealerSlug: dealerName ? b.dealerSlug : null,
      dealerName,
      name: b.name.slice(0, 120),
      company: b.company ? String(b.company).slice(0, 160) : null,
      email: b.email.slice(0, 160),
      phone: b.phone ? String(b.phone).slice(0, 60) : null,
      message: b.message ? String(b.message).slice(0, 2000) : null,
      totalGross,
      status: 'NEW',
    },
  })
  return NextResponse.json({ ok: true, id: q.id })
}
