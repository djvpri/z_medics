import Link from 'next/link'
import Topbar from '@/components/layout/Topbar'
import AIPanel from '@/components/dashboard/AIPanel'
import { getDashboardStats, getWeekAppointments } from '@/lib/supabase/queries'

const AVATAR_COLORS = [
  { bg: '#E8F2EC', text: '#2D5A3D' },
  { bg: '#F5EDD4', text: '#B8860B' },
  { bg: '#F5E8E8', text: '#8B2020' },
  { bg: '#EDE8DF', text: '#5C5449' },
  { bg: '#E8EDF5', text: '#2D3A5A' },
]

function getInitials(name: string) {
  return name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
}

function getStatus(scheduledAt: string, apptStatus: string): 'selesai' | 'segera' | 'akan' {
  if (apptStatus === 'completed') return 'selesai'
  const now = new Date()
  const dt = new Date(scheduledAt)
  const diff = dt.getTime() - now.getTime()
  if (diff < -30 * 60 * 1000) return 'selesai'
  if (diff < 60 * 60 * 1000) return 'segera'
  return 'akan'
}

const STATUS_BADGE = {
  selesai: { label: 'Selesai', bg: 'var(--accent-light)', color: 'var(--accent)' },
  segera: { label: 'Segera', bg: 'var(--gold-light)', color: 'var(--gold)' },
  akan: { label: 'Akan datang', bg: 'var(--bg2)', color: 'var(--ink2)' },
}

