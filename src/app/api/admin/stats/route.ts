import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ensureSeeded } from '@/lib/seed'
import { isAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await ensureSeeded()

  const [designs, quotes, dealers, newQuotes] = await Promise.all([
    db.design.count(),
    db.quoteRequest.count(),
    db.dealer.findMany(),
    db.quoteRequest.count({ where: { status: 'NEW' } }),
  ])

  const active = dealers.filter((d) => d.status === 'ACTIVE')
  const mrr = active.reduce((s, d) => s + d.monthlyFee, 0)

  const recentDesigns = await db.design.findMany({ orderBy: { updatedAt: 'desc' }, take: 8 })
  const recentQuotes = await db.quoteRequest.findMany({ orderBy: { createdAt: 'desc' }, take: 8 })

  return NextResponse.json({
    designs,
    quotes,
    newQuotes,
    dealers: dealers.length,
    activeDealers: active.length,
    mrr,
    recentDesigns: recentDesigns.map((d) => ({
      id: d.id,
      shareId: d.shareId,
      name: d.name,
      customer: d.customer,
      dealerName: d.dealerName,
      totalGross: d.totalGross,
      itemCount: d.itemCount,
      updatedAt: d.updatedAt,
    })),
    recentQuotes: recentQuotes.map((q) => ({
      id: q.id,
      name: q.name,
      company: q.company,
      email: q.email,
      totalGross: q.totalGross,
      status: q.status,
      dealerName: q.dealerName,
      createdAt: q.createdAt,
    })),
  })
}
