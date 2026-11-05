export interface ProductDTO {
  id: string
  sku: string
  name: string
  description: string | null
  category: string
  diameterMm: number
  diameter2Mm: number | null
  lengthMm: number | null
  angleDeg: number | null
  branchAngleDeg: number | null
  price: number
  stock: number | null
  active: boolean
}

export interface DealerDTO {
  id: string
  slug: string
  name: string
  contactEmail: string | null
  monthlyFee: number
  brandColor: string
  status: string
  notes: string | null
  createdAt: string
  designCount?: number
  quoteCount?: number
}

export interface SettingsDTO {
  shopName: string
  tagline: string
  currency: string
  vatRate: number
  brandColor: string
  contactEmail: string
}

export interface QuoteDTO {
  id: string
  designId: string | null
  designName?: string | null
  dealerSlug: string | null
  dealerName: string | null
  name: string
  company: string | null
  email: string
  phone: string | null
  message: string | null
  totalGross: number
  status: string
  createdAt: string
}

export interface DesignDTO {
  id: string
  shareId: string
  name: string
  customer: string | null
  dealerSlug: string | null
  dealerName: string | null
  totalNet: number
  totalGross: number
  itemCount: number
  createdAt: string
  updatedAt: string
  quoteCount?: number
}

// --- layout document --------------------------------------------------------

export interface PlacedItem {
  id: string
  productId?: string // duct part or dust collector unit
  machine?: string // machine type key (layout aid, not priced)
  sku?: string // denormalised for robustness
  x: number // m — position of port A / origin
  y: number
  z: number // mm — installation height of port A
  z2?: number // mm — height of port B (drops)
  rot: number // degrees
  label?: string
}

export interface DesignData {
  v: 1
  room: { w: number; h: number }
  items: PlacedItem[]
}

export function isDesignData(d: unknown): d is DesignData {
  if (!d || typeof d !== 'object') return false
  const o = d as Record<string, unknown>
  return Array.isArray(o.items) && !!o.room && typeof o.room === 'object'
}

// --- BOM ---------------------------------------------------------------------

export interface BomRow {
  productId: string
  sku: string
  name: string
  description: string | null
  category: string
  qty: number
  unitPrice: number
  total: number
}

export interface BomTotals {
  net: number
  vat: number
  gross: number
  vatRate: number
}

export function aggregateBom(items: PlacedItem[], products: ProductDTO[]): BomRow[] {
  const byId = new Map(products.map((p) => [p.id, p]))
  const bySku = new Map(products.map((p) => [p.sku, p]))
  const map = new Map<string, BomRow>()
  for (const it of items) {
    if (!it.productId && !it.sku) continue // machines etc.
    const p = (it.productId && byId.get(it.productId)) || (it.sku && bySku.get(it.sku)) || null
    if (!p) continue
    const row = map.get(p.id) ?? {
      productId: p.id,
      sku: p.sku,
      name: p.name,
      description: p.description,
      category: p.category,
      qty: 0,
      unitPrice: p.price,
      total: 0,
    }
    row.qty += 1
    row.total = row.qty * row.unitPrice
    map.set(p.id, row)
  }
  return [...map.values()].sort((a, b) => a.sku.localeCompare(b.sku))
}

export function bomTotals(rows: BomRow[], vatRate: number): BomTotals {
  const net = rows.reduce((s, r) => s + r.total, 0)
  const vat = (net * vatRate) / 100
  return { net, vat, gross: net + vat, vatRate }
}

export function itemGeoOf(item: PlacedItem, products: ProductDTO[]): PartGeoLike {
  if (item.machine) {
    return { category: 'MACHINE', diameterMm: 125, diameter2Mm: null, lengthMm: null, angleDeg: null, branchAngleDeg: null, machineType: item.machine }
  }
  const p = products.find((x) => x.id === item.productId) ?? products.find((x) => x.sku === item.sku)
  if (!p) return { category: 'PIPE', diameterMm: 100, diameter2Mm: null, lengthMm: 1000, angleDeg: null, branchAngleDeg: null }
  return {
    category: p.category,
    diameterMm: p.diameterMm,
    diameter2Mm: p.diameter2Mm,
    lengthMm: p.lengthMm,
    angleDeg: p.angleDeg,
    branchAngleDeg: p.branchAngleDeg,
    sku: p.sku,
  }
}

export interface PartGeoLike {
  category: string
  diameterMm: number
  diameter2Mm: number | null
  lengthMm: number | null
  angleDeg: number | null
  branchAngleDeg: number | null
  machineType?: string
  sku?: string
}

export function shortName(p: { name: string; diameterMm: number; lengthMm: number | null; angleDeg: number | null }): string {
  const parts = p.name.split(/[,–-]/).map((s) => s.trim())
  return parts[0] ?? p.name
}

export function formatMoney(v: number, currency = 'EUR'): string {
  try {
    return new Intl.NumberFormat('en-IE', { style: 'currency', currency, maximumFractionDigits: 2 }).format(v)
  } catch {
    return `€${v.toFixed(2)}`
  }
}
