'use client'

import { create } from 'zustand'
import type { DealerDTO, DesignData, PlacedItem, ProductDTO, SettingsDTO } from '@/lib/types'
import { itemGeoOf } from '@/lib/types'
import { bestSnap, defaultZ, snapGrid, worldPorts, type PartGeo } from '@/lib/geo'

export const PPM = 42 // pixels per metre at zoom 1

export type Placing =
  | { kind: 'product'; productId: string }
  | { kind: 'machine'; machine: string }
  | null

export interface SnapInfo {
  x: number
  y: number
  aligned: boolean
}

interface DesignSnapshot {
  room: { w: number; h: number }
  items: PlacedItem[]
}

interface BuilderStore {
  // design
  designName: string
  customer: string
  room: { w: number; h: number }
  items: PlacedItem[]
  selectedId: string | null
  hoverId: string | null
  shareId: string | null
  dirty: boolean
  // undo/redo history
  past: DesignSnapshot[]
  future: DesignSnapshot[]
  // context
  products: ProductDTO[]
  settings: SettingsDTO
  dealer: DealerDTO | null
  // view
  view: 'plan' | 'iso' | 'split'
  zoom: number
  pan: { x: number; y: number }
  // interaction
  placing: Placing
  liveSnap: SnapInfo | null

  // --- actions ---
  loadDesign: (data: DesignData, meta?: { name?: string; customer?: string; shareId?: string }) => void
  setProducts: (p: ProductDTO[]) => void
  setSettings: (s: SettingsDTO) => void
  setDealer: (d: DealerDTO | null) => void
  setDesignName: (n: string) => void
  setCustomer: (c: string) => void
  setRoom: (w: number, h: number) => void

  select: (id: string | null) => void
  hover: (id: string | null) => void
  setPlacing: (p: Placing) => void
  commitPlace: (x: number, y: number) => string | null

  moveItem: (id: string, x: number, y: number) => void
  setItemPos: (id: string, x: number, y: number) => void
  rotateItem: (id: string, delta: number) => void
  setItemZ: (id: string, z: number, end?: boolean) => void
  setItemLabel: (id: string, label: string) => void
  swapProduct: (id: string, productId: string) => void
  removeItem: (id: string) => void
  duplicateItem: (id: string) => void
  clearAll: () => void

  pushHistory: () => void
  undo: () => void
  redo: () => void

  setView: (v: 'plan' | 'iso' | 'split') => void
  setZoom: (z: number) => void
  setPan: (p: { x: number; y: number }) => void
  zoomBy: (factor: number, cx?: number, cy?: number) => void
  setLiveSnap: (s: SnapInfo | null) => void
  markSaved: (shareId: string) => void

  geoOf: (item: PlacedItem) => PartGeo
  productOf: (item: PlacedItem) => ProductDTO | undefined
}

function uid() {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10)
}

