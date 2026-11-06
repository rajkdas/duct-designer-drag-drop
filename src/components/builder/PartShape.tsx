'use client'

import { footprint, machineDef, partPaths, rad, type PartGeo } from '@/lib/geo'

// ---------------------------------------------------------------------------
// PartShape renders one part in its local frame (metres). Wrap it in a
// <g transform="translate(px,py) rotate(rot)"> belonging to a scaled group
// where 1 unit = 1 metre. Shared by the plan canvas, palette thumbnails and
// the read-only share view.
// ---------------------------------------------------------------------------

const FILL = '#dce1e8'
const OUTLINE = '#5b6572'
const DETAIL = '#8e9aa8'
const HIGHLIGHT = '#f6f8fa'

export function PartDefs() {
  // shared gradient definitions — include once per SVG root
  return (
    <defs>
      <linearGradient id="ps-steel" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f2f5f8" />
        <stop offset="0.55" stopColor="#dde3e9" />
        <stop offset="1" stopColor="#c6cfd8" />
      </linearGradient>
    </defs>
  )
}

export function PartShape({ geo, sku, dim = false }: { geo: PartGeo; sku?: string; dim?: boolean }) {
  const fill = dim ? '#f4f6f8' : FILL

  if (geo.category === 'MACHINE') {
    const m = machineDef(geo.machineType ?? 'misc')
    return (
      <g>
        <rect
          x={-m.w / 2}
          y={-m.d / 2}
          width={m.w}
          height={m.d}
          rx={0.08}
          fill="url(#ps-steel)"
          stroke={OUTLINE}
          strokeWidth={0.045}
        />
        <rect x={-m.w / 2 + 0.12} y={-m.d / 2 + 0.12} width={m.w - 0.24} height={m.d - 0.24} rx={0.05} fill="none" stroke="#aebfcd" strokeWidth={0.02} strokeDasharray="0.18 0.12" />
        {/* take-off port marker */}
        <circle cx={m.w / 2} cy={0} r={0.09} fill="#ffffff" stroke={DETAIL} strokeWidth={0.035} />
        <circle cx={m.w / 2} cy={0} r={0.04} fill="#0b33d5" opacity={0.85} />
      </g>
    )
  }

  if (geo.category === 'UNIT') {
    const fp = footprint(geo, sku)
    return (
      <g>
        <rect x={0} y={0} width={fp.w} height={fp.h} rx={0.08} fill="url(#ps-steel)" stroke={OUTLINE} strokeWidth={0.05} />
        {/* fan */}
        <circle cx={fp.w * 0.32} cy={fp.h / 2} r={Math.min(fp.w, fp.h) * 0.26} fill="#ffffff" stroke={DETAIL} strokeWidth={0.04} />
        <path
          d={`M ${fp.w * 0.32} ${fp.h / 2 - Math.min(fp.w, fp.h) * 0.26} A ${Math.min(fp.w, fp.h) * 0.26} ${Math.min(fp.w, fp.h) * 0.26} 0 0 1 ${fp.w * 0.32} ${fp.h / 2 + Math.min(fp.w, fp.h) * 0.26}`}
          fill="none"
          stroke={DETAIL}
          strokeWidth={0.03}
        />
        {/* filter cartridges */}
        <rect x={fp.w * 0.62} y={fp.h * 0.18} width={fp.w * 0.26} height={fp.h * 0.64} rx={0.04} fill="#ffffff" stroke={DETAIL} strokeWidth={0.035} />
        <path d={`M ${fp.w * 0.62} ${fp.h / 2} L ${fp.w * 0.88} ${fp.h / 2}`} stroke={DETAIL} strokeWidth={0.03} />
        {/* outlet stub */}
        <rect x={-0.12} y={fp.h / 2 - 0.12} width={0.14} height={0.24} fill={fill} stroke={OUTLINE} strokeWidth={0.03} />
      </g>
    )
  }

  const paths = partPaths(geo, sku)
  return (
    <g>
      {paths.body && <path d={paths.body} fill="url(#ps-steel)" stroke={OUTLINE} strokeWidth={0.035} />}
      {paths.strokes?.map((s, i) => {
        const w = Math.max(s.width, 0.26) // chunky design look even for thin parts
        return (
          <g key={i}>
            <path d={s.d} fill="none" stroke={OUTLINE} strokeWidth={w + 0.025} strokeLinecap="butt" />
            <path d={s.d} fill="none" stroke={fill} strokeWidth={w} strokeLinecap="butt" />
            {/* specular highlight along the pipe axis */}
            <path d={s.d} fill="none" stroke={HIGHLIGHT} strokeWidth={w * 0.22} strokeLinecap="butt" opacity={0.85} transform="translate(0 -0.045)" />
          </g>
        )
      })}
      {paths.extra?.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={DETAIL} strokeWidth={0.035} strokeLinecap="round" />
      ))}
    </g>
  )
}

