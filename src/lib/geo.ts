// ---------------------------------------------------------------------------
// Geometry engine for the duct configurator.
//
// Local part frame: origin = inlet port A, part extends along +x, +y is "down"
// on the plan (SVG convention). Rotation `rot` (degrees) maps local +x to the
// world direction `rot` using the standard matrix [[c,-s],[s,c]] — identical
// to SVG rotate(). All lengths in metres unless a field says mm.
// ---------------------------------------------------------------------------

export type Port = { x: number; y: number; dir: number } // dir = outward angle in degrees (0 = +x, 90 = +y/down)

export type PartCategory =
  | 'PIPE'
  | 'BEND'
  | 'YBRANCH'
  | 'TBRANCH'
  | 'REDUCER'
  | 'GATE'
  | 'COUPLING'
  | 'CAP'
  | 'FLEX'
  | 'HOOD'
  | 'UNIT'
  | 'MACHINE'

export interface PartGeo {
  category: PartCategory
  diameterMm: number
  diameter2Mm?: number | null
  lengthMm?: number | null
  angleDeg?: number | null
  branchAngleDeg?: number | null
  machineType?: string
}

export const CATEGORIES: { key: PartCategory; label: string; order: number }[] = [
  { key: 'MACHINE', label: 'Maschinen (Layout-Hilfen)', order: 0 },
  { key: 'UNIT', label: 'Absauganlagen', order: 1 },
  { key: 'PIPE', label: 'Rohre', order: 2 },
  { key: 'BEND', label: 'Bögen', order: 3 },
  { key: 'YBRANCH', label: 'Abzweiger', order: 4 },
  { key: 'TBRANCH', label: 'Abzweiger', order: 5 },
  { key: 'REDUCER', label: 'Reduzierungen', order: 6 },
  { key: 'GATE', label: 'Absperrschieber', order: 7 },
  { key: 'HOOD', label: 'Absaughauben', order: 8 },
  { key: 'FLEX', label: 'Flexschläuche', order: 9 },
  { key: 'COUPLING', label: 'Muffen', order: 10 },
  { key: 'CAP', label: 'Endkappen', order: 11 },
]

/**
 * Palette groups shown in the left catalogue (order matches the approved
 * design): Rohre · Bögen · Abzweiger · Reduzierungen · Absperrschieber ·
 * Anschlüsse · Zubehör — plus the two product groups below the fold.
 */
export type PaletteGroup =
  | 'PIPE'
  | 'BEND'
  | 'BRANCH'
  | 'REDUCER'
  | 'GATE'
  | 'CONNECT'
  | 'ACCESSORY'
  | 'UNIT'
  | '__machines'

export const PALETTE_GROUPS: { key: PaletteGroup; label: string; order: number }[] = [
  { key: 'PIPE', label: 'Rohre', order: 0 },
  { key: 'BEND', label: 'Bögen', order: 1 },
  { key: 'BRANCH', label: 'Abzweiger', order: 2 },
  { key: 'REDUCER', label: 'Reduzierungen', order: 3 },
  { key: 'GATE', label: 'Absperrschieber', order: 4 },
  { key: 'CONNECT', label: 'Anschlüsse', order: 5 },
  { key: 'ACCESSORY', label: 'Zubehör', order: 6 },
  { key: 'UNIT', label: 'Absauganlagen', order: 7 },
  { key: '__machines', label: 'Maschinen', order: 8 },
]

export function paletteGroup(category: string): PaletteGroup {
  switch (category) {
    case 'YBRANCH':
    case 'TBRANCH':
      return 'BRANCH'
    case 'COUPLING':
    case 'CAP':
    case 'HOOD':
      return 'CONNECT'
    case 'FLEX':
      return 'ACCESSORY'
    default:
      return (category as PaletteGroup) ?? 'PIPE'
  }
}

export function paletteGroupLabel(g: string): string {
  return PALETTE_GROUPS.find((x) => x.key === g)?.label ?? g
}
export function paletteGroupOrder(g: string): number {
  return PALETTE_GROUPS.find((x) => x.key === g)?.order ?? 99
}
/** default part (Ø200 preferred) used by the toolbar quick-place tools */
export function paletteGroupThumbGeo(): PartGeo {
  return { category: 'PIPE', diameterMm: 200 }
}