export const useBuilder = create<BuilderStore>((set, get) => ({
  designName: 'Untitled layout',
  customer: '',
  room: { w: 18, h: 12 },
  items: [],
  selectedId: null,
  hoverId: null,
  shareId: null,
  dirty: false,
  products: [],
  settings: {
    shopName: 'BIMA Absaugtechnik',
    tagline: '',
    currency: 'EUR',
    vatRate: 19,
    brandColor: '#0b33d5',
    contactEmail: '',
  },
  dealer: null,
  view: 'split',
  zoom: 1,
  pan: { x: 60, y: 40 },
  placing: null,
  liveSnap: null,
  past: [],
  future: [],

  pushHistory: () =>
    set((s) => ({
      past: [...s.past.slice(-59), { room: s.room, items: s.items }],
      future: [],
    })),

  undo: () =>
    set((s) => {
      const prev = s.past[s.past.length - 1]
      if (!prev) return {}
      return {
        past: s.past.slice(0, -1),
        future: [...s.future, { room: s.room, items: s.items }],
        room: prev.room,
        items: prev.items,
        selectedId: null,
        dirty: true,
      }
    }),

  redo: () =>
    set((s) => {
      const next = s.future[s.future.length - 1]
      if (!next) return {}
      return {
        future: s.future.slice(0, -1),
        past: [...s.past, { room: s.room, items: s.items }],
        room: next.room,
        items: next.items,
        selectedId: null,
        dirty: true,
      }
    }),

  loadDesign: (data, meta) =>
    set({
      items: data.items,
      room: data.room,
      designName: meta?.name ?? 'Untitled layout',
      customer: meta?.customer ?? '',
      shareId: meta?.shareId ?? null,
      dirty: false,
      selectedId: null,
    }),

  setProducts: (p) => set({ products: p }),
  setSettings: (s) => set({ settings: s }),
  setDealer: (d) => set({ dealer: d }),
  setDesignName: (n) => set({ designName: n, dirty: true }),
  setCustomer: (c) => set({ customer: c, dirty: true }),
  setRoom: (w, h) => {
    get().pushHistory()
    set({ room: { w, h }, dirty: true })
  },

  select: (id) => set({ selectedId: id }),
  hover: (id) => set({ hoverId: id }),
  setPlacing: (p) => set({ placing: p }),

  commitPlace: (x, y) => {
    const { placing, products, items } = get()
    if (!placing) return null
    let item: PlacedItem | null = null
    if (placing.kind === 'product') {
      const p = products.find((x2) => x2.id === placing.productId)
      if (!p) return null
      item = {
        id: uid(),
        productId: p.id,
        sku: p.sku,
        x: snapGrid(x),
        y: snapGrid(y),
        z: defaultZ(p.category),
        rot: 0,
      }
    } else {
      item = { id: uid(), machine: placing.machine, x: snapGrid(x), y: snapGrid(y), z: defaultZ('MACHINE'), rot: 0 }
    }
    // try to snap the new item's first port onto an existing free port
    const geo = itemGeoOf(item, products)
    const ports = worldPorts(geo, item.x, item.y, item.rot, item.sku)
    const snap = bestSnap(
      { id: item.id, ports },
      items.map((o) => ({ id: o.id, ports: worldPorts(itemGeoOf(o, products), o.x, o.y, o.rot, o.sku) }))
    )
    if (snap) {
      item.x += snap.dx
      item.y += snap.dy
    }
    get().pushHistory()
    set({ items: [...items, item], selectedId: item.id, dirty: true, placing: null })
    return item.id
  },

  moveItem: (id, x, y) => {
    const { items, products } = get()
    const item = items.find((i) => i.id === id)
    if (!item) return
    let nx = x
    let ny = y
    let snap: SnapInfo | null = null
    const geo = itemGeoOf({ ...item, x, y }, products)
    const ports = worldPorts(geo, x, y, item.rot, item.sku)
    const best = bestSnap(
      { id, ports },
      items
        .filter((o) => o.id !== id)
        .map((o) => ({ id: o.id, ports: worldPorts(itemGeoOf(o, products), o.x, o.y, o.rot, o.sku) }))
    )
    if (best) {
      nx = x + best.dx
      ny = y + best.dy
      snap = { x: best.target.x, y: best.target.y, aligned: best.aligned }
    } else {
      nx = snapGrid(x)
      ny = snapGrid(y)
    }
    set({
      items: items.map((i) => (i.id === id ? { ...i, x: nx, y: ny } : i)),
      dirty: true,
      liveSnap: snap,
    })
  },

  setItemPos: (id, x, y) =>
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, x, y } : i)),
      dirty: true,
    })),

  rotateItem: (id, delta) =>
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, rot: (((i.rot + delta) % 360) + 360) % 360 } : i)),
      dirty: true,
    })),

  setItemZ: (id, z, end) =>
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? (end ? { ...i, z2: z } : { ...i, z }) : i)),
      dirty: true,
    })),

  setItemLabel: (id, label) =>
    set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, label } : i)), dirty: true })),

  swapProduct: (id, productId) => {
    const { items, products } = get()
    const p = products.find((x) => x.id === productId)
    if (!p) return
    get().pushHistory()
    set({
      items: items.map((i) => (i.id === id ? { ...i, productId: p.id, sku: p.sku } : i)),
      dirty: true,
    })
  },

  removeItem: (id) => {
    get().pushHistory()
    set((s) => ({ items: s.items.filter((i) => i.id !== id), selectedId: s.selectedId === id ? null : s.selectedId, dirty: true }))
  },

  duplicateItem: (id) => {
    const { items } = get()
    const src = items.find((i) => i.id === id)
    if (!src) return
    get().pushHistory()
    const copy: PlacedItem = { ...src, id: uid(), x: src.x + 0.5, y: src.y + 0.5 }
    set({ items: [...items, copy], selectedId: copy.id, dirty: true })
  },

  clearAll: () => {
    get().pushHistory()
    set({ items: [], selectedId: null, dirty: true })
  },

  setView: (view) => set({ view }),
  setZoom: (zoom) => set({ zoom: Math.min(4, Math.max(0.25, zoom)) }),
  setPan: (pan) => set({ pan }),
  zoomBy: (factor, cx, cy) => {
    const { zoom, pan } = get()
    const nz = Math.min(4, Math.max(0.25, zoom * factor))
    if (cx !== undefined && cy !== undefined) {
      const k = PPM
      const wx = (cx - pan.x) / (k * zoom)
      const wy = (cy - pan.y) / (k * zoom)
      set({ zoom: nz, pan: { x: cx - wx * k * nz, y: cy - wy * k * nz } })
    } else {
      set({ zoom: nz })
    }
  },
  setLiveSnap: (liveSnap) => set({ liveSnap }),
  markSaved: (shareId) => set({ shareId, dirty: false }),

  geoOf: (item) => itemGeoOf(item, get().products) as PartGeo,

  productOf: (item) => get().products.find((p) => p.id === item.productId) ?? get().products.find((p) => p.sku === item.sku),
}))