/** small fitted thumbnail for the palette */
export function PartThumb({ geo, sku, size = 46 }: { geo: PartGeo; sku?: string; size?: number }) {
  const fp = footprint(geo, sku)
  const w = Math.max(fp.w, 0.35)
  const h = Math.max(fp.h, 0.35)
  const cx = fp.ox + w / 2
  const cy = fp.oy + h / 2
  const s = Math.min(size / (w + 0.15), size / (h + 0.15))
  return (
    <svg width={size} height={size} viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`} aria-hidden>
      <PartDefs />
      <g transform={`translate(${-cx * s} ${-cy * s}) scale(${s}) rotate(${geo.category === 'UNIT' ? -8 : 0})`}>
        <PartShape geo={geo} sku={sku} />
      </g>
    </svg>
  )
}

/** helper for the iso view: sample a part centreline into world points */
export function centerlineSamples(geo: PartGeo): { pts: { x: number; y: number }[]; width: number }[] {
  const d = geo.diameterMm / 1000
  switch (geo.category) {
    case 'PIPE':
    case 'FLEX':
    case 'REDUCER':
    case 'GATE':
    case 'COUPLING': {
      const L =
        geo.category === 'PIPE' || geo.category === 'FLEX'
          ? (geo.lengthMm ?? 1000) / 1000
          : geo.category === 'REDUCER'
            ? (geo.lengthMm ?? 300) / 1000
            : geo.category === 'GATE'
              ? 0.25
              : 0.2
      return [{ pts: [{ x: 0, y: 0 }, { x: L, y: 0 }], width: d }]
    }
    case 'CAP':
      return [{ pts: [{ x: 0, y: 0 }, { x: 0.15, y: 0 }], width: d }]
    case 'BEND': {
      const R = 1.5 * d
      const a = geo.angleDeg ?? 90
      const pts: { x: number; y: number }[] = []
      for (let i = 0; i <= 14; i++) {
        const t = (i / 14) * rad(a)
        pts.push({ x: R * Math.sin(t), y: R * (1 - Math.cos(t)) })
      }
      return [{ pts, width: d }]
    }
    case 'YBRANCH':
    case 'TBRANCH': {
      const phi = geo.category === 'TBRANCH' ? 90 : (geo.branchAngleDeg ?? 45)
      const s = 0.35
      return [
        { pts: [{ x: 0, y: 0 }, { x: 1.0, y: 0 }], width: d },
        {
          pts: [
            { x: 0.5, y: 0 },
            { x: 0.5 + s * Math.cos(rad(phi)), y: s * Math.sin(rad(phi)) },
          ],
          width: Math.min((geo.diameter2Mm ?? geo.diameterMm) / 1000, d),
        },
      ]
    }
    case 'HOOD':
      return [{ pts: [{ x: 0, y: 0 }, { x: 0.3, y: 0 }], width: d }]
    default:
      return []
  }
}
