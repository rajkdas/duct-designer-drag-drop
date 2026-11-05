import { NextRequest, NextResponse } from 'next/server'

// ---------------------------------------------------------------------------
// White-label sub-domain routing.
//
// When ROOT_DOMAIN is configured (e.g. ROOT_DOMAIN=duct.bima.de), any host of
// the form  <dealer-slug>.duct.bima.de  is rewritten to the chrome-less
// dealer embed:  /?embed=1&dealer=<dealer-slug>  — no database access needed
// in the edge middleware; the page itself validates the dealer licence.
// ---------------------------------------------------------------------------

const RESERVED = new Set(['www', 'app', 'admin', 'api', 'docs', 'static', 'cdn'])

export function middleware(req: NextRequest) {
  const root = process.env.ROOT_DOMAIN
  if (!root) return NextResponse.next()

  const host = (req.headers.get('host') ?? '').split(':')[0].toLowerCase()
  const suffix = `.${root.toLowerCase()}`
  if (!host.endsWith(suffix)) return NextResponse.next()

  const slug = host.slice(0, -suffix.length)
  if (!slug || slug.includes('.') || RESERVED.has(slug)) return NextResponse.next()

  const url = req.nextUrl.clone()
  if (url.pathname !== '/') return NextResponse.next()

  url.pathname = '/'
  url.searchParams.set('embed', '1')
  url.searchParams.set('dealer', slug)
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: '/',
}
