'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { PPM, useBuilder } from '@/lib/store'
import { footprint, localPorts, worldPorts } from '@/lib/geo'
import type { PlacedItem } from '@/lib/types'
import { PartShape, centerlineSamples } from './PartShape'
import { Plus, Minus } from 'lucide-react'

// ---------------------------------------------------------------------------
// Interactive 2D top-view canvas (SVG) in approved CAD style: graph grid,
// double-line walls with poché + door swing, dimension lines, double-line
// duct channels with blue joint dots and take-off markers, light-blue
// machine plates. All geometry stays store-driven (live sync).
// ---------------------------------------------------------------------------

const SNAP_ANG = 22.5
const WALL_T = 0.12 // wall thickness (m)
const DUCT_OUT = '#8b95a5'
const DUCT_IN = '#ffffff'
const FLEX_IN = '#f6ead8'
const PLATE_FILL = '#dce6f4'
const PLATE_STROKE = '#64748b'

export function screenToWorld(clientX: number, clientY: number, rect: DOMRect, zoom: number, pan: { x: number; y: number }) {
  const k = PPM * zoom
  return { x: (clientX - rect.left - pan.x) / k, y: (clientY - rect.top - pan.y) / k }
}

type DragState =
  | { mode: 'pan'; sx: number; sy: number; px: number; py: number }
  | { mode: 'item'; id: string; offX: number; offY: number }
  | { mode: 'rotate'; id: string; startAngle: number; startRot: number }
  | { mode: 'pinch'; p1: number; p2: number; dist: number; mid: { x: number; y: number }; zoom: number; pan: { x: number; y: number } }
  | null

/** double-line duct channel drawn from the part centreline */
function DuctShape({ geo, brand }: { geo: ReturnType<typeof useBuilder.getState> extends never ? never : any; brand: string }) {
  const samples = centerlineSamples(geo)
  const inner = geo.category === 'FLEX' ? FLEX_IN : DUCT_IN
  return (
    <g>
      {samples.map((seg: { pts: { x: number; y: number }[]; width: number }, i: number) => {
        const d = seg.pts.map((p, idx) => `${idx ? 'L' : 'M'}${p.x} ${p.y}`).join(' ')
        const ticks: React.ReactNode[] = []
        for (let j = 0; j < seg.pts.length; j++) {
          const a = seg.pts[Math.max(0, j - 1)]
          const b = seg.pts[Math.min(seg.pts.length - 1, j + 1)]
          const vx = b.x - a.x
          const vy = b.y - a.y
          const len = Math.hypot(vx, vy) || 1
          const px = -vy / len
          const py = vx / len
          const h = seg.width / 2 + 0.02
          const p = seg.pts[j]
          ticks.push(
            <line key={j} x1={p.x - px * h} y1={p.y - py * h} x2={p.x + px * h} y2={p.y + py * h} stroke={DUCT_OUT} strokeWidth={0.02} />
          )
        }
        return (
          <g key={i}>
            <path d={d} fill="none" stroke={DUCT_OUT} strokeWidth={seg.width + 0.035} />
            <path d={d} fill="none" stroke={inner} strokeWidth={seg.width} />
            {geo.category === 'FLEX' && <path d={d} fill="none" stroke="#b8a48f" strokeWidth={seg.width} strokeDasharray="0.18 0.14" opacity={0.35} />}
            {ticks}
          </g>
        )
      })}
      {void brand}
    </g>
  )
}

