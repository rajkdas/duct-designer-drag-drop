'use client'

import { useMemo } from 'react'
import { useBuilder } from '@/lib/store'
import { machineDef, rotPoint } from '@/lib/geo'
import { centerlineSamples } from './PartShape'

// ---------------------------------------------------------------------------
// Simple isometric 3D preview of the layout (no WebGL needed — keeps the tool
// lightweight for live websites). Pipes are drawn as projected thick
// polylines, machines and collector units as extruded boxes.
// ---------------------------------------------------------------------------

const ISO_X = Math.cos(Math.PI / 6) // cos 30°
const ISO_Y = Math.sin(Math.PI / 6) // sin 30°

type Pt = { x: number; y: number }

function proj(x: number, y: number, z: number, s: number): Pt {
  return {
    x: (x - y) * ISO_X * s,
    y: (x + y) * ISO_Y * s - z * s,
  }
}

/** project with the view offset applied (pure, memo-safe) */
function pAt(x: number, y: number, z: number, s: number, off: Pt): Pt {
  const p = proj(x, y, z, s)
  return { x: p.x + off.x, y: p.y + off.y }
}

export function IsoView({ compact = false }: { compact?: boolean }) {
  const items = useBuilder((s) => s.items)
  const room = useBuilder((s) => s.room)
  const geoOf = useBuilder((s) => s.geoOf)
  const dealerColor = useBuilder((s) => s.dealer?.brandColor)
  const settingsBrand = useBuilder((s) => s.settings.brandColor)
  const brand = dealerColor ?? settingsBrand

  const { s, w, h, off } = useMemo(() => {
    const maxZ = 3.4
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    const consider = (x: number, y: number, z: number) => {
      const p = proj(x, y, z, 1)
      minX = Math.min(minX, p.x)
      maxX = Math.max(maxX, p.x)
      minY = Math.min(minY, p.y)
      maxY = Math.max(maxY, p.y)
    }
    consider(0, 0, 0)
    consider(room.w, 0, 0)
    consider(0, room.h, 0)
    consider(room.w, room.h, 0)
    consider(0, 0, maxZ)
    consider(room.w, room.h, maxZ)
    const pad = compact ? 14 : 46
    const sc = Math.min(760 / (maxX - minX), 520 / (maxY - minY))
    return {
      s: sc,
      w: (maxX - minX) * sc + pad * 2,
      h: (maxY - minY) * sc + pad * 2,
      off: { x: pad - minX * sc, y: pad - minY * sc },
    }
  }, [room, compact])

  // --- static floor & grid ---------------------------------------------------
  const floor = useMemo(() => {
    const c = [pAt(0, 0, 0, s, off), pAt(room.w, 0, 0, s, off), pAt(room.w, room.h, 0, s, off), pAt(0, room.h, 0, s, off)]
    const linesX: { a: Pt; b: Pt }[] = []
    const linesY: { a: Pt; b: Pt }[] = []
    const step = room.w > 16 || room.h > 16 ? 2 : 1
    for (let x = step; x < room.w; x += step) linesX.push({ a: pAt(x, 0, 0, s, off), b: pAt(x, room.h, 0, s, off) })
    for (let y = step; y < room.h; y += step) linesY.push({ a: pAt(0, y, 0, s, off), b: pAt(room.w, y, 0, s, off) })
    return { c, linesX, linesY }
  }, [room, s, off])

  // --- scene items (depth sorted) ---------------------------------------------
  interface IsoPoly {
    pts: Pt[]
    width: number
    kind: string
    accent?: boolean
  }
  interface IsoBox {
    cx: number
    cy: number
    w: number
    d: number
    h: number
    label?: string
    accent?: boolean
  }
  interface IsoItem extends IsoPoly {
    depth: number
    box?: IsoBox
  }

  const polys: IsoItem[] = useMemo(() => {
    const out: IsoItem[] = []
    for (const it of items) {
      const geo = geoOf(it)
      const depth = it.x + it.y + it.z / 10000
      if (geo.category === 'MACHINE') {
        const m = machineDef(geo.machineType ?? 'misc')
        out.push({ pts: [], width: 0, kind: 'MACHINE', depth, box: { cx: it.x, cy: it.y, w: m.w, d: m.d, h: 1.0, label: it.label } })
        continue
      }
      if (geo.category === 'UNIT') {
        out.push({ pts: [], width: 0, kind: 'UNIT', depth, box: { cx: it.x + 0.6, cy: it.y + 0.5, w: 1.2, d: 1.0, h: 1.9, label: it.label, accent: true } })
        // vertical riser from the unit inlet up to the ceiling duct level
        const rp = rotPoint(0, 0.5, it.rot)
        out.push({
          pts: [pAt(it.x + rp.x, it.y + rp.y, 0, s, off), pAt(it.x + rp.x, it.y + rp.y, 2.8, s, off)],
          width: (geo.diameterMm / 1000) * 0.9,
          kind: 'PIPE',
          depth: depth - 0.01,
        })
        continue
      }
      const samples = centerlineSamples(geo)
      const zStart = it.z / 1000
      const zEnd = (it.z2 ?? it.z) / 1000
      for (const seg of samples) {
        const worldPts = seg.pts.map((p) => rotPoint(p.x, p.y, it.rot))
        const n = worldPts.length
        const pts = worldPts.map((wp, i) => {
          const t = n === 1 ? 0 : i / (n - 1)
          return pAt(it.x + wp.x, it.y + wp.y, zStart + (zEnd - zStart) * t, s, off)
        })
        out.push({ pts, width: seg.width, kind: geo.category, depth, accent: geo.category === 'FLEX' })
      }
    }
    return out.sort((a, b) => a.depth - b.depth)
  }, [items, geoOf, s, off])

  // local helper for render-time drawing
  const P = (x: number, y: number, z: number) => pAt(x, y, z, s, off)

  const isoBox = (cx: number, cy: number, wIn: number, dIn: number, height: number, colors: { top: string; left: string; right: string; stroke: string }) => {
    const x0 = cx - wIn / 2
    const x1 = cx + wIn / 2
    const y0 = cy - dIn / 2
    const y1 = cy + dIn / 2
    const A = P(x0, y0, height) // top face
    const B = P(x1, y0, height)
    const C = P(x1, y1, height)
    const D = P(x0, y1, height)
    const Bb = P(x1, y0, 0) // right face (x+ side)
    const Cb = P(x1, y1, 0)
    const Cc = P(x1, y1, height)
    const Dd = P(x0, y1, 0) // front face (y+ side)
    return (
      <g stroke={colors.stroke} strokeWidth={1} strokeLinejoin="round">
        <polygon points={`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y} ${D.x},${D.y}`} fill={colors.top} />
        <polygon points={`${B.x},${B.y} ${C.x},${C.y} ${Cc.x},${Cc.y} ${Bb.x},${Bb.y}`} fill={colors.right} />
        <polygon points={`${C.x},${C.y} ${D.x},${D.y} ${Dd.x},${Dd.y} ${Cb.x},${Cb.y}`} fill={colors.left} />
      </g>
    )
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-b from-[#f6f8fb] to-[#eef1f6]">
      <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Isometric 3D preview of the duct layout">
        {/* floor */}
        <polygon points={floor.c.map((p) => `${p.x},${p.y}`).join(' ')} fill="#fbfcfe" stroke="#c6d1dd" strokeWidth={1.5} />
        {floor.linesX.map((l, i) => (
          <line key={`gx${i}`} x1={l.a.x} y1={l.a.y} x2={l.b.x} y2={l.b.y} stroke="#e9eef4" strokeWidth={1} />
        ))}
        {floor.linesY.map((l, i) => (
          <line key={`gy${i}`} x1={l.a.x} y1={l.a.y} x2={l.b.x} y2={l.b.y} stroke="#e9eef4" strokeWidth={1} />
        ))}

        {polys.map((p, i) => {
          if (p.box) {
            const isUnit = p.kind === 'UNIT'
            return (
              <g key={i}>
                {/* soft floor shadow */}
                <ellipse
                  cx={P(p.box.cx, p.box.cy, 0).x}
                  cy={P(p.box.cx, p.box.cy, 0).y + 3}
                  rx={(p.box.w * s) / 1.6}
                  ry={(p.box.d * s) / 2.8}
                  fill="#0f172a"
                  opacity={0.08}
                />
                {isoBox(
                  p.box.cx,
                  p.box.cy,
                  p.box.w,
                  p.box.d,
                  p.box.h,
                  isUnit
                    ? { top: '#f4f8fb', left: '#cfdce8', right: '#e2ebf2', stroke: brand }
                    : { top: '#eef3f8', left: '#cdd9e4', right: '#dde6ee', stroke: '#64798e' }
                )}
                {p.box.label && (
                  <text
                    x={P(p.box.cx, p.box.cy, p.box.h).x}
                    y={P(p.box.cx, p.box.cy, p.box.h).y - 8}
                    textAnchor="middle"
                    fontSize={11}
                    fontWeight={600}
                    fill="#5b6b7e"
                  >
                    {p.box.label}
                  </text>
                )}
              </g>
            )
          }
          const d = p.pts.map((pt) => `${pt.x},${pt.y}`).join(' ')
          const strokeW = Math.max(4, p.width * s * 1.15)
          return (
            <g key={i} strokeLinecap="round" strokeLinejoin="round">
              <polyline points={d} fill="none" stroke="#4f6275" strokeWidth={strokeW + 2} />
              <polyline points={d} fill="none" stroke={p.accent ? '#e6d3bd' : '#ccd6df'} strokeWidth={strokeW} />
              {/* bottom shade + specular highlight → cylindrical metal look */}
              <polyline points={d} fill="none" stroke="#9fb0bf" strokeWidth={Math.max(1.5, strokeW * 0.3)} transform={`translate(0 ${strokeW * 0.22})`} opacity={0.75} />
              <polyline points={d} fill="none" stroke="#f8fbfd" strokeWidth={Math.max(1.2, strokeW * 0.3)} transform="translate(-1 -2)" opacity={0.95} />
              {p.kind === 'FLEX' && (
                <polyline points={d} fill="none" stroke="#b09a7f" strokeWidth={strokeW} strokeDasharray="6 5" opacity={0.55} />
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
