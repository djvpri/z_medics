'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

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
      { href: '/laporan', label: 'Laporan', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.5}><path d="M2 12L6 4l4 5 2-3 2 6"/></svg> },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="fixed top-0 left-0 h-screen w-[220px] flex flex-col overflow-hidden z-50"
      style={{ background: 'var(--ink)' }}
    >
      {/* Logo */}
      <div className="px-5 py-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 22, color: '#F5F0E8', letterSpacing: -0.5, lineHeight: 1 }}>
          Z Medics
        </div>
        <div style={{ fontSize: 10, color: 'rgba(245,240,232,0.4)', letterSpacing: 2, textTransform: 'uppercase', marginTop: 3 }}>
          Rekam Medis Akupuntur
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-0.5">
        {nav.map(group => (
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
                  key={item.label}
                  href={item.disabled ? '#' : item.href}
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
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <UserFooter />
      </div>
    </aside>
  )
}

function UserFooter() {
  const [user, setUser] = useState<{ name: string; email: string; initials: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    import('@/lib/supabase/client').then(({ createClient }) => {
      const supabase = createClient()
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          const name = user.user_metadata?.name ?? user.email?.split('@')[0] ?? 'Dokter'
          const initials = name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
          setUser({ name, email: user.email ?? '', initials })
        }
      })
    })
  }, [])

  async function logout() {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg group" style={{ transition: 'background 0.15s' }}>
      <div className="flex items-center justify-center rounded-full flex-shrink-0" style={{ width: 30, height: 30, background: 'var(--accent)', fontSize: 12, fontWeight: 500, color: '#F5F0E8' }}>
        {user?.initials ?? 'DR'}
      </div>
      <div className="flex-1 min-w-0">
        <div style={{ fontSize: 12, color: 'rgba(245,240,232,0.85)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {user?.name ?? 'Dr. Rahma Susanti'}
        </div>
        <div style={{ fontSize: 10, color: 'rgba(245,240,232,0.35)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {user?.email ?? 'Akupunturis'}
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
