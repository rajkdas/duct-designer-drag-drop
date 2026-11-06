'use client'

import { useEffect, useRef } from 'react'
import { useBuilder } from '@/lib/store'
import { footprint, machineDef, rotPoint } from '@/lib/geo'
import { centerlineSamples } from './PartShape'
import { Box } from 'lucide-react'
import type { WebGLRenderer, Scene, PerspectiveCamera, Group, MeshStandardMaterial } from 'three'

// ---------------------------------------------------------------------------
// Realistic 3D view (Three.js, lazy-loaded client-only). The scene graph is
// rebuilt from the store whenever items/room change, so it stays in sync
// with the 2D canvas in place (add / remove / move / rotate / height).
// ---------------------------------------------------------------------------

type Api = {
  THREE: typeof import('three')
  renderer: WebGLRenderer
  scene: Scene
  camera: PerspectiveCamera
  controls: { update: () => void; target: { set: (x: number, y: number, z: number) => void }; enableDamping: boolean; dispose: () => void }
  content: Group
  mats: Record<string, MeshStandardMaterial>
  raf: number
  ro: ResizeObserver
}

export function IsoView({ compact = false }: { compact?: boolean }) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const apiRef = useRef<Api | null>(null)
  const items = useBuilder((s) => s.items)
  const room = useBuilder((s) => s.room)

  // --- (re)build scene content from the store — keeps 3D in sync ----------
  const rebuild = () => {
    const a = apiRef.current
    if (!a) return
    const { THREE, content, mats } = a
    content.traverse((o) => {
      const m = o as any
      if (m.geometry) m.geometry.dispose()
    })
    content.clear()

    const st = useBuilder.getState()
    const W = st.room.w
    const D = st.room.h
    const H = 3.2
    const add = (mesh: any) => content.add(mesh)
    const box = (w: number, h: number, d: number, mat: any, x: number, y: number, z: number, ry = 0, shadow = true) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
      m.position.set(x, y, z)
      m.rotation.y = ry
      m.castShadow = shadow
      m.receiveShadow = true
      add(m)
      return m
    }

    // room shell
    box(W, 0.1, D, mats.floor, W / 2, -0.05, D / 2, 0, false)
    box(W, H, 0.1, mats.wall, W / 2, H / 2, -0.05, 0, false)
    box(0.1, H, D, mats.wall, -0.05, H / 2, D / 2, 0, false)
    const wins = Math.max(2, Math.floor(W / 4))
    for (let i = 0; i < wins; i++) {
      box(1.6, 1.4, 0.12, mats.glass, ((i + 0.5) / wins) * W, 1.9, -0.02, 0, false)
    }
    for (let z = 1; z < D; z += 2) box(W, 0.16, 0.1, mats.wood, W / 2, H - 0.08, z, 0, false)

    // items
    for (const it of st.items) {
      const geo = st.geoOf(it)
      const ry = -(it.rot * Math.PI) / 180
      if (geo.category === 'MACHINE') {
        const fp = footprint(geo, it.sku)
        const c = rotPoint(fp.ox + fp.w / 2, fp.oy + fp.h / 2, it.rot)
        box(fp.w, 1.0, fp.h, mats.body, it.x + c.x, 0.5, it.y + c.y, ry)
        box(fp.w * 0.8, 0.12, fp.h * 0.8, mats.dark, it.x + c.x, 1.06, it.y + c.y, ry, false)
        const port = rotPoint(fp.ox + fp.w / 2, fp.oy, it.rot)
        box(0.22, 0.22, 0.22, mats.dark, it.x + port.x, 1.15, it.y + port.y, ry, false)
        continue
      }
      if (geo.category === 'UNIT') {
        const c = rotPoint(0.6, 0.5, it.rot)
        box(1.2, 1.9, 1.0, mats.body, it.x + c.x, 0.95, it.y + c.y, ry)
        const hop = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.2, 0.7, 20), mats.metal)
        hop.position.set(it.x + c.x, 0.35, it.y + c.y)
        hop.castShadow = true
        add(hop)
        const rp = rotPoint(0, 0.5, it.rot)
        const riser = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.0, 16), mats.metal)
        riser.position.set(it.x + rp.x, 2.3, it.y + rp.y)
        add(riser)
        continue
      }
      // ducts: cylinders along the part centreline
      const samples = centerlineSamples(geo)
      const zStart = it.z / 1000
      const zEnd = (it.z2 ?? it.z) / 1000
      const mat = geo.category === 'FLEX' ? mats.tan : mats.metal
      for (const seg of samples) {
        const pts = seg.pts.map((p, i, arr) => {
          const w2 = rotPoint(p.x, p.y, it.rot)
          const t = arr.length === 1 ? 0 : i / (arr.length - 1)
          return new THREE.Vector3(it.x + w2.x, zStart + (zEnd - zStart) * t, it.y + w2.y)
        })
        for (let i = 0; i + 1 < pts.length; i++) {
          const dir = new THREE.Vector3().subVectors(pts[i + 1], pts[i])
          const len = dir.length()
          if (len < 1e-4) continue
          const cyl = new THREE.Mesh(new THREE.CylinderGeometry(seg.width / 2, seg.width / 2, len, 20), mat)
          cyl.position.copy(pts[i]).addScaledVector(dir, 0.5)
          cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())
          cyl.castShadow = true
          add(cyl)
        }
        // flange rings at segment ends
        for (const p of [pts[0], pts[pts.length - 1]]) {
          if (!p) continue
          const ring = new THREE.Mesh(new THREE.TorusGeometry(seg.width / 2 + 0.012, 0.02, 10, 24), mats.metal)
          ring.position.copy(p)
          ring.rotation.x = Math.PI / 2
          add(ring)
        }
        if (geo.category === 'FLEX') {
          for (let i = 0; i + 1 < pts.length; i++) {
            const d2 = new THREE.Vector3().subVectors(pts[i + 1], pts[i])
            const n = Math.floor(d2.length() / 0.25)
            for (let r = 1; r <= n; r++) {
              const ring = new THREE.Mesh(new THREE.TorusGeometry(seg.width / 2 + 0.008, 0.015, 8, 20), mats.tan)
              ring.position.copy(pts[i]).addScaledVector(d2.normalize(), r * 0.25)
              ring.rotation.x = Math.PI / 2
              add(ring)
            }
          }
        }
      }
    }

    // camera framing
    const dist = Math.max(W, D) * 1.15
    a.camera.position.set(W / 2 + dist * 0.75, dist * 0.6, D / 2 + dist * 0.75)
    a.controls.target.set(W / 2, 0.9, D / 2)
  }
  const rebuildRef = useRef(rebuild)
  rebuildRef.current = rebuild

  // --- init once (dynamic import => client-only, code-split chunk) --------
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const THREE = await import('three')
      const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js')
      const { RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js')
      if (cancelled || !hostRef.current) return
      const renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      hostRef.current.appendChild(renderer.domElement)

      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0xe8ebf0)
      const pmrem = new THREE.PMREMGenerator(renderer)
      scene.environment = pmrem.fromScene(new (RoomEnvironment as any)(), 0.04).texture

      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200)
      const controls = new OrbitControls(camera, renderer.domElement) as any
      controls.enableDamping = true

      const sun = new THREE.DirectionalLight(0xffffff, 2.2)
      sun.position.set(8, 12, 6)
      sun.castShadow = true
      sun.shadow.mapSize.set(2048, 2048)
      sun.shadow.camera.left = -20
      sun.shadow.camera.right = 20
      sun.shadow.camera.top = 20
      sun.shadow.camera.bottom = -20
      scene.add(sun)
      scene.add(new THREE.AmbientLight(0xffffff, 0.35))

      const content = new THREE.Group()
      scene.add(content)

      const mats = {
        metal: new THREE.MeshStandardMaterial({ color: 0xb0b0b0, metalness: 1.0, roughness: 0.3 }),
        tan: new THREE.MeshStandardMaterial({ color: 0xc8a060, metalness: 0.1, roughness: 0.7 }),
        body: new THREE.MeshStandardMaterial({ color: 0xd6d3d1, metalness: 0.2, roughness: 0.6 }),
        dark: new THREE.MeshStandardMaterial({ color: 0x57534e, metalness: 0.3, roughness: 0.5 }),
        floor: new THREE.MeshStandardMaterial({ color: 0xa8a29e, metalness: 0.1, roughness: 0.8 }),
        wall: new THREE.MeshStandardMaterial({ color: 0xe7e5e4, metalness: 0.0, roughness: 0.9 }),
        glass: new THREE.MeshStandardMaterial({ color: 0x9ec5e8, metalness: 0.2, roughness: 0.2 }),
        wood: new THREE.MeshStandardMaterial({ color: 0xb98a5a, metalness: 0.0, roughness: 0.8 }),
      }

      const ro = new ResizeObserver(() => {
        const w = hostRef.current?.clientWidth ?? 1
        const h = hostRef.current?.clientHeight ?? 1
        renderer.setSize(w, h)
        camera.aspect = w / h
        camera.updateProjectionMatrix()
      })
    ro.observe(hostRef.current)

      const api: Api = { THREE, renderer, scene, camera, controls, content, mats, raf: 0, ro }
      apiRef.current = api
      const loop = () => {
        api.raf = requestAnimationFrame(loop)
        controls.update()
        renderer.render(scene, camera)
      }
      loop()
      rebuildRef.current()
    })()
    return () => {
      cancelled = true
      const a = apiRef.current
      if (a) {
        cancelAnimationFrame(a.raf)
        a.ro.disconnect()
        a.controls.dispose()
        a.renderer.dispose()
        a.renderer.domElement.remove()
      }
      apiRef.current = null
    }
  }, [])

  // --- live sync: rebuild whenever the layout changes ----------------------
  useEffect(() => {
    rebuildRef.current()
  }, [items, room])

  void compact
  void machineDef

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#e8ebf0]">
      <div ref={hostRef} className="h-full w-full" />
      
      <button
        className="absolute bottom-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50"
        title="Isometrische Vorschau"
        aria-label="Isometrische Vorschau"
      >
        <Box className="h-4 w-4" />
      </button>
    </div>
  )
}

export default IsoView