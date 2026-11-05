import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

const STATUSES = ['NEW', 'IN_PROGRESS', 'QUOTED', 'CLOSED']

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const b = await req.json().catch(() => null)
  if (!b?.status || !STATUSES.includes(b.status)) {
    return NextResponse.json({ error: 'status must be one of ' + STATUSES.join(', ') }, { status: 400 })
  }
  const q = await db.quoteRequest.update({ where: { id }, data: { status: b.status } })
  return NextResponse.json(q)
}
