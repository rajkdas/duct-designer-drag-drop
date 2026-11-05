import { db } from '@/lib/db'
import { SCHEMA_STATEMENTS } from '@/lib/schema-sql'
import { rad, rotPoint } from '@/lib/geo'

// ---------------------------------------------------------------------------
// Seed data: parts catalogue (demo prices — replace via WooCommerce sync or
// the admin panel), shop settings, dealer licences and a demo design.
// ---------------------------------------------------------------------------

type Seed = {
  sku: string
  name: string
  description: string
  category: string
  diameterMm: number
  diameter2Mm?: number
  lengthMm?: number
  angleDeg?: number
  branchAngleDeg?: number
  price: number
  sortOrder: number
}

const P = (
  sortOrder: number,
  sku: string,
  name: string,
  description: string,
  category: string,
  diameterMm: number,
  price: number,
  extra: Partial<Seed> = {}
): Seed => ({ sku, name, description, category, diameterMm, price, sortOrder, ...extra })

const galv = 'Galvanised steel, with integrated sealing lip'

const PRODUCTS: Seed[] = [
  // straight pipes
  ...[100, 125, 160, 200, 250].flatMap((d, i) =>
    [500, 1000, 2000].map((len, j) =>
      P(
        100 + i * 10 + j,
        `R-${d}-${len}`,
        `Straight pipe Ø${d} × ${len} mm`,
        `Straight pipe Ø${d} mm, ${len} mm long, ${galv}`,
        'PIPE',
        d,
        [12.9, 19.9, 32.9, 14.9, 22.5, 36.9, 16.9, 25.9, 42.5, 18.9, 28.5, 46.9, 21.9, 33.9, 54.9][i * 3 + j],
        { lengthMm: len }
      )
    )
  ),
  // bends 90° / 45° / 30° / 22.5°
  ...[100, 125, 160, 200, 250].map((d, i) =>
    P(200 + i, `B-${d}-90`, `Bend 90° Ø${d}`, `90° segmental bend Ø${d} mm, R = 1.5 × D, ${galv}`, 'BEND', d, [18.9, 22.9, 27.9, 34.9, 44.9][i], { angleDeg: 90 })
  ),
  ...[100, 125, 160, 200, 250].map((d, i) =>
    P(210 + i, `B-${d}-45`, `Bend 45° Ø${d}`, `45° segmental bend Ø${d} mm, R = 1.5 × D, ${galv}`, 'BEND', d, [17.9, 21.5, 25.9, 32.9, 42.5][i], { angleDeg: 45 })
  ),
  P(220, 'B-160-30', 'Bend 30° Ø160', '30° segmental bend Ø160 mm, R = 1.5 × D, galvanised steel', 'BEND', 160, 24.9, { angleDeg: 30 }),
  P(221, 'B-200-30', 'Bend 30° Ø200', '30° segmental bend Ø200 mm, R = 1.5 × D, galvanised steel', 'BEND', 200, 31.9, { angleDeg: 30 }),
  P(222, 'B-160-22.5', 'Bend 22.5° Ø160', '22.5° segmental bend Ø160 mm for fine routing', 'BEND', 160, 23.9, { angleDeg: 22.5 }),
  P(223, 'B-200-22.5', 'Bend 22.5° Ø200', '22.5° segmental bend Ø200 mm for fine routing', 'BEND', 200, 30.9, { angleDeg: 22.5 }),
  // Y-branches
  P(230, 'Y-100-100-45', 'Y-branch 45° Ø100/100', `Y-branch 45°, main Ø100, branch Ø100, ${galv}`, 'YBRANCH', 100, 39.0, { diameter2Mm: 100, branchAngleDeg: 45 }),
  P(231, 'Y-125-125-45', 'Y-branch 45° Ø125/125', `Y-branch 45°, main Ø125, branch Ø125, ${galv}`, 'YBRANCH', 125, 45.0, { diameter2Mm: 125, branchAngleDeg: 45 }),
  P(232, 'Y-160-125-45', 'Y-branch 45° Ø160/125', `Y-branch 45°, main Ø160, branch Ø125, ${galv}`, 'YBRANCH', 160, 54.0, { diameter2Mm: 125, branchAngleDeg: 45 }),
  P(233, 'Y-160-160-45', 'Y-branch 45° Ø160/160', `Y-branch 45°, main Ø160, branch Ø160, ${galv}`, 'YBRANCH', 160, 59.0, { diameter2Mm: 160, branchAngleDeg: 45 }),
  P(234, 'Y-200-125-45', 'Y-branch 45° Ø200/125', `Y-branch 45°, main Ø200, branch Ø125, ${galv}`, 'YBRANCH', 200, 69.0, { diameter2Mm: 125, branchAngleDeg: 45 }),
  P(235, 'Y-200-160-45', 'Y-branch 45° Ø200/160', `Y-branch 45°, main Ø200, branch Ø160, ${galv}`, 'YBRANCH', 200, 74.0, { diameter2Mm: 160, branchAngleDeg: 45 }),
  P(236, 'Y-200-200-45', 'Y-branch 45° Ø200/200', `Y-branch 45°, main Ø200, branch Ø200, ${galv}`, 'YBRANCH', 200, 79.0, { diameter2Mm: 200, branchAngleDeg: 45 }),
  P(237, 'Y-250-200-45', 'Y-branch 45° Ø250/200', `Y-branch 45°, main Ø250, branch Ø200, ${galv}`, 'YBRANCH', 250, 99.0, { diameter2Mm: 200, branchAngleDeg: 45 }),
  // T-branches
  P(240, 'T-125-125', 'T-branch 90° Ø125/125', `T-branch 90°, main Ø125, branch Ø125, ${galv}`, 'TBRANCH', 125, 38.0, { diameter2Mm: 125 }),
  P(241, 'T-160-160', 'T-branch 90° Ø160/160', `T-branch 90°, main Ø160, branch Ø160, ${galv}`, 'TBRANCH', 160, 49.0, { diameter2Mm: 160 }),
  P(242, 'T-200-200', 'T-branch 90° Ø200/200', `T-branch 90°, main Ø200, branch Ø200, ${galv}`, 'TBRANCH', 200, 64.0, { diameter2Mm: 200 }),
  // reducers
  P(250, 'RED-125-100', 'Reducer Ø125 → Ø100', 'Concentric reducer from Ø125 to Ø100, 300 mm', 'REDUCER', 125, 19.9, { diameter2Mm: 100, lengthMm: 300 }),
  P(251, 'RED-160-125', 'Reducer Ø160 → Ø125', 'Concentric reducer from Ø160 to Ø125, 300 mm', 'REDUCER', 160, 24.9, { diameter2Mm: 125, lengthMm: 300 }),
  P(252, 'RED-200-125', 'Reducer Ø200 → Ø125', 'Concentric reducer from Ø200 to Ø125, 300 mm', 'REDUCER', 200, 27.9, { diameter2Mm: 125, lengthMm: 300 }),
  P(253, 'RED-200-160', 'Reducer Ø200 → Ø160', 'Concentric reducer from Ø200 to Ø160, 300 mm', 'REDUCER', 200, 29.9, { diameter2Mm: 160, lengthMm: 300 }),
  P(254, 'RED-250-200', 'Reducer Ø250 → Ø200', 'Concentric reducer from Ø250 to Ø200, 300 mm', 'REDUCER', 250, 36.9, { diameter2Mm: 200, lengthMm: 300 }),
  // blast gates
  ...[100, 125, 160, 200, 250].map((d, i) =>
    P(260 + i, `GATE-${d}`, `Blast gate Ø${d}`, `Manual slide blast gate Ø${d} mm with locking lever, ${galv}`, 'GATE', d, [14.9, 16.9, 19.9, 24.9, 29.9][i])
  ),
  // machine hoods
  ...[100, 125, 160, 200].map((d, i) =>
    P(270 + i, `HD-${d}`, `Machine hood Ø${d}`, `Chip extraction hood Ø${d} mm with flange plate and rubber seal`, 'HOOD', d, [22.9, 26.9, 27.9, 32.9][i])
  ),
  // flex hoses
  P(280, 'FH-100-1500', 'Flex hose Ø100 × 1500', 'Flexible hose Ø100 mm, 1500 mm, PU with copper wire, earthed', 'FLEX', 100, 24.9, { lengthMm: 1500 }),
  P(281, 'FH-125-1500', 'Flex hose Ø125 × 1500', 'Flexible hose Ø125 mm, 1500 mm, PU with copper wire, earthed', 'FLEX', 125, 27.9, { lengthMm: 1500 }),
  P(282, 'FH-160-2000', 'Flex hose Ø160 × 2000', 'Flexible hose Ø160 mm, 2000 mm, PU with copper wire, earthed', 'FLEX', 160, 32.9, { lengthMm: 2000 }),
  P(283, 'FH-200-2000', 'Flex hose Ø200 × 2000', 'Flexible hose Ø200 mm, 2000 mm, PU with copper wire, earthed', 'FLEX', 200, 39.9, { lengthMm: 2000 }),
  // couplings & caps
  ...[100, 125, 160, 200, 250].map((d, i) =>
    P(290 + i, `CP-${d}`, `Coupling Ø${d}`, `Socket coupling Ø${d} mm with EPDM gasket`, 'COUPLING', d, [9.9, 10.9, 11.9, 13.9, 15.9][i])
  ),
  ...[100, 125, 160, 200, 250].map((d, i) =>
    P(300 + i, `CAP-${d}`, `End cap Ø${d}`, `Blanking cap Ø${d} mm with gasket for unused ports`, 'CAP', d, [8.9, 9.9, 11.9, 14.9, 17.9][i])
  ),
  // dust collector units
  P(310, 'DC-5.5', 'Dust collector DC 5.5 kW', 'Filter unit 5.5 kW, 5,600 m³/h, 2 × cartridges, 240 l bin', 'UNIT', 250, 2990.0),
  P(311, 'DC-11', 'Dust collector DC 11 kW', 'Filter unit 11 kW, 9,800 m³/h, 4 × cartridges, 400 l bin', 'UNIT', 250, 5490.0),
  P(312, 'DC-22', 'Dust collector DC 22 kW', 'Filter unit 22 kW, 16,500 m³/h, 6 × cartridges, rotary valve', 'UNIT', 250, 9800.0),
]

