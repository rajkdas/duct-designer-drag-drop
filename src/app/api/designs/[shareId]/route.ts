import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ensureSeeded } from '@/lib/seed'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ shareId: string }> }) {
  await ensureSeeded()
  const { shareId } = await ctx.params
  const d = await db.design.findUnique({ where: { shareId } })
  if (!d) return NextResponse.json({ error: 'Design not found' }, { status: 404 })
  return NextResponse.json({
    shareId: d.shareId,
    name: d.name,
    customer: d.customer,
    dealerName: d.dealerName,
    totalNet: d.totalNet,
    totalGross: d.totalGross,
    itemCount: d.itemCount,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    data: JSON.parse(d.data),
  })
}
