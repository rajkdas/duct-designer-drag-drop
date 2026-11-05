'use client'

import { useCallback, useEffect, useState } from 'react'
import { DealersPanel } from './DealersPanel'
import { ProductsPanel } from './ProductsPanel'
import { QuotesPanel } from './QuotesPanel'
import { SettingsPanel } from './SettingsPanel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Fan, Loader2, LockKeyhole, LayoutDashboard, Store, Package, MessageSquareText, Settings2, BookOpen, ArrowLeft } from 'lucide-react'
import type { SettingsDTO } from '@/lib/types'
import { formatMoney } from '@/lib/types'

// ---------------------------------------------------------------------------
// Lightweight admin panel: dealers & licences, products & prices, quote
// requests and shop settings. Opens via /?admin=1 (password in .env
// ADMIN_PASSWORD, default "admin123" for the demo).
// ---------------------------------------------------------------------------

type Tab = 'dashboard' | 'dealers' | 'products' | 'quotes' | 'settings'

export function AdminApp() {
  const [auth, setAuth] = useState<'checking' | 'login' | 'ok'>('checking')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [tab, setTab] = useState<Tab>('dashboard')
  const [settings, setSettings] = useState<SettingsDTO | null>(null)

  const refreshSettings = useCallback(async () => {
    const r = await fetch('/api/settings')
    if (r.ok) setSettings(await r.json())
  }, [])

  useEffect(() => {
    ;(async () => {
      const r = await fetch('/api/admin/session')
      const d = await r.json()
      setAuth(d.admin ? 'ok' : 'login')
      if (d.admin) refreshSettings()
    })()
  }, [refreshSettings])

  const login = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      const r = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!r.ok) throw new Error('Wrong password')
      setAuth('ok')
      refreshSettings()
      toast.success('Welcome back')
    } catch {
      toast.error('Wrong password')
    } finally {
      setBusy(false)
    }
  }

  const logout = async () => {
    await fetch('/api/admin/session', { method: 'DELETE' })
    setAuth('login')
  }

  if (auth === 'checking') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    )
  }

  if (auth === 'login') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 p-6">
        <form onSubmit={login} className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-white">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <h1 className="mt-4 text-center text-lg font-bold text-slate-800">Admin sign-in</h1>
          <p className="mt-1 text-center text-xs text-slate-400">DuctDesigner control panel — owners only</p>
          <div className="mt-5 space-y-1.5">
            <Label htmlFor="pw">Password</Label>
            <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoFocus />
          </div>
          <Button type="submit" disabled={busy} className="mt-4 w-full">
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Sign in
          </Button>
          <p className="mt-3 text-center text-[11px] text-slate-400">
            Demo password: <code className="rounded bg-slate-100 px-1">admin123</code> — change via ADMIN_PASSWORD in .env
          </p>
        </form>
        <a href="/" className="mt-4 text-xs text-slate-400 hover:text-slate-600">
          ← Back to the configurator
        </a>
      </div>
    )
  }

  const tabs: { key: Tab; label: string; icon: typeof Fan }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'dealers', label: 'Dealers & licences', icon: Store },
    { key: 'products', label: 'Products & prices', icon: Package },
    { key: 'quotes', label: 'Quote requests', icon: MessageSquareText },
    { key: 'settings', label: 'Shop settings', icon: Settings2 },
  ]

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-white">
              <Fan className="h-4.5 w-4.5" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold text-slate-800">DuctDesigner Admin</p>
              <p className="text-[10px] text-slate-400">{settings?.shopName ?? '…'}</p>
            </div>
          </div>
          <nav className="order-last flex w-full gap-1 overflow-x-auto pb-1 sm:order-none sm:w-auto sm:pb-0" aria-label="Admin sections">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${tab === t.key ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                <t.icon className="h-3.5 w-3.5" /> {t.label}
              </button>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1.5">
            <a href="/?docs=1" target="_blank">
              <Button variant="outline" size="sm">
                <BookOpen className="mr-1.5 h-3.5 w-3.5" /> Docs
              </Button>
            </a>
            <a href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Site
              </Button>
            </a>
            <Button variant="outline" size="sm" onClick={logout}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 p-4">
        {tab === 'dashboard' && <Dashboard onNavigate={(t) => setTab(t)} />}
        {tab === 'dealers' && <DealersPanel />}
        {tab === 'products' && <ProductsPanel />}
        {tab === 'quotes' && <QuotesPanel />}
        {tab === 'settings' && <SettingsPanel onSaved={refreshSettings} />}
      </main>

      <footer className="mt-auto border-t border-slate-200 bg-white px-4 py-2 text-center text-[11px] text-slate-400">
        BIMA DuctDesigner · white-label duct configurator platform
      </footer>
    </div>
  )
}