export function categoryLabel(c: string): string {
  return CATEGORIES.find((x) => x.key === c)?.label ?? c
}
export function categoryOrder(c: string): number {
  return CATEGORIES.find((x) => x.key === c)?.order ?? 99
}

export const rad = (deg: number) => (deg * Math.PI) / 180
export const deg = (r: number) => (r * 180) / Math.PI

/** rotate a local point by `rot` degrees (SVG-compatible). */
export function rotPoint(x: number, y: number, rot: number) {
  const c = Math.cos(rad(rot))
  const s = Math.sin(rad(rot))
  return { x: x * c - y * s, y: x * s + y * c }
}

/** default installation height (mm) per category — ceiling main runs, low drops */
export function defaultZ(category: string): number {
  switch (category) {
    case 'GATE':
      return 2600
    case 'FLEX':
      return 2800
    case 'HOOD':
      return 900
    case 'MACHINE':
      return 900
    case 'UNIT':
      return 0
    default:
      return 2800
  }
}

// --- machine catalogue (layout aids, not priced) ---------------------------
export interface MachineDef {
  type: string
  label: string
  w: number // footprint width along local x (m)
  d: number // footprint depth along local y (m)
  drop: number // typical take-off diameter mm
}

export const MACHINES: MachineDef[] = [
  { type: 'table-saw', label: 'Formatkreissäge', w: 2.0, d: 1.2, drop: 160 },
  { type: 'planer', label: 'Hobelmaschine', w: 1.6, d: 0.9, drop: 160 },
  { type: 'jointer', label: 'Abrichthobel', w: 2.2, d: 0.6, drop: 160 },
  { type: 'bandsaw', label: 'Bandsäge', w: 0.9, d: 0.9, drop: 125 },
  { type: 'edge-bander', label: 'Kantenanleimer', w: 2.6, d: 0.8, drop: 125 },
  { type: 'cnc', label: 'CNC', w: 2.4, d: 2.2, drop: 200 },
  { type: 'wide-belt', label: 'Breitbandschleifer', w: 1.8, d: 1.4, drop: 200 },
  { type: 'shaper', label: 'Fräsmaschine', w: 1.2, d: 1.0, drop: 125 },
  { type: 'misc', label: 'Werkstattmaschine', w: 1.5, d: 1.0, drop: 125 },
]

export function machineDef(type: string): MachineDef {
  return MACHINES.find((m) => m.type === type) ?? MACHINES[MACHINES.length - 1]
}

// --- dust collector unit footprints (by SKU, fallback default) -------------
const UNIT_FOOTPRINTS: Record<string, [number, number]> = {
  'DC-5.5': [1.0, 0.8],
  'DC-11': [1.2, 1.0],
  'DC-22': [1.6, 1.3],
}

export interface Footprint {
  w: number // local x extent (m)
  h: number // local y extent (m)
  ox: number // min x of bbox (may be negative, e.g. machines centred on origin)
  oy: number
}

/** bounding box of a part in its local frame */
export function footprint(geo: PartGeo, sku?: string): Footprint {
  const d = geo.diameterMm / 1000
  switch (geo.category) {
    case 'PIPE':
    case 'FLEX':
    case 'GATE':
    case 'COUPLING': {
      const L = (geo.lengthMm ?? 1000) / 1000
      return { w: L, h: Math.max(d, 0.16), ox: 0, oy: -Math.max(d, 0.16) / 2 }
    }
    case 'BEND': {
      const R = 1.5 * d
      const a = rad(geo.angleDeg ?? 90)
      return { w: R * Math.sin(a), h: R * (1 - Math.cos(a)) + d, ox: -d / 2, oy: -d / 2 }
    }
    case 'YBRANCH':
    case 'TBRANCH': {
      const L = 1.0
      const s = 0.35
      const phi = rad(geo.branchAngleDeg ?? (geo.category === 'TBRANCH' ? 90 : 45))
      const by = s * Math.sin(phi)
      return { w: Math.max(L, L / 2 + s * Math.cos(phi)), h: Math.max(d, by + d / 2), ox: 0, oy: -d / 2 }
    }
    case 'REDUCER': {
      const L = (geo.lengthMm ?? 300) / 1000
      const d2 = (geo.diameter2Mm ?? geo.diameterMm) / 1000
      return { w: L, h: Math.max(d, d2), ox: 0, oy: -Math.max(d, d2) / 2 }
    }
    case 'CAP': {
      const L = 0.15
      return { w: L, h: d, ox: 0, oy: -d / 2 }
    }
    case 'HOOD': {
      return { w: 0.35, h: 0.45, ox: 0, oy: -0.225 }
    }
    case 'UNIT': {
      const [w, h] = UNIT_FOOTPRINTS[sku ?? ''] ?? [1.2, 1.0]
      return { w, h, ox: 0, oy: 0 }
    }
    case 'MACHINE': {
      const m = machineDef(geo.machineType ?? 'misc')
      return { w: m.w, h: m.d, ox: -m.w / 2, oy: -m.d / 2 }
    }
    default:
      return { w: 0.5, h: 0.3, ox: 0, oy: -0.15 }
  }
}

