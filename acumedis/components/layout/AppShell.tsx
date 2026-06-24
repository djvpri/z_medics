'use client'
import { useSession } from 'next-auth/react'
import { useEffect, useState, createContext, useContext } from 'react'

interface AppContextType { currency: string }
const AppContext = createContext<AppContextType>({ currency: 'IDR' })
export const useApp = () => useContext(AppContext)

export function AppShell({ children }: { children: React.ReactNode }) {
  const sessionResult = useSession()
  const [currency, setCurrency] = useState('IDR')

  const session = sessionResult?.data
  const status = sessionResult?.status

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

  return (
    <AppContext.Provider value={{ currency }}>
      {children}
    </AppContext.Provider>
  )
}

export default AppShell