const DEALERS = [
  {
    slug: 'holzprofi',
    name: 'HolzProfi Werkzeuge GmbH',
    contactEmail: 'configurator@holzprofi-example.de',
    monthlyFee: 49,
    brandColor: '#c2410c',
    status: 'ACTIVE',
    notes: 'Pilot dealer — embedding on product category page.',
  },
  {
    slug: 'timbertech',
    name: 'TimberTech Machinery',
    contactEmail: 'sales@timbertech-example.com',
    monthlyFee: 29,
    brandColor: '#0f766e',
    status: 'TRIAL',
    notes: '30-day trial started with embed test page.',
  },
  {
    slug: 'mustermaschinen',
    name: 'Muster Maschinen AG',
    contactEmail: 'info@mustermaschinen-example.de',
    monthlyFee: 79,
    brandColor: '#b45309',
    status: 'SUSPENDED',
    notes: 'Suspended — invoice overdue (Oct).',
  },
]

// ---------------------------------------------------------------------------
// Demo design — built with the same geometry primitives the editor uses, so
// every joint lines up exactly.
// ---------------------------------------------------------------------------

export function buildDemoDesign(products: { id: string; sku: string; category: string; diameterMm: number; diameter2Mm: number | null; lengthMm: number | null; angleDeg: number | null; branchAngleDeg: number | null }[]) {
  const bySku = new Map(products.map((p) => [p.sku, p]))
  const items: {
    id: string
    productId?: string
    machine?: string
    sku?: string
    x: number
    y: number
    z: number
    z2?: number
    rot: number
    label?: string
  }[] = []
  let n = 0
  const nid = () => `d${(++n).toString().padStart(2, '0')}`

  const add = (sku: string, x: number, y: number, rot: number, z = 2800, z2?: number, label?: string) => {
    const p = bySku.get(sku)
    if (!p) throw new Error(`seed: unknown sku ${sku}`)
    items.push({ id: nid(), productId: p.id, sku, x, y, z, z2, rot, label })
    return p
  }
  const addMachine = (type: string, x: number, y: number, rot: number, label: string) => {
    items.push({ id: nid(), machine: type, x, y, z: 900, rot, label })
  }
  const dirVec = (dirDeg: number, len: number) => ({
    x: len * Math.cos(rad(dirDeg)),
    y: len * Math.sin(rad(dirDeg)),
  })

  // dust collector at the right wall
  add('DC-11', 16.0, 5.5, 0, 0, undefined, 'DC 11 kW')
  let cx = 16.0
  let cy = 6.0
  let heading = 180

  // walk the main line: place part at cursor, advance cursor to its outlet port
  const advance = (sku: string) => {
    const p = add(sku, cx, cy, heading)
    let len = 0
    let turn = 0
    if (p.category === 'PIPE' || p.category === 'FLEX' || p.category === 'REDUCER') len = (p.lengthMm ?? 1000) / 1000
    else if (p.category === 'BEND') {
      const R = 1.5 * (p.diameterMm / 1000)
      len = R * Math.sin(rad(p.angleDeg ?? 90))
      turn = p.angleDeg ?? 90
    } else if (p.category === 'YBRANCH' || p.category === 'TBRANCH') len = 1.0
    else if (p.category === 'GATE') len = 0.25
    else if (p.category === 'COUPLING') len = 0.2
    else if (p.category === 'CAP') len = 0.15
    const v = dirVec(heading, len)
    cx += v.x
    cy += v.y
    heading += turn
    return p
  }

  const branchDrop = (ySku: string, gateSku: string, flexSku: string, hoodSku: string, machineType: string, machineLabel: string, flexDir: number) => {
    const y = add(ySku, cx, cy, heading) // branch part at cursor
    // main outlet
    const mv = dirVec(heading, 1.0)
    // branch port: local (L/2 + s·cosφ, s·sinφ), φ = 45 for Y
    const phi = y.category === 'TBRANCH' ? 90 : (y.branchAngleDeg ?? 45)
    const s = 0.35
    const L = 1.0
    const lp = { x: L / 2 + s * Math.cos(rad(phi)), y: s * Math.sin(rad(phi)) }
    const rp = rotPoint(lp.x, lp.y, heading)
    const bx = cx + rp.x
    const by = cy + rp.y
    const bdir = phi + heading
    // main continues
    cx += mv.x
    cy += mv.y
    // gate on the branch
    add(gateSku, bx, by, bdir, 2800)
    const gv = dirVec(bdir, 0.25)
    const gx = bx + gv.x
    const gy = by + gv.y
    // flex hose down to the machine
    const flexLen = (bySkuMap.get(flexSku)?.lengthMm ?? 2000) / 1000
    add(flexSku, gx, gy, flexDir, 2800, 900)
    const fv = dirVec(flexDir, flexLen)
    const fx = gx + fv.x
    const fy = gy + fv.y
    // hood entering the machine
    add(hoodSku, fx, fy, flexDir, 900)
    const hv = dirVec(flexDir, 0.35)
    const hx = fx + hv.x
    const hy = fy + hv.y
    // machine with its take-off port on the hood mouth
    const m = MACHINE_DEFS[machineType]
    const outDir = (flexDir + 180) % 360
    const mrot = (outDir - 270 + 360) % 360
    const mp = rotPoint(m.w / 2, 0, mrot)
    addMachine(machineType, hx - mp.x, hy - mp.y, mrot, machineLabel)
  }

  // local map for flex lengths (avoid re-query)
  const bySkuMap = new Map(products.map((p) => [p.sku, p]))

  // ---- main line -----------------------------------------------------------
  advance('RED-250-200')
  for (let i = 0; i < 3; i++) advance('R-200-1000')
  branchDrop('Y-200-200-45', 'GATE-200', 'FH-200-2000', 'HD-200', 'cnc', 'CNC router', 254)
  for (let i = 0; i < 2; i++) advance('R-200-1000')
  branchDrop('Y-200-160-45', 'GATE-160', 'FH-160-2000', 'HD-160', 'table-saw', 'Table saw', 115)
  advance('R-200-1000')
  branchDrop('Y-200-125-45', 'GATE-125', 'FH-125-1500', 'HD-125', 'edge-bander', 'Edge bander', 250)
  advance('R-200-1000')
  branchDrop('Y-200-160-45', 'GATE-160', 'FH-160-2000', 'HD-160', 'planer', 'Thickness planer', 100)
  for (let i = 0; i < 2; i++) advance('R-200-1000')
  advance('B-200-90') // turn up
  advance('R-200-500')
  advance('CAP-200')

  return { v: 1 as const, room: { w: 18, h: 12 }, items }
}

