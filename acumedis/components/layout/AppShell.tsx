'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import { useT } from '@/contexts/LanguageContext'
import { createClient } from '@/lib/supabase/client'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const pathname = usePathname()
  const { setCurrency } = useT()

  // Load currency dari Supabase saat login
  useEffect(() => {
    createClient().auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await createClient().from('practitioners').select('currency').eq('id', user.id).single()
      if (data?.currency) setCurrency(data.currency)
    })
  }, [])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => { setOpen(false) }, [pathname])

  // Di mobile: sidebar tersembunyi (-220px) saat closed, 0 saat open
  // Di desktop: sidebar selalu tampil (0)
  const sidebarTranslate = !isMobile ? 0 : open ? 0 : -220

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* ── Mobile topbar ── */}
      {isMobile && (
        <header
          className="sticky top-0 z-30 flex items-center justify-between px-4"
          style={{ height: 52, background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
        >
          <button
            onClick={() => setOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: 'var(--ink)', borderRadius: 8 }}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <span style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 18, color: 'var(--ink)' }}>Z Medics</span>
          <div style={{ width: 36 }} />
        </header>
      )}

      {/* ── Backdrop ── */}
      {isMobile && open && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          zIndex: 50,
          transform: `translateX(${sidebarTranslate}px)`,
          transition: 'transform 0.22s ease',
        }}
      >
        <Sidebar />
      </div>

      {/* ── Main content ── */}
      <main
        style={{
          marginLeft: isMobile ? 0 : 220,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        {children}
      </main>

    </div>
  )
}
