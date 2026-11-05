import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const b = await req.json().catch(() => null)
  if (!b) return NextResponse.json({ error: 'body required' }, { status: 400 })
  const data: Record<string, unknown> = {}
  if (typeof b.name === 'string') data.name = b.name.trim().slice(0, 120)
  if (typeof b.contactEmail === 'string') data.contactEmail = b.contactEmail.slice(0, 160) || null
  if (typeof b.monthlyFee === 'number') data.monthlyFee = b.monthlyFee
  if (typeof b.brandColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(b.brandColor)) data.brandColor = b.brandColor
  if (typeof b.status === 'string' && ['ACTIVE', 'TRIAL', 'SUSPENDED'].includes(b.status)) data.status = b.status
  if (typeof b.notes === 'string') data.notes = b.notes.slice(0, 500)
  const d = await db.dealer.update({ where: { id }, data })
  return NextResponse.json(d)
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  await db.dealer.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