const MACHINE_DEFS: Record<string, { w: number; d: number }> = {
  'table-saw': { w: 2.0, d: 1.2 },
  planer: { w: 1.6, d: 0.9 },
  'edge-bander': { w: 2.6, d: 0.8 },
  cnc: { w: 2.4, d: 2.2 },
}

let seedPromise: Promise<void> | null = null

// ---------------------------------------------------------------------------
// ensureTables(): create the table structure when the database file is empty
// (e.g. a fresh /tmp file on Vercel). Idempotent and safe to run in parallel:
// every statement uses IF NOT EXISTS, so double runs are harmless.
// ---------------------------------------------------------------------------
let tablesPromise: Promise<void> | null = null

function ensureTables(): Promise<void> {
  if (!tablesPromise) {
    tablesPromise = (async () => {
      const rows = await db.$queryRawUnsafe<{ name: string }[]>(
        `SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'Product'`
      )
      if (Array.isArray(rows) && rows.length > 0) return
      for (const stmt of SCHEMA_STATEMENTS) {
        try {
          await db.$executeRawUnsafe(stmt.replace(/CREATE TABLE /g, 'CREATE TABLE IF NOT EXISTS ').replace(/CREATE UNIQUE INDEX /g, 'CREATE UNIQUE INDEX IF NOT EXISTS ').replace(/CREATE INDEX /g, 'CREATE INDEX IF NOT EXISTS '))
        } catch {
          // ignore "already exists" races between parallel serverless instances
        }
      }
    })().catch((e) => {
      tablesPromise = null
      throw e
    })
  }
  return tablesPromise
}

