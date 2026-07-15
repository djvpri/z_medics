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
      <div className="flex h-screen overflow-hidden">
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
                <span>
                  <strong>Akun Demo</strong> — data ini akan direset secara berkala.
                  Login: <strong>demo@zomet.my.id</strong> / <strong>demo1234</strong>
                </span>
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
                {resetting ? 'Mereset...' : 'Reset Data'}
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
