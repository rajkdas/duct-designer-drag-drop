'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Landing } from '@/components/landing/Landing'
import { BuilderApp } from '@/components/builder/BuilderApp'
import { ShareView } from '@/components/share/ShareView'
import { AdminApp } from '@/components/admin/AdminApp'
import { DocsView } from '@/components/docs/DocsView'

// ---------------------------------------------------------------------------
// Single-route shell: the app runs on / and switches views via query params so
// it works behind any host (your site, dealer sites, sandboxes):
//   /                    landing page
//   /?app=builder        the planner
//   /?design=<shareId>   shared read-only design
//   /?embed=1&dealer=s   chrome-less white-label planner
//   /?admin=1            admin panel
//   /?docs=1             documentation
// ---------------------------------------------------------------------------

function Shell() {
  const params = useSearchParams()
  const design = params.get('design')
  const app = params.get('app')
  const admin = params.get('admin')
  const docs = params.get('docs')
  const embed = params.get('embed') === '1'
  const dealer = params.get('dealer')

  if (admin === '1') return <AdminApp />
  if (docs === '1') return <DocsView />
  if (design && app !== 'builder' && embed !== true) return <ShareView shareId={design} />
  if (app === 'builder' || embed || design) return <BuilderApp embed={embed} dealerSlug={dealer} loadShareId={design} />
  return <Landing />
}

export function AppShell() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-slate-50 text-sm text-slate-400">Loading…</div>
      }
    >
      <Shell />
    </Suspense>
  )
}
