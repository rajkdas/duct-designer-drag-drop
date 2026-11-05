import { db } from '@/lib/db'

// ---------------------------------------------------------------------------
// WooCommerce REST adapter.
//
// Configure in .env:
//   WOO_STORE_URL=https://your-shop.com
//   WOO_CONSUMER_KEY=ck_xxx
//   WOO_CONSUMER_SECRET=cs_xxx
//
// Then run Admin → Products → "Sync from WooCommerce". Products are matched
// by SKU. Geometry attributes are read from WooCommerce product attributes
// named diameter|durchmesser, length|länge, angle|winkel, branch|abgang.
// ---------------------------------------------------------------------------

interface WooProduct {
  id: number
  sku?: string
  name?: string
  short_description?: string
  regular_price?: string
  sale_price?: string
  price?: string
  stock_quantity?: number | null
  categories?: { name?: string }[]
  attributes?: { name?: string; options?: string[] }[]
  status?: string
}

const catMap: [RegExp, string][] = [
  [/bogen|bend/i, 'BEND'],
  [/y-?branch|y-?stück|abzweig/i, 'YBRANCH'],
  [/t-?branch|t-?stück/i, 'TBRANCH'],
  [/reduzier|reducer/i, 'REDUCER'],
  [/schieber|gate|klappe/i, 'GATE'],
  [/muffe|coupling/i, 'COUPLING'],
  [/deckel|end ?cap|cap/i, 'CAP'],
  [/schlauch|hose|flex/i, 'FLEX'],
  [/haube|hood/i, 'HOOD'],
  [/anlage|unit|absaug|filter|collector/i, 'UNIT'],
  [/rohr|pipe/i, 'PIPE'],
]

function mapCategory(p: WooProduct): string {
  const hay = `${p.categories?.map((c) => c.name ?? '').join(' ')} ${p.name ?? ''}`
  for (const [re, cat] of catMap) if (re.test(hay)) return cat
  return 'PIPE'
}

function attrNum(p: WooProduct, re: RegExp): number | null {
  for (const a of p.attributes ?? []) {
    if (a.name && re.test(a.name)) {
      const raw = a.options?.[0] ?? ''
      const m = raw.match(/\d+(\.\d+)?/)
      if (m) return Math.round(parseFloat(m[0]))
    }
  }
  return null
}

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export interface SyncResult {
  configured: boolean
  created?: number
  updated?: number
  skipped?: number
  message?: string
}

export async function syncFromWooCommerce(): Promise<SyncResult> {
  const base = process.env.WOO_STORE_URL
  const key = process.env.WOO_CONSUMER_KEY
  const secret = process.env.WOO_CONSUMER_SECRET
  if (!base || !key || !secret) {
    return {
      configured: false,
      message:
        'WooCommerce is not configured yet. Set WOO_STORE_URL, WOO_CONSUMER_KEY and WOO_CONSUMER_SECRET in .env, then run the sync again. See Documentation → WooCommerce.',
    }
  }

  const created: string[] = []
  const updated: string[] = []
  let skipped = 0

  try {
    for (let page = 1; page <= 10; page++) {
      const url = `${base.replace(/\/$/, '')}/wp-json/wc/v3/products?per_page=100&page=${page}&consumer_key=${encodeURIComponent(key)}&consumer_secret=${encodeURIComponent(secret)}`
      const res = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store' })
      if (!res.ok) return { configured: true, message: `WooCommerce returned ${res.status} ${res.statusText}. Check URL and keys.` }
      const list = (await res.json()) as WooProduct[]
      if (!Array.isArray(list) || list.length === 0) break

      for (const wp of list) {
        if (!wp.sku || !wp.name) {
          skipped++
          continue
        }
        const price = parseFloat(wp.sale_price || wp.regular_price || wp.price || '0')
        if (!Number.isFinite(price) || price <= 0) {
          skipped++
          continue
        }
        const category = mapCategory(wp)
        const diameterMm = attrNum(wp, /diameter|durchmesser/i) ?? defaultDiameter(wp.sku)
        const data = {
          sku: wp.sku,
          name: stripHtml(wp.name),
          description: wp.short_description ? stripHtml(wp.short_description).slice(0, 300) : null,
          category,
          diameterMm,
          diameter2Mm: attrNum(wp, /branch|abgang|second/i),
          lengthMm: attrNum(wp, /length|länge|lange/i),
          angleDeg: attrNum(wp, /angle|winkel/i),
          branchAngleDeg: attrNum(wp, /branch angle|abgangswinkel/i),
          price,
          stock: wp.stock_quantity ?? null,
          active: wp.status !== 'trash',
          wooId: wp.id,
        }
        const existing = await db.product.findUnique({ where: { sku: wp.sku } })
        if (existing) {
          await db.product.update({ where: { sku: wp.sku }, data })
          updated.push(wp.sku)
        } else {
          await db.product.create({ data })
          created.push(wp.sku)
        }
      }
      if (list.length < 100) break
    }
  } catch (e) {
    return { configured: true, message: `Sync failed: ${e instanceof Error ? e.message : String(e)}` }
  }

  return { configured: true, created: created.length, updated: updated.length, skipped }
}

/** fall back to the Ø encoded in SKUs like R-200-1000 or B-160-45 */
function defaultDiameter(sku: string): number {
  const m = sku.match(/[-—]([1-2][0-9]{2}(?:[.,]5)?)[-—]/)
  if (m) {
    const v = parseFloat(m[1].replace(',', '.'))
    return Math.round(v)
  }
  return 160
}