/** connection ports of a part in its local frame (dir = outward angle, deg) */
export function localPorts(geo: PartGeo, sku?: string): Port[] {
  const d = geo.diameterMm / 1000
  switch (geo.category) {
    case 'PIPE':
    case 'FLEX': {
      const L = (geo.lengthMm ?? 1000) / 1000
      return [
        { x: 0, y: 0, dir: 180 },
        { x: L, y: 0, dir: 0 },
      ]
    }
    case 'GATE':
    case 'COUPLING': {
      const L = geo.category === 'GATE' ? 0.25 : 0.2
      return [
        { x: 0, y: 0, dir: 180 },
        { x: L, y: 0, dir: 0 },
      ]
    }
    case 'BEND': {
      const R = 1.5 * d
      const a = rad(geo.angleDeg ?? 90)
      return [
        { x: 0, y: 0, dir: 180 },
        { x: R * Math.sin(a), y: R * (1 - Math.cos(a)), dir: geo.angleDeg ?? 90 },
      ]
    }
    case 'YBRANCH':
    case 'TBRANCH': {
      const L = 1.0
      const s = 0.35
      const phi = geo.category === 'TBRANCH' ? 90 : (geo.branchAngleDeg ?? 45)
      return [
        { x: 0, y: 0, dir: 180 },
        { x: L, y: 0, dir: 0 },
        { x: L / 2 + s * Math.cos(rad(phi)), y: s * Math.sin(rad(phi)), dir: phi },
      ]
    }
    case 'REDUCER': {
      const L = (geo.lengthMm ?? 300) / 1000
      return [
        { x: 0, y: 0, dir: 180 },
        { x: L, y: 0, dir: 0 },
      ]
    }
    case 'CAP':
      return [{ x: 0, y: 0, dir: 180 }]
    case 'HOOD':
      return [{ x: 0, y: 0, dir: 180 }]
    case 'UNIT': {
      const [, h] = UNIT_FOOTPRINTS[sku ?? ''] ?? [1.2, 1.0]
      return [{ x: 0, y: h / 2, dir: 180 }]
    }
    case 'MACHINE': {
      const m = machineDef(geo.machineType ?? 'misc')
      return [{ x: m.w / 2, y: 0, dir: 270 }] // take-off on top edge centre
    }
    default:
      return []
  }
}

/** world ports of a placed item */
export function worldPorts(geo: PartGeo, x: number, y: number, rot: number, sku?: string): Port[] {
  return localPorts(geo, sku).map((p) => {
    const r = rotPoint(p.x, p.y, rot)
    return { x: x + r.x, y: y + r.y, dir: (p.dir + rot + 360) % 360 }
  })
}