/** light-blue machine / unit plate with schematic internal detail */
function PlateShape({ geo, sku, brand }: { geo: any; sku?: string; brand: string }) {
  const fp = footprint(geo, sku)
  const isUnit = geo.category === 'UNIT'
  const type: string = geo.machineType ?? 'misc'
  const { ox, oy, w, h } = fp
  const s = PLATE_STROKE
  const detail = () => {
    const ln = (x1: number, y1: number, x2: number, y2: number) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={s} strokeWidth={0.015} />
    switch (type) {
      case 'table-saw':
        return (
          <g fill="none">
            {ln(ox, oy + h * 0.35, ox + w, oy + h * 0.35)}
            <rect x={ox + w * 0.08} y={oy + h * 0.5} width={w * 0.26} height={h * 0.36} stroke={s} strokeWidth={0.015} />
            <circle cx={ox + w * 0.7} cy={oy + h * 0.2} r={Math.min(w, h) * 0.1} stroke={s} strokeWidth={0.015} />
          </g>
        )
      case 'planer':
      case 'jointer':
      case 'wide-belt':
        return <g fill="none">{ln(ox + w * 0.3, oy, ox + w * 0.3, oy + h)}{ln(ox + w * 0.8, oy, ox + w * 0.8, oy + h)}</g>
      case 'edge-bander':
        return <g fill="none">{ln(ox + w * 0.15, oy, ox + w * 0.15, oy + h)}</g>
      case 'cnc':
        return <g fill="none">{ln(ox + w * 0.35, oy + h * 0.3, ox + w * 0.65, oy + h * 0.7)}{ln(ox + w * 0.65, oy + h * 0.3, ox + w * 0.35, oy + h * 0.7)}</g>
      default:
        return <g fill="none">{ln(ox + w * 0.25, oy + h * 0.25, ox + w * 0.75, oy + h * 0.75)}</g>
    }
  }
  const port = localPorts(geo, sku)[0]
  return (
    <g>
      <rect x={ox} y={oy} width={w} height={h} rx={0.04} fill={isUnit ? '#fde8dd' : PLATE_FILL} stroke={isUnit ? brand : PLATE_STROKE} strokeWidth={0.025} />
      {!isUnit && detail()}
      {isUnit && <rect x={ox + w * 0.3} y={oy + h * 0.25} width={w * 0.4} height={h * 0.5} fill="none" stroke={brand} strokeWidth={0.02} />}
      {port && <rect x={port.x - 0.05} y={port.y - 0.04} width={0.1} height={0.08} fill={brand} />}
    </g>
  )
}

