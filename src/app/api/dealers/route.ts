import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ensureSeeded } from '@/lib/seed'
import { isAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

/** public with ?slug= (embed branding) — admin without (full list) */
export async function GET(req: NextRequest) {
  await ensureSeeded()
  const slug = req.nextUrl.searchParams.get('slug')
  if (slug) {
    const d = await db.dealer.findUnique({ where: { slug } })
    if (!d) return NextResponse.json({ error: 'Dealer not found' }, { status: 404 })
    return NextResponse.json({ slug: d.slug, name: d.name, brandColor: d.brandColor, status: d.status })
  }
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const dealers = await db.dealer.findMany({ orderBy: { createdAt: 'asc' } })
  const designs = await db.design.groupBy({ by: ['dealerSlug'], _count: { _all: true } })
  const quotes = await db.quoteRequest.groupBy({ by: ['dealerSlug'], _count: { _all: true } })
  const designCount = new Map(designs.map((d) => [d.dealerSlug, d._count._all]))
  const quoteCount = new Map(quotes.map((q) => [q.dealerSlug, q._count._all]))
  return NextResponse.json(
    dealers.map((d) => ({
      ...d,
      designCount: designCount.get(d.slug) ?? 0,
      quoteCount: quoteCount.get(d.slug) ?? 0,
    }))
  )
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const b = await req.json().catch(() => null)
  if (!b?.slug || !b?.name) return NextResponse.json({ error: 'slug and name are required' }, { status: 400 })
  const slug = String(b.slug).trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')
  if (slug.length < 3) return NextResponse.json({ error: 'Slug must be at least 3 characters' }, { status: 400 })
  const exists = await db.dealer.findUnique({ where: { slug } })
  if (exists) return NextResponse.json({ error: `Slug "${slug}" is already taken` }, { status: 409 })
  const d = await db.dealer.create({
    data: {
      slug,
      name: String(b.name).trim().slice(0, 120),
      contactEmail: b.contactEmail ? String(b.contactEmail).slice(0, 160) : null,
      monthlyFee: typeof b.monthlyFee === 'number' ? b.monthlyFee : 49,
      brandColor: typeof b.brandColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(b.brandColor) ? b.brandColor : '#ea580c',
      status: ['ACTIVE', 'TRIAL', 'SUSPENDED'].includes(b.status) ? b.status : 'TRIAL',
      notes: b.notes ? String(b.notes).slice(0, 500) : null,
    },
  })
  return NextResponse.json(d)
}