/** SVG path (local frame) for the part centreline / outline. */
export function partPaths(geo: PartGeo, sku?: string): {
  body?: string // filled outline (polygon points/path)
  strokes?: { d: string; width: number }[] // centreline strokes (drawn outline+fill)
  extra?: string[] // decorative details
} {
  const d = geo.diameterMm / 1000
  switch (geo.category) {
    case 'PIPE':
    case 'FLEX': {
      const L = (geo.lengthMm ?? 1000) / 1000
      if (geo.category === 'FLEX') {
        // sawtooth decoration
        let zig = `M 0.06 ${-d / 2 + 0.02}`
        const step = 0.12
        let up = true
        for (let x = 0.06; x < L - 0.06; x += step) {
          zig += ` L ${Math.min(x + step, L - 0.06).toFixed(3)} ${(up ? -d / 2 + 0.02 : d / 2 - 0.02).toFixed(3)}`
          up = !up
        }
        return {
          strokes: [{ d: `M 0 0 L ${L} 0`, width: d }],
          extra: [zig],
        }
      }
      return { strokes: [{ d: `M 0 0 L ${L} 0`, width: d }] }
    }
    case 'GATE': {
      const L = 0.25
      return {
        strokes: [{ d: `M 0 0 L ${L} 0`, width: d }],
        extra: [
          `M ${L / 2} ${-d / 2 - 0.12} L ${L / 2} ${d / 2 + 0.12}`, // handle shaft
          `M ${L / 2 - 0.09} ${-d / 2 - 0.12} L ${L / 2 + 0.09} ${-d / 2 - 0.12}`, // handle bar
        ],
      }
    }
    case 'COUPLING': {
      const L = 0.2
      return {
        strokes: [{ d: `M 0 0 L ${L} 0`, width: d }],
        extra: [`M 0.045 ${-d / 2} L 0.045 ${d / 2}`, `M ${L - 0.045} ${-d / 2} L ${L - 0.045} ${d / 2}`],
      }
    }
    case 'BEND': {
      const R = 1.5 * d
      const a = geo.angleDeg ?? 90
      const ex = R * Math.sin(rad(a))
      const ey = R * (1 - Math.cos(rad(a)))
      return { strokes: [{ d: `M 0 0 A ${R} ${R} 0 0 1 ${ex.toFixed(4)} ${ey.toFixed(4)}`, width: d }] }
    }
    case 'YBRANCH':
    case 'TBRANCH': {
      const L = 1.0
      const s = 0.35
      const phi = geo.category === 'TBRANCH' ? 90 : (geo.branchAngleDeg ?? 45)
      const d2 = (geo.diameter2Mm ?? geo.diameterMm) / 1000
      const cx = L / 2 + s * Math.cos(rad(phi))
      const cy = s * Math.sin(rad(phi))
      return {
        strokes: [
          { d: `M 0 0 L ${L} 0`, width: d },
          { d: `M ${L / 2} 0 L ${cx.toFixed(3)} ${cy.toFixed(3)}`, width: Math.min(d2, d) },
        ],
      }
    }
    case 'REDUCER': {
      const L = (geo.lengthMm ?? 300) / 1000
      const d2 = (geo.diameter2Mm ?? geo.diameterMm) / 1000
      return {
        body: `M 0 ${-d / 2} L ${L} ${-d2 / 2} L ${L} ${d2 / 2} L 0 ${d / 2} Z`,
      }
    }
    case 'CAP':
      return {
        strokes: [{ d: `M 0 0 L 0.15 0`, width: d }],
        extra: [`M 0.13 ${-d / 2} L 0.13 ${d / 2}`],
      }
    case 'HOOD': {
      const mouthW = 0.45
      return {
        body: `M 0 ${-d / 2} L 0.35 ${-mouthW / 2} L 0.35 ${mouthW / 2} L 0 ${d / 2} Z`,
        extra: [`M 0.33 ${-mouthW / 2} L 0.33 ${mouthW / 2}`],
      }
    }
    default:
      return {}
  }
}

// --- snapping --------------------------------------------------------------

export const GRID = 0.25 // m
export const SNAP_DIST = 0.45 // m — port magnet radius

export function snapGrid(v: number) {
  return Math.round(v / GRID) * GRID
}

export interface PlacedPort extends Port {
  itemId: string
  index: number
}

/** find the best snap (dragged port → other item port) within SNAP_DIST */
export function bestSnap(
  dragged: { id: string; ports: Port[] },
  others: { id: string; ports: Port[] }[]
): { dx: number; dy: number; port: Port; target: Port; aligned: boolean } | null {
  let best: { dist: number; dx: number; dy: number; port: Port; target: Port; aligned: boolean } | null = null
  for (const o of others) {
    if (o.id === dragged.id) continue
    for (const t of o.ports) {
      for (const p of dragged.ports) {
        const dx = t.x - p.x
        const dy = t.y - p.y
        const dist = Math.hypot(dx, dy)
        if (dist > SNAP_DIST) continue
        const diff = Math.abs((((p.dir - t.dir + 540) % 360) - 180))
        const aligned = diff < 25 // ports face each other
        const score = dist - (aligned ? 0.15 : 0)
        if (!best || score < best.dist - 0.15) {
          best = { dist: score, dx, dy, port: p, target: t, aligned }
        }
      }
    }
  }
  return best
}
