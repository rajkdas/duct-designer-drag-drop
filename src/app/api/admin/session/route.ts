import { NextRequest, NextResponse } from 'next/server'
import { checkPassword, cookieName, sessionToken } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { isAdmin } = await import('@/lib/admin-auth')
  return NextResponse.json({ admin: await isAdmin() })
}

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => null)
  if (!b?.password || !checkPassword(String(b.password))) {
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 })
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.set(cookieName(), sessionToken(), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(cookieName(), '', { httpOnly: true, path: '/', maxAge: 0 })
  return res
}
