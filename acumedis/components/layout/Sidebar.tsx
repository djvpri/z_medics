'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useT } from '@/contexts/LanguageContext'
import { useSession, signOut } from 'next-auth/react'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  exact?: boolean
  activePrefix?: string
  disabled?: boolean
}

const nav: { section: string; items: NavItem[] }[] = [
  {
    section: 'Utama',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.5}><rect x="1" y="1" width="6" height="6" rx="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5"/><rect x="1" y="9" width="6" height="6" rx="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5"/></svg> },
      { href: '/pasien', label: 'Daftar Pasien', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.5}><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg> },
      { href: '/sesi/baru', label: 'Sesi Baru', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.5}><circle cx="8" cy="8" r="6"/><path d="M8 4v4l3 2"/></svg> },
    ],
  },
  {
    section: 'Fitur AI',
    items: [
      { href: '/ai', label: 'AI Assistant', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.5}><path d="M8 2a6 6 0 100 12A6 6 0 008 2z"/><path d="M6 6.5c0-1.1.9-2 2-2s2 .9 2 2c0 .8-.5 1.5-1.2 1.8L8 11"/><circle cx="8" cy="13" r=".5" fill="currentColor"/></svg> },
    ],
  },
  {
    section: 'Klinik',
    items: [
      { href: '/jadwal', label: 'Jadwal', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.5}><rect x="1" y="2" width="14" height="12" rx="2"/><path d="M1 6h14M5 2v4M11 2v4"/></svg> },
      { href: '/jadwal/permintaan', label: 'Permintaan', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.5}><path d="M2 2h12a1 1 0 011 1v7a1 1 0 01-1 1H9l-3 3v-3H2a1 1 0 01-1-1V3a1 1 0 011-1z"/></svg> },
      { href: '/laporan', label: 'Laporan', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.5}><path d="M2 12L6 4l4 5 2-3 2 6"/></svg> },
      { href: '/pengeluaran', label: 'Pengeluaran', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.5}><path d="M2 8h12M8 2v12" strokeLinecap="round"/><circle cx="8" cy="8" r="6"/></svg> },
      { href: '/stok', label: 'Stok', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.5}><path d="M2 4h12v9a1 1 0 01-1 1H3a1 1 0 01-1-1V4z"/><path d="M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1"/><path d="M6 8h4"/></svg> },
      { href: '/pengaturan', label: 'Settings', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.5}><circle cx="8" cy="8" r="2.5"/><path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.1 3.1l1.1 1.1M11.8 11.8l1.1 1.1M3.1 12.9l1.1-1.1M11.8 4.2l1.1-1.1"/></svg> },
    ],
  },
]

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const { t, lang, setLang } = useT()
  const [pendingCount, setPendingCount] = useState(0)
  const [lowStockCount, setLowStockCount] = useState(0)
  const { data: session } = useSession()

  useEffect(() => {
    if (!session?.user?.id) return

    // Ambil pending requests
    fetch('/api/appointments/pending-count')
      .then(r => r.json()).then(d => setPendingCount(d.count ?? 0)).catch(() => {})

    // Ambil low stock
    fetch('/api/stock/low-count')
      .then(r => r.json()).then(d => setLowStockCount(d.count ?? 0)).catch(() => {})
  }, [session])

  useEffect(() => {
    if (pathname === '/jadwal/permintaan') setPendingCount(0)
    if (pathname === '/stok') setLowStockCount(0)
  }, [pathname])

  const navGroups = [
    {
      section: lang === 'id' ? 'Utama' : 'Main',
      items: [
        { ...nav[0].items[0], label: t.nav.dashboard },
        { ...nav[0].items[1], label: t.nav.patients },
        { ...nav[0].items[2], label: t.nav.newSession },
      ],
    },
    {
      section: lang === 'id' ? 'Fitur AI' : 'AI Features',
      items: [{ ...nav[1].items[0], label: t.nav.aiAssistant }],
    },
    {
      section: lang === 'id' ? 'Klinik' : 'Clinic',
      items: [
        { ...nav[2].items[0], label: t.nav.schedule },
        { ...nav[2].items[1], label: lang === 'id' ? 'Permintaan' : 'Requests' },
        { ...nav[2].items[2], label: t.nav.reports },
        { ...nav[2].items[3], label: 'Pengeluaran' },
        { ...nav[2].items[4], label: lang === 'id' ? 'Stok' : 'Stock' },
        { ...nav[2].items[5], label: lang === 'id' ? 'Pengaturan' : 'Settings' },
      ],
    },
  ]

  return (
    <aside
      className="h-screen w-[220px] flex flex-col overflow-hidden"
      style={{ background: 'var(--ink)' }}
    >
      {/* Logo */}
      <div className="px-5 py-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 22, color: '#F5F0E8', letterSpacing: -0.5, lineHeight: 1 }}>
          Z Medics
        </div>
        <div style={{ fontSize: 10, color: 'rgba(245,240,232,0.4)', letterSpacing: 2, textTransform: 'uppercase', marginTop: 3 }}>
          {lang === 'id' ? 'Rekam Medis Akupuntur' : 'Acupuncture Medical Record'}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-0.5">
        {navGroups.map(group => (
          <div key={group.section}>
            <div style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(245,240,232,0.3)', padding: '12px 8px 6px' }}>
              {group.section}
            </div>
            {group.items.map(item => {
              const active = item.exact
                ? pathname === item.href
                : item.activePrefix
                  ? pathname.startsWith(item.activePrefix)
                  : pathname === item.href || (item.href !== '/sesi/baru' && pathname.startsWith(item.href + '/'))
              return (
                <Link
                  key={item.href}
                  href={item.disabled ? '#' : item.href}
                  onClick={onClose}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all"
                  style={{
                    fontSize: 13.5,
                    fontWeight: active ? 500 : 400,
                    color: active ? '#F5F0E8' : item.disabled ? 'rgba(245,240,232,0.25)' : 'rgba(245,240,232,0.55)',
                    background: active ? 'var(--accent)' : 'transparent',
                    pointerEvents: item.disabled ? 'none' : 'auto',
                  }}
                  onMouseEnter={e => { if (!active && !item.disabled) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)' }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  <span style={{ opacity: active ? 1 : item.disabled ? 0.3 : 0.7, flexShrink: 0 }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.href === '/jadwal/permintaan' && pendingCount > 0 && (
                    <span style={{ minWidth: 18, height: 18, borderRadius: 9, background: '#E05252', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', flexShrink: 0 }}>
                      {pendingCount > 9 ? '9+' : pendingCount}
                    </span>
                  )}
                  {item.href === '/stok' && lowStockCount > 0 && (
                    <span style={{ minWidth: 18, height: 18, borderRadius: 9, background: '#D97706', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', flexShrink: 0 }}>
                      {lowStockCount > 9 ? '9+' : lowStockCount}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Language switcher */}
      <div className="px-4 py-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)' }}>
          {(['en', 'id'] as const).map(l => (
            <button key={l} onClick={() => setLang(l)}
              style={{
                flex: 1, padding: '4px 0', borderRadius: 6, fontSize: 11, fontWeight: 600,
                border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                background: lang === l ? 'var(--accent)' : 'transparent',
                color: lang === l ? '#F5F0E8' : 'rgba(245,240,232,0.4)',
                fontFamily: 'var(--font-dm-sans)',
              }}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* User + Logout */}
      <div className="px-3 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <UserFooter />
      </div>
    </aside>
  )
}

function UserFooter() {
  const { data: session } = useSession()
  const [userData, setUserData] = useState<{ name: string; email: string; initials: string; avatarUrl?: string | null } | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (!session?.user) return
    fetch('/api/me').then(r => r.json()).then(d => {
      const name = d.name ?? session.user?.name ?? 'Dokter'
      const initials = name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
      setUserData({
        name,
        email: d.email ?? session.user?.email ?? '',
        initials,
        avatarUrl: d.avatar_url ?? null,
      })
    }).catch(() => {})
  }, [session])

  async function logout() {
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg group" style={{ transition: 'background 0.15s' }}>
      <div className="flex items-center justify-center rounded-full flex-shrink-0 overflow-hidden" style={{ width: 30, height: 30, background: 'var(--accent)', fontSize: 12, fontWeight: 500, color: '#F5F0E8' }}>
        {userData?.avatarUrl
          ? <img src={userData.avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : (userData?.initials ?? 'DR')}
      </div>
      <div className="flex-1 min-w-0">
        <div style={{ fontSize: 12, color: 'rgba(245,240,232,0.85)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {userData?.name ?? 'Dokter'}
        </div>
        <div style={{ fontSize: 10, color: 'rgba(245,240,232,0.35)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {userData?.email ?? ''}
        </div>
      </div>
      <button
        onClick={logout}
        title="Keluar"
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, flexShrink: 0, opacity: 0.4, transition: 'opacity 0.15s' }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '0.9')}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '0.4')}
      >
        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#F5F0E8" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
        </svg>
      </button>
    </div>
  )
}
