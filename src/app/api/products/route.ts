import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ensureSeeded } from '@/lib/seed'
import { isAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  await ensureSeeded()
  const products = await db.product.findMany({ where: { active: true }, orderBy: [{ sortOrder: 'asc' }, { sku: 'asc' }] })
  return NextResponse.json(products)
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const b = await req.json().catch(() => null)
  if (!b?.sku || !b?.name || !b?.category || typeof b?.price !== 'number') {
    return NextResponse.json({ error: 'sku, name, category and price are required' }, { status: 400 })
  }
  const exists = await db.product.findUnique({ where: { sku: b.sku } })
  if (exists) return NextResponse.json({ error: `SKU ${b.sku} already exists` }, { status: 409 })
  const p = await db.product.create({
    data: {
      sku: String(b.sku).trim(),
      name: String(b.name).trim(),
      description: b.description ?? null,
      category: String(b.category),
      diameterMm: b.diameterMm ?? 160,
      diameter2Mm: b.diameter2Mm ?? null,
      lengthMm: b.lengthMm ?? null,
      angleDeg: b.angleDeg ?? null,
      branchAngleDeg: b.branchAngleDeg ?? null,
      price: b.price,
      stock: b.stock ?? null,
      active: b.active ?? true,
      sortOrder: b.sortOrder ?? 500,
    },
  })
  return NextResponse.json(p)
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const b = await req.json().catch(() => null)
  if (!b?.id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { id, ...fields } = b
  const data: Record<string, unknown> = {}
  for (const k of ['name', 'description', 'category', 'diameterMm', 'diameter2Mm', 'lengthMm', 'angleDeg', 'branchAngleDeg', 'price', 'stock', 'active', 'sortOrder'] as const) {
    if (fields[k] !== undefined) data[k] = fields[k]
  }
  const p = await db.product.update({ where: { id }, data })
  return NextResponse.json(p)
}
