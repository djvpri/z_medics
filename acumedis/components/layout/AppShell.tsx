'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Tutup otomatis saat pindah halaman
  useEffect(() => { setOpen(false) }, [pathname])

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* ── Mobile topbar ── */}
      <header
        className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4"
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

        <span style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 18, color: 'var(--ink)' }}>
          Z Medics
        </span>

        <div style={{ width: 36 }} />
      </header>

      {/* ── Backdrop mobile ── */}
      <div
        onClick={() => setOpen(false)}
        className={`md:hidden fixed inset-0 z-40 transition-opacity duration-200 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={{ background: 'rgba(0,0,0,0.55)' }}
      />

      {/* ── Sidebar ──
           Mobile: slide in/out dari kiri
           Desktop (md+): selalu tampil, tidak bergerak  */}
      <div className={`fixed top-0 left-0 h-screen z-50 transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0`}
      >
        <Sidebar />
      </div>

      {/* ── Main content ── */}
      <main className="flex flex-col min-h-screen md:ml-[220px]">
        {children}
      </main>

    </div>
  )
}
