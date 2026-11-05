import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ensureSeeded } from '@/lib/seed'
import { isAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  await ensureSeeded()
  const s = await db.settings.findUnique({ where: { id: 'main' } })
  return NextResponse.json(
    s ?? {
      shopName: 'BIMA Absaugtechnik',
      tagline: 'Dust extraction systems for professional workshops',
      currency: 'EUR',
      vatRate: 19,
      brandColor: '#ea580c',
      contactEmail: 'sales@example.com',
    }
  )
}

export async function PUT(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const b = await req.json().catch(() => null)
  if (!b) return NextResponse.json({ error: 'body required' }, { status: 400 })
  const data: Record<string, unknown> = {}
  if (typeof b.shopName === 'string') data.shopName = b.shopName.trim().slice(0, 120)
  if (typeof b.tagline === 'string') data.tagline = b.tagline.slice(0, 200)
  if (typeof b.currency === 'string' && /^[A-Z]{3}$/.test(b.currency)) data.currency = b.currency
  if (typeof b.vatRate === 'number' && b.vatRate >= 0 && b.vatRate <= 40) data.vatRate = b.vatRate
  if (typeof b.brandColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(b.brandColor)) data.brandColor = b.brandColor
  if (typeof b.contactEmail === 'string') data.contactEmail = b.contactEmail.slice(0, 160)
  const s = await db.settings.upsert({ where: { id: 'main' }, update: data, create: { id: 'main', ...data } })
  return NextResponse.json(s)
}