interface Stats {
  designs: number
  quotes: number
  newQuotes: number
  dealers: number
  activeDealers: number
  mrr: number
  recentDesigns: { id: string; shareId: string; name: string; customer: string | null; dealerName: string | null; totalGross: number; itemCount: number; updatedAt: string }[]
  recentQuotes: { id: string; name: string; company: string | null; email: string; totalGross: number; status: string; dealerName: string | null; createdAt: string }[]
}

function Dashboard({ onNavigate }: { onNavigate: (t: Tab) => void }) {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => (r.ok ? r.json() : null))
      .then(setStats)
  }, [])

  if (!stats) return <Loader2 className="mx-auto mt-10 h-6 w-6 animate-spin text-slate-400" />

  const cards = [
    { label: 'Saved designs', value: String(stats.designs), hint: 'all-time', onClick: undefined },
    { label: 'Open quote requests', value: String(stats.newQuotes), hint: `${stats.quotes} total`, onClick: () => onNavigate('quotes') },
    { label: 'Active dealers', value: String(stats.activeDealers), hint: `${stats.dealers} licences total`, onClick: () => onNavigate('dealers') },
    { label: 'Licence revenue', value: formatMoney(stats.mrr), hint: 'per month (MRR)', onClick: () => onNavigate('dealers') },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <button
            key={c.label}
            onClick={c.onClick}
            className={`rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm ${c.onClick ? 'transition hover:border-slate-400' : 'cursor-default'}`}
          >
            <p className="text-xs font-medium text-slate-500">{c.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">{c.value}</p>
            <p className="text-[11px] text-slate-400">{c.hint}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">Recent designs</h2>
          <ul className="divide-y divide-slate-50">
            {stats.recentDesigns.map((d) => (
              <li key={d.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <div className="min-w-0 flex-1">
                  <a href={`/?design=${d.shareId}`} target="_blank" className="block truncate font-medium text-slate-700 hover:text-[var(--brand)]">
                    {d.name}
                  </a>
                  <p className="text-[11px] text-slate-400">
                    {d.itemCount} parts · {d.customer ?? 'no customer'} {d.dealerName ? `· via ${d.dealerName}` : ''}
                  </p>
                </div>
                <span className="text-sm font-semibold text-slate-700">{formatMoney(d.totalGross)}</span>
              </li>
            ))}
            {stats.recentDesigns.length === 0 && <li className="px-4 py-6 text-center text-sm text-slate-400">No designs yet.</li>}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">Latest quote requests</h2>
          <ul className="divide-y divide-slate-50">
            {stats.recentQuotes.map((q) => (
              <li key={q.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-700">
                    {q.name} {q.company ? <span className="text-slate-400">· {q.company}</span> : null}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {q.email} {q.dealerName ? `· via ${q.dealerName}` : ''}
                  </p>
                </div>
                <StatusBadge status={q.status} />
                <span className="text-sm font-semibold text-slate-700">{formatMoney(q.totalGross)}</span>
              </li>
            ))}
            {stats.recentQuotes.length === 0 && <li className="px-4 py-6 text-center text-sm text-slate-400">No quote requests yet.</li>}
          </ul>
        </section>
      </div>
    </div>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    NEW: 'bg-amber-50 text-amber-700 ring-amber-200',
    IN_PROGRESS: 'bg-sky-50 text-sky-700 ring-sky-200',
    QUOTED: 'bg-green-50 text-green-700 ring-green-200',
    CLOSED: 'bg-slate-100 text-slate-500 ring-slate-200',
    ACTIVE: 'bg-green-50 text-green-700 ring-green-200',
    TRIAL: 'bg-amber-50 text-amber-700 ring-amber-200',
    SUSPENDED: 'bg-red-50 text-red-600 ring-red-200',
  }
  const labels: Record<string, string> = { NEW: 'New', IN_PROGRESS: 'In progress', QUOTED: 'Quoted', CLOSED: 'Closed', ACTIVE: 'Active', TRIAL: 'Trial', SUSPENDED: 'Suspended' }
  return <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${map[status] ?? map.CLOSED}`}>{labels[status] ?? status}</span>
}
