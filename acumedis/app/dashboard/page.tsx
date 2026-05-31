import Topbar from '@/components/layout/Topbar'
import { getDashboardStats } from '@/lib/supabase/queries'

export default async function DashboardPage() {
  const stats = await getDashboardStats().catch(() => null)

  const cards = [
    { label: 'Total Pasien', value: stats?.totalPatients ?? '—', desc: 'Terdaftar' },
    { label: 'Sesi Bulan Ini', value: stats?.totalSessions ?? '—', desc: 'Total sesi' },
    { label: 'Sesi Hari Ini', value: stats?.todaySessions ?? '—', desc: 'Hari ini' },
    { label: 'Pasien Baru', value: stats?.newPatients ?? '—', desc: 'Bulan ini' },
  ]

  return (
    <>
      <Topbar
        title="Dashboard"
        subtitle="Selamat datang di AcuMedis"
      />

      <div className="p-6 flex-1 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-500 mb-2">{stat.label}</p>
              <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-1">{stat.desc}</p>
            </div>
          ))}
        </div>

        {(!stats || stats.totalPatients === 0) && (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
            <div className="w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">Mulai dengan menambah pasien</h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              Data aktivitas klinik akan muncul di sini setelah Anda mulai mencatat pasien dan sesi.
            </p>
          </div>
        )}
      </div>
    </>
  )
}
