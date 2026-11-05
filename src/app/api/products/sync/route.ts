import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin-auth'
import { syncFromWooCommerce } from '@/lib/woocommerce'

export const dynamic = 'force-dynamic'

export async function POST() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const result = await syncFromWooCommerce()
  return NextResponse.json(result)
}
