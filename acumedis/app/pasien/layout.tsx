import Sidebar from '@/components/layout/Sidebar'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      <Sidebar />
      <main className="flex-1 ml-[220px] flex flex-col min-h-screen overflow-hidden">
        {children}
      </main>
    </div>
  )
}
