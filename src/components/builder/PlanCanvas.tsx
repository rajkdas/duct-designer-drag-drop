'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { PPM, useBuilder } from '@/lib/store'
import { footprint, localPorts, worldPorts } from '@/lib/geo'
import type { PlacedItem } from '@/lib/types'
import { PartShape } from './PartShape'

// ---------------------------------------------------------------------------
// Interactive 2D top-view canvas (SVG). 1 unit = 1 metre inside the world
// group; pan/zoom via pointer + wheel. Supports drag-from-palette placement,
// item dragging with port snapping, rotation handles and pinch zoom.
// ---------------------------------------------------------------------------

const SNAP_ANG = 22.5

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

  // --- sizing ---------------------------------------------------------------
  useEffect(() => {
    const el = svgRef.current?.parentElement
    if (!el) return
    // ResizeObserver fires once on observe() with the initial size
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // initial fit
  const didFit = useRef(false)
  useEffect(() => {
    if (didFit.current || size.w < 50) return
    didFit.current = true
    const z = Math.min((size.w - 90) / room.w, (size.h - 70) / room.h) / PPM
    setZoom(Math.max(0.25, Math.min(2, z)))
    setPan({ x: (size.w - room.w * PPM * z) / 2, y: (size.h - room.h * PPM * z) / 2 })
  }, [size, room, setPan, setZoom])

  // --- derived geometry -------------------------------------------------------
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

  // --- grid -------------------------------------------------------------------
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
    const labelStep = k >= 34 ? 1 : k >= 17 ? 2 : 5
    return { minor, major, labelStep, w0, w1, h0, h1 }
  }, [pan, k, size])

  // --- pointer handling ---------------------------------------------------------
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

  // non-passive wheel zoom (React onWheel is passive)
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

  // pinch zoom (two pointers)
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

  // cancel placement on Escape
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

  // drop from palette anywhere on window
  useEffect(() => {
    if (!placing || readOnly) return
    const up = (e: PointerEvent) => {
      if (!useBuilder.getState().placing) return // already placed by canvas click
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

  // --- render helpers -----------------------------------------------------------
  const renderItem = ({ item, geo }: { item: PlacedItem; geo: ReturnType<typeof geoOf> }) => {
    const selected = item.id === selectedId
    const hovered = item.id === hoverId
    const fp = footprint(geo, item.sku)
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
            fill={selected ? 'rgba(234,88,12,0.06)' : 'transparent'}
            stroke={selected ? brand : '#cbd5e1'}
            strokeWidth={selected ? 0.035 : 0.025}
            strokeDasharray={selected ? '0.22 0.14' : undefined}
          />
        )}
        <PartShape geo={geo} sku={item.sku} />
        {selected && !readOnly && (
          <>
            {/* ports */}
            {localPorts(geo, item.sku).map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={0.06} fill="#fff" stroke="#475569" strokeWidth={0.028} />
            ))}
            {/* rotate handle */}
            <g
              onPointerDown={(e) => onRotateDown(e, item)}
              style={{ cursor: 'grab' }}
            >
              <line
                x1={fp.ox + fp.w}
                y1={fp.oy + fp.h / 2}
                x2={fp.ox + fp.w + 0.35}
                y2={fp.oy + fp.h / 2}
                stroke={brand}
                strokeWidth={0.03}
              />
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
  void zoomBy

  return (
    <div className="relative h-full w-full overflow-hidden bg-white" data-canvas>
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
          {/* room floor */}
          <rect x={0} y={0} width={room.w} height={room.h} fill="#fcfdfe" />
          {/* grid */}
          <g>
            {grid.minor.map((v, i) => (
              <line key={`vm${i}`} x1={v} y1={grid.h0} x2={v} y2={grid.h1} stroke="#eef1f4" strokeWidth={1} vectorEffect="non-scaling-stroke" />
            ))}
            {grid.minor.map((v, i) => (
              <line key={`hm${i}`} x1={grid.w0} y1={v} x2={grid.w1} y2={v} stroke="#eef1f4" strokeWidth={1} vectorEffect="non-scaling-stroke" />
            ))}
            {grid.major.map((v, i) => (
              <line key={`vM${i}`} x1={v} y1={grid.h0} x2={v} y2={grid.h1} stroke="#e4e8ec" strokeWidth={1} vectorEffect="non-scaling-stroke" />
            ))}
            {grid.major.map((v, i) => (
              <line key={`hM${i}`} x1={grid.w0} y1={v} x2={grid.w1} y2={v} stroke="#e4e8ec" strokeWidth={1} vectorEffect="non-scaling-stroke" />
            ))}
          </g>
          {/* room boundary */}
          <rect x={0} y={0} width={room.w} height={room.h} fill="none" stroke="#94a3b8" strokeWidth={1.6} vectorEffect="non-scaling-stroke" rx={0.05} />

          {/* machines & units below ducts */}
          {machinesAndUnits.map(renderItem)}
          {ducts.map(renderItem)}

          {/* joints */}
          {joints.map((j, i) => (
            <circle key={i} cx={j.x} cy={j.y} r={0.055} fill={brand} opacity={0.85} />
          ))}

          {/* snap indicator */}
          {liveSnap && (
            <g>
              <circle cx={liveSnap.x} cy={liveSnap.y} r={0.16} fill="none" stroke={liveSnap.aligned ? '#16a34a' : '#d97706'} strokeWidth={2.5} strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
            </g>
          )}

          {/* placement ghost */}
          {placing && ghost && ghostGeo && (
            <g transform={`translate(${ghost.x} ${ghost.y})`} opacity={0.6}>
              <PartShape geo={ghostGeo} sku={placing.kind === 'product' ? products.find((p) => p.id === placing.productId)?.sku : undefined} />
              {localPorts(ghostGeo, placing.kind === 'product' ? products.find((p) => p.id === placing.productId)?.sku : undefined).map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={0.06} fill="#fff" stroke="#475569" strokeWidth={0.028} />
              ))}
            </g>
          )}
        </g>

        {/* screen-space overlay: grid labels + machine labels */}
        <g>
          {Array.from({ length: Math.floor(room.w / grid.labelStep) + 1 }, (_, i) => {
            const x = i * grid.labelStep
            return (
              <text key={`lx${i}`} x={x * k + pan.x} y={pan.y + 12} textAnchor="middle" fontSize={9} fill="#b6bfc9">
                {i * grid.labelStep}
              </text>
            )
          })}
          {Array.from({ length: Math.floor(room.h / grid.labelStep) + 1 }, (_, i) => {
            const y = i * grid.labelStep
            return (
              <text key={`ly${i}`} x={pan.x - 6} y={y * k + pan.y + 3} textAnchor="end" fontSize={9} fill="#b6bfc9">
                {i * grid.labelStep}
              </text>
            )
          })}
          {itemsGeo
            .filter((g) => (g.geo.category === 'MACHINE' || g.geo.category === 'UNIT') && g.item.label)
            .map(({ item, geo }) => {
              const fp = footprint(geo, item.sku)
              const isUnit = geo.category === 'UNIT'
              // units: label above the box; machines: label at centre
              const lp = isUnit
                ? { x: (item.x + fp.w / 2) * k + pan.x, y: item.y * k + pan.y - 8 }
                : { x: item.x * k + pan.x, y: item.y * k + pan.y + 4 }
              return (
                <text
                  key={`ml${item.id}`}
                  x={lp.x}
                  y={lp.y}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={600}
                  fill="#64748b"
                  stroke="white"
                  strokeWidth={3}
                  paintOrder="stroke"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {item.label}
                </text>
              )
            })}
        </g>
      </svg>

      {/* scale bar */}
      <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2 rounded-md border border-slate-200 bg-white/90 px-2 py-1 text-[10px] text-slate-500 shadow-sm">
        <div className="h-[6px] border-x-2 border-b-2 border-slate-400" style={{ width: k }} />
        1 m
      </div>

      {/* hints */}
      {items.length === 0 && !readOnly && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="max-w-xs rounded-xl border border-dashed border-slate-300 bg-white/85 p-5 text-center text-sm text-slate-500">
            <p className="font-medium text-slate-700">Start your layout</p>
            <p className="mt-1">
              Drag a part from the library, or tap a part once and then click the canvas. Ports snap together automatically.
            </p>
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