export default async function DashboardPage() {
  const [stats, weekAppts] = await Promise.all([
    getDashboardStats().catch(() => null),
    getWeekAppointments().catch(() => []),
  ])

  // Kelompokkan per hari
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const groupedByDay = weekAppts.reduce((acc: Record<string, any[]>, appt: any) => {
    const d = new Date(appt.scheduled_at)
    d.setHours(0, 0, 0, 0)
    const key = d.toISOString()
    if (!acc[key]) acc[key] = []
    acc[key].push(appt)
    return acc
  }, {})

  const todayAppts = weekAppts.filter((a: any) => {
    const d = new Date(a.scheduled_at)
    d.setHours(0, 0, 0, 0)
    return d.getTime() === today.getTime()
  })

  const todayLabel = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const cards = [
    { label: 'Pasien Aktif', value: stats?.totalPatients ?? '—', trend: 'Terdaftar', up: true },
    { label: 'Jadwal Hari Ini', value: todayAppts.length > 0 ? todayAppts.length : (stats?.todaySessions ?? '—'), sub: todayAppts.length > 0 ? `${todayAppts.filter((a: any) => getStatus(a.scheduled_at, a.status) === 'selesai').length} selesai · ${todayAppts.filter((a: any) => getStatus(a.scheduled_at, a.status) !== 'selesai').length} tersisa` : 'Hari ini' },
    { label: 'Saran AI Diterima', value: '91%', trend: 'akurasi tinggi', up: true },
    { label: 'Total Sesi', value: stats?.totalSessions ?? '—', trend: 'Semua waktu', up: true, small: true },
  ]

  return (
    <>
      <Topbar
        title="Dashboard"
        actions={
          <div className="flex items-center gap-3">
            <span style={{ fontSize: 13, color: 'var(--ink3)' }}>{todayLabel}</span>
            <Link href="/jadwal/baru" style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, background: 'var(--accent)', color: '#F5F0E8', textDecoration: 'none', fontFamily: 'var(--font-dm-sans)' }}>
              + Sesi Baru
            </Link>
          </div>
        }
      />

      <div className="p-7 page-enter">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {cards.map(c => (
            <div key={c.label} className="rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{c.label}</div>
              <div style={{ fontFamily: 'var(--font-dm-serif)', fontSize: c.small ? 22 : 28, color: 'var(--ink)', lineHeight: 1 }}>{c.value}</div>
              {c.trend && (
                <div className="inline-block mt-1.5 px-2 py-0.5 rounded-full" style={{ fontSize: 11, background: c.up ? 'var(--accent-light)' : 'var(--red-light)', color: c.up ? 'var(--accent)' : 'var(--red)' }}>
                  {c.trend}
                </div>
              )}
              {c.sub && <div style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 4 }}>{c.sub}</div>}
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 320px' }}>
          {/* Jadwal 7 Hari ke Depan */}
          <div className="rounded-[18px] overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border2)' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 16, color: 'var(--ink)' }}>Jadwal 7 Hari ke Depan</h2>
                {weekAppts.length > 0 && (
                  <p style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 2 }}>{weekAppts.length} jadwal terjadwal</p>
                )}
              </div>
              <Link href="/jadwal" style={{ padding: '5px 12px', borderRadius: 8, fontSize: 12, background: 'transparent', border: '1px solid var(--border)', color: 'var(--ink2)', textDecoration: 'none', fontFamily: 'var(--font-dm-sans)' }}>
                Lihat semua
              </Link>
            </div>

            <div className="px-5 py-2" style={{ maxHeight: 340, overflowY: 'auto' }}>
              {weekAppts.length === 0 ? (
                <div className="py-10 text-center">
                  <p style={{ fontSize: 13, color: 'var(--ink3)' }}>Tidak ada jadwal 7 hari ke depan.</p>
                  <Link href="/jadwal/baru" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none', display: 'inline-block', marginTop: 6 }}>
                    + Buat jadwal
                  </Link>
                </div>
              ) : (
                Object.entries(groupedByDay).map(([dayKey, appts]) => {
                  const dayDate = new Date(dayKey)
                  const isToday = dayDate.getTime() === today.getTime()
                  const isTomorrow = dayDate.getTime() === today.getTime() + 86400000
                  const dayLabel = isToday ? 'Hari Ini' : isTomorrow ? 'Besok'
                    : dayDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })

                  return (
                    <div key={dayKey}>
                      {/* Header hari */}
                      <div className="flex items-center gap-2 py-2 sticky top-0" style={{ background: 'var(--surface)' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: isToday ? 'var(--accent)' : 'var(--ink2)', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                          {dayLabel}
                        </span>
                        <div style={{ flex: 1, height: 1, background: 'var(--border2)' }} />
                        <span style={{ fontSize: 11, color: 'var(--ink3)' }}>{(appts as any[]).length} sesi</span>
                      </div>

                      {/* List jadwal */}
                      {(appts as any[]).map((appt: any, i: number) => {
                        const status = getStatus(appt.scheduled_at, appt.status)
                        const badge = STATUS_BADGE[status]
                        const name = appt.patient?.name ?? 'Pasien'
                        const col = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
                        const time = new Date(appt.scheduled_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

                        return (
                          <div
                            key={appt.id}
                            className="flex items-center gap-3 py-2.5"
                            style={{ borderBottom: i < (appts as any[]).length - 1 ? '1px solid var(--border2)' : 'none', marginBottom: i === (appts as any[]).length - 1 ? 8 : 0 }}
                          >
                            <div className="flex items-center justify-center rounded-full flex-shrink-0" style={{ width: 34, height: 34, background: col.bg, color: col.text, fontSize: 12, fontWeight: 500 }}>
                              {getInitials(name)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{name}</div>
                              <div style={{ fontSize: 11.5, color: 'var(--ink3)', marginTop: 1 }}>
                                {time} · {appt.reason ?? 'Sesi akupuntur'} · {appt.duration_minutes} mnt
                              </div>
                            </div>
                            <span className="rounded-full px-2 py-0.5 whitespace-nowrap" style={{ background: badge.bg, color: badge.color, fontSize: 10 }}>
                              {badge.label}
                            </span>
                            {status !== 'selesai' && appt.status === 'scheduled' ? (
                              <Link
                                href={`/sesi/baru?pasien=${appt.patient?.id ?? ''}&alasan=${encodeURIComponent(appt.reason ?? '')}&jadwal=${appt.id}`}
                                style={{ padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 500, background: 'var(--accent)', color: '#F5F0E8', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}
                              >
                                Mulai
                              </Link>
                            ) : appt.session_id ? (
                              <Link
                                href={`/sesi/${appt.session_id}`}
                                style={{ padding: '3px 9px', borderRadius: 6, fontSize: 11, border: '1px solid var(--border)', color: 'var(--ink3)', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}
                              >
                                Lihat
                              </Link>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* AI Panel */}
          <AIPanel />
        </div>
      </div>
    </>
  )
}
