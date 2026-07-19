'use client'
import { useSession } from 'next-auth/react'
import { useEffect, useState, createContext, useContext, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from './Sidebar'

interface AppContextType { currency: string }
const AppContext = createContext<AppContextType>({ currency: 'IDR' })
export const useApp = () => useContext(AppContext)

export function AppShell({ children }: { children: React.ReactNode }) {
  const sessionResult = useSession()
  const [currency, setCurrency] = useState('IDR')
  const [resetting, startTransition] = useTransition()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const router = useRouter()

  const session = sessionResult?.data
  const status = sessionResult?.status
  const isDemo = !!(session?.user as any)?.isDemo

  useEffect(() => {
    if (session?.user?.id) {
      fetch('/api/me').then(r => r.json()).then(d => {
        if (d.currency) setCurrency(d.currency)
      }).catch(() => {})
    }
  }, [session])

  if (!status || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) return null

  async function handleReset() {
    startTransition(async () => {
      await fetch('/api/demo/reset', { method: 'POST' })
      router.refresh()
    })
  }

  return (
    <AppContext.Provider value={{ currency }}>
      {/* Mobile top bar */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4"
        style={{ height: 52, background: 'var(--ink)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <button
          onClick={() => setDrawerOpen(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 8px', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          aria-label="Menu"
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#F5F0E8" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 18, color: '#F5F0E8', letterSpacing: -0.5 }}>
          Z Medics
        </div>
        <div style={{ width: 36 }} />
      </div>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative z-50 flex-shrink-0">
            <Sidebar onClose={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex h-screen overflow-hidden pt-[52px] md:pt-0">
        {/* Sidebar — desktop only */}
        <div className="hidden md:flex flex-shrink-0">
          <Sidebar />
        </div>

        {/* Main area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Demo banner */}
          {isDemo && (
            <div style={{
              background: 'linear-gradient(90deg, #0f766e, #0d9488)',
              color: '#fff',
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              fontSize: 13,
              flexShrink: 0,
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 8v4m0 4h.01"/>
                </svg>
                <span className="hidden sm:inline">
                  <strong>Akun Demo</strong> — data ini akan direset secara berkala.
                  Login: <strong>demo@zomet.my.id</strong> / <strong>demo1234</strong>
                </span>
                <span className="sm:hidden"><strong>Akun Demo</strong></span>
              </span>
              <button
                onClick={handleReset}
                disabled={resetting}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
                  color: '#fff', borderRadius: 6, padding: '4px 10px',
                  fontSize: 12, fontWeight: 500, cursor: resetting ? 'not-allowed' : 'pointer',
                  opacity: resetting ? 0.6 : 1, whiteSpace: 'nowrap', flexShrink: 0,
                }}
              >
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  style={{ animation: resetting ? 'spin 1s linear infinite' : 'none' }}>
                  <path strokeLinecap="round" d="M4 4v5h5M20 20v-5h-5M4 9a8 8 0 0112.9-5.3M20 15a8 8 0 01-12.9 5.3"/>
                </svg>
                {resetting ? 'Mereset...' : 'Reset'}
              </button>
            </div>
          )}

          {children}
        </div>
      </div>
    </AppContext.Provider>
  )
}

export default AppShell