async function doSeed() {
  await ensureTables()
  const productCount = await db.product.count()
  if (productCount === 0) {
    for (const p of PRODUCTS) {
      await db.product.create({
        data: {
          sku: p.sku,
          name: p.name,
          description: p.description,
          category: p.category,
          diameterMm: p.diameterMm,
          diameter2Mm: p.diameter2Mm ?? null,
          lengthMm: p.lengthMm ?? null,
          angleDeg: p.angleDeg ?? null,
          branchAngleDeg: p.branchAngleDeg ?? null,
          price: p.price,
          stock: 25,
          active: true,
          sortOrder: p.sortOrder,
        },
      })
    }
  }

  const settings = await db.settings.findUnique({ where: { id: 'main' } })
  if (!settings) {
    await db.settings.create({
      data: {
        id: 'main',
        shopName: 'BIMA Absaugtechnik',
        tagline: 'Dust extraction systems for professional workshops',
        contactEmail: 'sales@bima-example.de',
      },
    })
  }

  const dealerCount = await db.dealer.count()
  if (dealerCount === 0) {
    for (const d of DEALERS) await db.dealer.create({ data: d })
  }

  const demo = await db.design.findUnique({ where: { shareId: 'demo' } })
  if (!demo) {
    const products = await db.product.findMany()
    const data = buildDemoDesign(products)
    const items = data.items.length
    // net total from catalogue prices
    const byId = new Map(products.map((p) => [p.id, p.price]))
    const net = data.items.reduce((s, it) => s + (it.productId ? (byId.get(it.productId) ?? 0) : 0), 0)
    await db.design.create({
      data: {
        shareId: 'demo',
        name: 'Sample workshop 18 × 12 m',
        customer: 'Schreinerei Muster',
        data: JSON.stringify(data),
        itemCount: items,
        totalNet: Math.round(net * 100) / 100,
        totalGross: Math.round(net * 1.19 * 100) / 100,
      },
    })
    await db.quoteRequest.create({
      data: {
        designId: (await db.design.findUnique({ where: { shareId: 'demo' } }))!.id,
        name: 'Markus Muster',
        company: 'Schreinerei Muster',
        email: 'muster@example.de',
        phone: '+49 170 000000',
        message: 'Please confirm availability for week 12 and include installation.',
        totalGross: Math.round(net * 1.19 * 100) / 100,
        status: 'NEW',
      },
    })
  }
}

/** idempotent seed guard — cheap count check, runs once per process */
export function ensureSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = doSeed()
      .catch((e) => {
        // On a fresh deployment two server instances may start at the same
        // moment and both try to seed. Unique-constraint errors mean the other
        // instance won the race — safe to ignore. Everything else re-throws.
        if (typeof e === 'object' && e !== null && String((e as Error).message).includes('Unique constraint')) return
        seedPromise = null
        throw e
      })
      .then(() => undefined)
  }
  return seedPromise
}