export function PlanCanvas({ readOnly = false }: { readOnly?: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [size, setSize] = useState({ w: 900, h: 600 })
  const [ghost, setGhost] = useState<{ x: number; y: number } | null>(null)
  const dragRef = useRef<DragState>(null)
  const pointers = useRef(new Map<number, { x: number; y: number }>())

  const items = useBuilder((s) => s.items)
  const room = useBuilder((s) => s.room)
  const zoom = useBuilder((s) => s.zoom)
  const pan = useBuilder((s) => s.pan)
  const selectedId = useBuilder((s) => s.selectedId)
  const hoverId = useBuilder((s) => s.hoverId)
  const placing = useBuilder((s) => s.placing)
  const liveSnap = useBuilder((s) => s.liveSnap)
  const products = useBuilder((s) => s.products)
  const geoOf = useBuilder((s) => s.geoOf)
  const select = useBuilder((s) => s.select)
  const hover = useBuilder((s) => s.hover)
  const moveItem = useBuilder((s) => s.moveItem)
  const rotateItem = useBuilder((s) => s.rotateItem)
  const commitPlace = useBuilder((s) => s.commitPlace)
  const setPlacing = useBuilder((s) => s.setPlacing)
  const setPan = useBuilder((s) => s.setPan)
  const zoomBy = useBuilder((s) => s.zoomBy)
  const setZoom = useBuilder((s) => s.setZoom)
  const setLiveSnap = useBuilder((s) => s.setLiveSnap)
  const clearAll = useBuilder((s) => s.clearAll)

  const k = PPM * zoom
  const brand = useBuilder((s) => s.settings.brandColor)

  useEffect(() => {
    const el = svgRef.current?.parentElement
    if (!el) return
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const didFit = useRef(false)
  useEffect(() => {
    if (didFit.current || size.w < 50) return
    didFit.current = true
    const z = Math.min((size.w - 90) / room.w, (size.h - 70) / room.h) / PPM
    setZoom(Math.max(0.25, Math.min(2, z)))
    setPan({ x: (size.w - room.w * PPM * z) / 2, y: (size.h - room.h * PPM * z) / 2 })
  }, [size, room, setPan, setZoom])

  const itemsGeo = useMemo(() => items.map((it) => ({ item: it, geo: geoOf(it) })), [items, geoOf])

  const joints = useMemo(() => {
    const pts: { x: number; y: number }[] = []
    const all = itemsGeo.map(({ item, geo }) => ({
      id: item.id,
      ports: worldPorts(geo, item.x, item.y, item.rot, item.sku),
    }))
    for (let i = 0; i < all.length; i++) {
      for (let j = i + 1; j < all.length; j++) {
        for (const a of all[i].ports) {
          for (const b of all[j].ports) {
            if (Math.hypot(a.x - b.x, a.y - b.y) < 0.03) pts.push({ x: a.x, y: b.y })
          }
        }
      }
    }
    return pts
  }, [itemsGeo])

  const grid = useMemo(() => {
    const w0 = -pan.x / k
    const w1 = (size.w - pan.x) / k
    const h0 = -pan.y / k
    const h1 = (size.h - pan.y) / k
    let step = 0.5
    while (step * k < 14) step *= 2
    const minor: number[] = []
    const major: number[] = []
    for (let x = Math.floor(w0 / step) * step; x <= w1; x += step) (Math.abs(x % 1) < 1e-6 ? major : minor).push(x)
    for (let y = Math.floor(h0 / step) * step; y <= h1; y += step) (Math.abs(y % 1) < 1e-6 ? major : minor).push(y)
    return { minor, major, w0, w1, h0, h1 }
  }, [pan, k, size])

  const toWorld = useCallback(
    (cx: number, cy: number) => {
      const rect = svgRef.current?.getBoundingClientRect()
      if (!rect) return { x: 0, y: 0 }
      return screenToWorld(cx, cy, rect, zoom, pan)
    },
    [zoom, pan]
  )

  const onPointerDownBg = (e: React.PointerEvent) => {
    if (readOnly) {
      dragRef.current = { mode: 'pan', sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y }
      ;(e.target as Element).setPointerCapture?.(e.pointerId)
      return
    }
    if (placing) {
      const w = toWorld(e.clientX, e.clientY)
      commitPlace(w.x, w.y)
      setGhost(null)
      return
    }
    select(null)
    dragRef.current = { mode: 'pan', sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y }
    ;(e.currentTarget as Element).setPointerCapture?.(e.pointerId)
  }

  const onItemPointerDown = (e: React.PointerEvent, item: PlacedItem) => {
    if (readOnly || placing) return
    e.stopPropagation()
    if (e.button === 1) return
    select(item.id)
    const w = toWorld(e.clientX, e.clientY)
    dragRef.current = { mode: 'item', id: item.id, offX: w.x - item.x, offY: w.y - item.y }
    ;(e.currentTarget as Element).setPointerCapture?.(e.pointerId)
  }

  const onRotateDown = (e: React.PointerEvent, item: PlacedItem) => {
    e.stopPropagation()
    const w = toWorld(e.clientX, e.clientY)
    dragRef.current = {
      mode: 'rotate',
      id: item.id,
      startAngle: (Math.atan2(w.y - item.y, w.x - item.x) * 180) / Math.PI,
      startRot: item.rot,
    }
    ;(e.currentTarget as Element).setPointerCapture?.(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (placing) {
      const w = toWorld(e.clientX, e.clientY)
      setGhost(w)
      return
    }
    const d = dragRef.current
    if (!d) return
    if (d.mode === 'pan') {
      setPan({ x: d.px + (e.clientX - d.sx), y: d.py + (e.clientY - d.sy) })
    } else if (d.mode === 'item') {
      const w = toWorld(e.clientX, e.clientY)
      moveItem(d.id, w.x - d.offX, w.y - d.offY)
    } else if (d.mode === 'rotate') {
      const w = toWorld(e.clientX, e.clientY)
      const it = items.find((i) => i.id === d.id)
      if (!it) return
      const ang = (Math.atan2(w.y - it.y, w.x - it.x) * 180) / Math.PI
      let delta = ang - d.startAngle
      const step = e.shiftKey ? 1 : SNAP_ANG
      delta = Math.round(delta / step) * step
      const newRot = (d.startRot + delta + 360 * 10) % 360
      if (Math.abs(newRot - it.rot) > 0.01) rotateItem(d.id, newRot - it.rot)
    }
  }

  const onPointerUp = () => {
    dragRef.current = null
    setLiveSnap(null)
  }

  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const f = e.deltaY < 0 ? 1.12 : 1 / 1.12
      useBuilder.getState().zoomBy(f, e.clientX - rect.left, e.clientY - rect.top)
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  const trackPointer = (e: React.PointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 2 && !dragRef.current) {
      const [a, b] = [...pointers.current.values()]
      const rect = svgRef.current?.getBoundingClientRect()
      dragRef.current = {
        mode: 'pinch',
        p1: a.x,
        p2: a.y,
        dist: Math.hypot(a.x - b.x, a.y - b.y),
        mid: { x: (a.x + b.x) / 2 - (rect?.left ?? 0), y: (a.y + b.y) / 2 - (rect?.top ?? 0) },
        zoom,
        pan,
      }
    }
  }
  const releasePointer = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId)
    if (dragRef.current?.mode === 'pinch' && pointers.current.size < 2) dragRef.current = null
  }

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current
      if (d?.mode !== 'pinch') return
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (pointers.current.size < 2) return
      const [a, b] = [...pointers.current.values()]
      const rect = svgRef.current?.getBoundingClientRect()
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      const mid = { x: (a.x + b.x) / 2 - (rect?.left ?? 0), y: (a.y + b.y) / 2 - (rect?.top ?? 0) }
      const f = dist / d.dist
      const nz = Math.min(4, Math.max(0.25, d.zoom * f))
      const wx = (d.mid.x - d.pan.x) / (PPM * d.zoom)
      const wy = (d.mid.y - d.pan.y) / (PPM * d.zoom)
      useBuilder.getState().setZoom(nz)
      useBuilder.getState().setPan({ x: mid.x - wx * PPM * nz, y: mid.y - wy * PPM * nz })
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPlacing(null)
        setGhost(null)
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [setPlacing])

  useEffect(() => {
    if (!placing || readOnly) return
    const up = (e: PointerEvent) => {
      if (!useBuilder.getState().placing) return
      const overCanvas = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-canvas]')
      if (overCanvas && svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect()
        const w = screenToWorld(e.clientX, e.clientY, rect, useBuilder.getState().zoom, useBuilder.getState().pan)
        commitPlace(w.x, w.y)
        setPlacing(null)
      }
      setGhost(null)
    }
    window.addEventListener('pointerup', up, { once: true })
    return () => window.removeEventListener('pointerup', up)
  }, [placing, commitPlace, setPlacing, readOnly])

  const renderItem = ({ item, geo }: { item: PlacedItem; geo: ReturnType<typeof geoOf> }) => {
    const selected = item.id === selectedId
    const hovered = item.id === hoverId
    const fp = footprint(geo, item.sku)
    const isPlate = geo.category === 'MACHINE' || geo.category === 'UNIT'
    return (
      <g
        key={item.id}
        transform={`translate(${item.x} ${item.y}) rotate(${item.rot})`}
        onPointerDown={(e) => onItemPointerDown(e, item)}
        onPointerEnter={() => !readOnly && hover(item.id)}
        onPointerLeave={() => hover(null)}
        style={{ cursor: readOnly ? 'default' : placing ? 'crosshair' : 'move' }}
      >
        {(selected || hovered) && !readOnly && (
          <rect
            x={fp.ox - 0.09}
            y={fp.oy - 0.09}
            width={fp.w + 0.18}
            height={fp.h + 0.18}
            rx={0.06}
            fill={selected ? 'rgba(37,99,235,0.06)' : 'transparent'}
            stroke={selected ? brand : '#cbd5e1'}
            strokeWidth={selected ? 0.035 : 0.025}
            strokeDasharray={selected ? '0.22 0.14' : undefined}
          />
        )}
        {isPlate ? <PlateShape geo={geo} sku={item.sku} brand={brand} /> : <DuctShape geo={geo} brand={brand} />}
        {selected && !readOnly && (
          <>
            {localPorts(geo, item.sku).map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={0.06} fill="#fff" stroke="#475569" strokeWidth={0.028} />
            ))}
            <g onPointerDown={(e) => onRotateDown(e, item)} style={{ cursor: 'grab' }}>
              <line x1={fp.ox + fp.w} y1={fp.oy + fp.h / 2} x2={fp.ox + fp.w + 0.35} y2={fp.oy + fp.h / 2} stroke={brand} strokeWidth={0.03} />
              <circle cx={fp.ox + fp.w + 0.35} cy={fp.oy + fp.h / 2} r={0.09} fill="#fff" stroke={brand} strokeWidth={0.035} />
              <circle cx={fp.ox + fp.w + 0.35} cy={fp.oy + fp.h / 2} r={0.035} fill={brand} />
            </g>
          </>
        )}
      </g>
    )
  }

  const ghostGeo = useMemo(() => {
    if (!placing) return null
    if (placing.kind === 'machine') {
      return { category: 'MACHINE' as const, diameterMm: 125, machineType: placing.machine }
    }
    const p = products.find((x) => x.id === placing.productId)
    if (!p) return null
    return {
      category: p.category,
      diameterMm: p.diameterMm,
      diameter2Mm: p.diameter2Mm,
      lengthMm: p.lengthMm,
      angleDeg: p.angleDeg,
      branchAngleDeg: p.branchAngleDeg,
    }
  }, [placing, products])

  const machinesAndUnits = itemsGeo.filter((g) => g.geo.category === 'MACHINE' || g.geo.category === 'UNIT')
  const ducts = itemsGeo.filter((g) => g.geo.category !== 'MACHINE' && g.geo.category !== 'UNIT')

  // door opening (double leaf) at bottom centre
  const cx = room.w / 2
  const leaf = 0.5

  return (
    <div className="relative h-full w-full overflow-hidden bg-white" data-canvas>
      <span className="pointer-events-none absolute left-3 top-3 z-10 rounded-md bg-slate-800/90 px-2.5 py-1 text-[11px] font-semibold text-white">
        2D – Grundriss
      </span>

      <svg
        ref={svgRef}
        className={`h-full w-full touch-none ${placing ? 'cursor-crosshair' : 'cursor-grab'}`}
        onPointerDown={onPointerDownBg}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerDownCapture={trackPointer}
        onPointerUpCapture={releasePointer}
        role="application"
        aria-label="Duct layout canvas"
      >
        <g transform={`translate(${pan.x} ${pan.y}) scale(${k})`}>
          <rect x={0} y={0} width={room.w} height={room.h} fill="#ffffff" />
          {/* graph-paper grid */}
          <g>
            {grid.minor.map((v, i) => (
              <line key={`vm${i}`} x1={v} y1={grid.h0} x2={v} y2={grid.h1} stroke="#eef2f7" strokeWidth={1} vectorEffect="non-scaling-stroke" />
            ))}
            {grid.minor.map((v, i) => (
              <line key={`hm${i}`} x1={grid.w0} y1={v} x2={grid.w1} y2={v} stroke="#eef2f7" strokeWidth={1} vectorEffect="non-scaling-stroke" />
            ))}
            {grid.major.map((v, i) => (
              <line key={`vM${i}`} x1={v} y1={grid.h0} x2={v} y2={grid.h1} stroke="#e2e8f0" strokeWidth={1} vectorEffect="non-scaling-stroke" />
            ))}
            {grid.major.map((v, i) => (
              <line key={`hM${i}`} x1={grid.w0} y1={v} x2={grid.w1} y2={v} stroke="#e2e8f0" strokeWidth={1} vectorEffect="non-scaling-stroke" />
            ))}
          </g>

          {/* double-line walls with poché */}
          <path
            d={`M0 0 H${room.w} V${room.h} H0 Z M${WALL_T} ${WALL_T} H${room.w - WALL_T} V${room.h - WALL_T} H${WALL_T} Z`}
            fill="#e2e6eb"
            fillRule="evenodd"
            stroke="#8b95a5"
            strokeWidth={1.2}
            vectorEffect="non-scaling-stroke"
          />
          {/* door opening + swing arcs */}
          <rect x={cx - leaf} y={room.h - WALL_T - 0.02} width={leaf * 2} height={WALL_T + 0.04} fill="#ffffff" />
          <line x1={cx - leaf} y1={room.h} x2={cx - leaf} y2={room.h - leaf} stroke="#8b95a5" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
          <path d={`M${cx - leaf} ${room.h - leaf} A${leaf} ${leaf} 0 0 1 ${cx} ${room.h}`} fill="none" stroke="#b6c0cc" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          <line x1={cx + leaf} y1={room.h} x2={cx + leaf} y2={room.h - leaf} stroke="#8b95a5" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
          <path d={`M${cx + leaf} ${room.h - leaf} A${leaf} ${leaf} 0 0 0 ${cx} ${room.h}`} fill="none" stroke="#b6c0cc" strokeWidth={1} vectorEffect="non-scaling-stroke" />

          {machinesAndUnits.map(renderItem)}
          {ducts.map(renderItem)}

          {/* blue joint dots */}
          {joints.map((j, i) => (
            <circle key={i} cx={j.x} cy={j.y} r={0.055} fill={brand} opacity={0.9} />
          ))}

          {liveSnap && (
            <circle cx={liveSnap.x} cy={liveSnap.y} r={0.16} fill="none" stroke={liveSnap.aligned ? '#16a34a' : '#d97706'} strokeWidth={2.5} strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
          )}

          {placing && ghost && ghostGeo && (
            <g transform={`translate(${ghost.x} ${ghost.y})`} opacity={0.6}>
              {ghostGeo.category === 'MACHINE' ? (
                <PlateShape geo={ghostGeo} brand={brand} />
              ) : (
                <DuctShape geo={ghostGeo} brand={brand} />
              )}
              {localPorts(ghostGeo, placing.kind === 'product' ? products.find((p) => p.id === placing.productId)?.sku : undefined).map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={0.06} fill="#fff" stroke="#475569" strokeWidth={0.028} />
              ))}
            </g>
          )}
        </g>

        {/* screen-space overlay: dimensions + machine labels */}
        <g>
          <g stroke="#94a3b8" strokeWidth={1}>
            <line x1={pan.x} y1={pan.y - 6} x2={pan.x} y2={pan.y - 28} />
            <line x1={pan.x + room.w * k} y1={pan.y - 6} x2={pan.x + room.w * k} y2={pan.y - 28} />
            <line x1={pan.x - 6} y1={pan.y} x2={pan.x - 28} y2={pan.y} />
            <line x1={pan.x - 6} y1={pan.y + room.h * k} x2={pan.x - 28} y2={pan.y + room.h * k} />
          </g>
          <g stroke="#64748b" strokeWidth={1}>
            <line x1={pan.x} y1={pan.y - 22} x2={pan.x + room.w * k} y2={pan.y - 22} />
            <line x1={pan.x - 22} y1={pan.y} x2={pan.x - 22} y2={pan.y + room.h * k} />
          </g>
          <g fill="#64748b">
            <path d={`M${pan.x} ${pan.y - 22} l10 -3 v6 z`} />
            <path d={`M${pan.x + room.w * k} ${pan.y - 22} l-10 -3 v6 z`} />
            <path d={`M${pan.x - 22} ${pan.y} l-3 10 h6 z`} />
            <path d={`M${pan.x - 22} ${pan.y + room.h * k} l-3 -10 h6 z`} />
          </g>
          <text x={pan.x + (room.w * k) / 2} y={pan.y - 30} textAnchor="middle" fontSize={11} fontWeight={600} fill="#475569">
            {room.w.toFixed(2).replace('.', ',')} m
          </text>
          <text
            x={pan.x - 30}
            y={pan.y + (room.h * k) / 2}
            textAnchor="middle"
            fontSize={11}
            fontWeight={600}
            fill="#475569"
            transform={`rotate(-90 ${pan.x - 30} ${pan.y + (room.h * k) / 2})`}
          >
            {room.h.toFixed(2).replace('.', ',')} m
          </text>

          {itemsGeo
            .filter((g) => (g.geo.category === 'MACHINE' || g.geo.category === 'UNIT') && (g.item.label || g.geo.category === 'MACHINE'))
            .map(({ item, geo }) => {
              const fp = footprint(geo, item.sku)
              const isUnit = geo.category === 'UNIT'
              const lp = isUnit
                ? { x: (item.x + fp.ox + fp.w / 2) * k + pan.x, y: (item.y + fp.oy) * k + pan.y - 8 }
                : { x: (item.x + fp.ox + fp.w / 2) * k + pan.x, y: (item.y + fp.oy + fp.h) * k + pan.y + 14 }
              return (
                <text
                  key={`ml${item.id}`}
                  x={lp.x}
                  y={lp.y}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={600}
                  fill="#334155"
                  stroke="white"
                  strokeWidth={3}
                  paintOrder="stroke"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {item.label ?? (geo.category === 'MACHINE' ? (geo as any).machineType : '')}
                </text>
              )
            })}
        </g>
      </svg>

      {/* zoom stack (approved UI, bottom-right) */}
      {!readOnly && (
        <div className="absolute bottom-3 right-3 z-10 flex flex-col divide-y divide-slate-200 overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
          <button className="flex h-8 w-8 items-center justify-center text-slate-600 hover:bg-slate-50" onClick={() => zoomBy(1.2)} aria-label="Zoom in">
            <Plus className="h-4 w-4" />
          </button>
          <button className="flex h-8 w-8 items-center justify-center text-slate-600 hover:bg-slate-50" onClick={() => zoomBy(1 / 1.2)} aria-label="Zoom out">
            <Minus className="h-4 w-4" />
          </button>
        </div>
      )}

      {items.length === 0 && !readOnly && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="max-w-xs rounded-xl border border-dashed border-slate-300 bg-white/85 p-5 text-center text-sm text-slate-500">
            <p className="font-medium text-slate-700">Start your layout</p>
            <p className="mt-1">Drag a part from the library, or tap a part once and then click the canvas. Ports snap together automatically.</p>
          </div>
        </div>
      )}
      {!readOnly && items.length > 0 && (
        <button
          onClick={() => {
            if (confirm('Remove all parts from the layout?')) clearAll()
          }}
          className="absolute right-3 top-3 rounded-md border border-slate-200 bg-white/90 px-2.5 py-1.5 text-xs text-slate-500 shadow-sm transition hover:border-red-200 hover:text-red-600"
        >
          Clear layout
        </button>
      )}
      {readOnly && <div className="pointer-events-none absolute right-3 bottom-3 rounded-md border border-slate-200 bg-white/90 px-2 py-1 text-[10px] font-medium tracking-wide text-slate-400 uppercase">Read-only view</div>}
    </div>
  )
}

/** fit view button helper used by the toolbar */
export function fitToRoom() {
  const s = useBuilder.getState()
  const el = document.querySelector('[data-canvas]')?.parentElement
  if (!el) return
  const w = el.clientWidth
  const h = el.clientHeight
  const z = Math.max(0.25, Math.min(2, Math.min((w - 90) / s.room.w, (h - 70) / s.room.h) / PPM))
  s.setZoom(z)
  s.setPan({ x: (w - s.room.w * PPM * z) / 2, y: (h - s.room.h * PPM * z) / 2 })
}