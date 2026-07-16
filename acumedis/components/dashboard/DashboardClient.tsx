'use client'

import Link from 'next/link'
import Topbar from '@/components/layout/Topbar'
import AIPanel from '@/components/dashboard/AIPanel'
import { useT } from '@/contexts/LanguageContext'

const AVATAR_COLORS = [
  { bg: '#E8F2EC', text: '#2D5A3D' }, { bg: '#F5EDD4', text: '#B8860B' },
  { bg: '#F5E8E8', text: '#8B2020' }, { bg: '#EDE8DF', text: '#5C5449' },
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

import { formatMoneyShort } from '@/lib/formatMoney'

function daysSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
}

function waLink(phone: string) {
  const clean = phone.replace(/\D/g, '')
  // Jika dimulai 0, asumsi perlu country code — strip saja, user harus isi format internasional
  return `https://wa.me/${clean.startsWith('0') ? clean.slice(1) : clean}`
}

interface Props {
  stats: { totalPatients: number; totalSessions: number; todaySessions: number; newPatients: number; monthIncome: number } | null
  weekAppts: any[]
  groupedByDay: Record<string, any[]>
  todayAppts: any[]
  pendingRequests: any[]
  followUpPatients: { id: string; name: string; phone: string | null; lastDate: string }[]
  lowStockItems: { id: string; name: string; category: string; quantity: number; min_quantity: number; unit: string }[]
}

export default function DashboardClient({ stats, weekAppts, groupedByDay, todayAppts, pendingRequests, followUpPatients, lowStockItems }: Props) {
  const { t, lang, currency } = useT()

  const todayLabel = new Date().toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  const STATUS_BADGE = {
    selesai: { label: t.schedule.completed, bg: 'var(--accent-light)', color: 'var(--accent)' },
    segera: { label: t.schedule.soon, bg: 'var(--gold-light)', color: 'var(--gold)' },
    akan: { label: t.schedule.upcoming, bg: 'var(--bg2)', color: 'var(--ink2)' },
  }

  const doneCount = todayAppts.filter((a: any) => getStatus(a.scheduled_at, a.status) === 'selesai').length
  const remainCount = todayAppts.length - doneCount

  const cards = [
    { label: t.dashboard.activePatients, value: stats?.totalPatients ?? '—', trend: t.dashboard.registered, up: true },
    {
      label: t.dashboard.todaySchedule,
      value: todayAppts.length > 0 ? todayAppts.length : (stats?.todaySessions ?? '—'),
      sub: todayAppts.length > 0
        ? `${doneCount} ${lang === 'id' ? 'selesai' : 'done'} · ${remainCount} ${lang === 'id' ? 'tersisa' : 'left'}`
        : t.common.today,
    },
    {
      label: lang === 'id' ? 'Pendapatan Bulan Ini' : 'Monthly Income',
      value: stats?.monthIncome != null ? formatMoneyShort(stats.monthIncome, currency) : '—',
      sub: lang === 'id' ? 'Sesi yang sudah lunas' : 'Paid sessions',
      accent: true,
    },
    { label: t.dashboard.totalSessions, value: stats?.totalSessions ?? '—', trend: t.dashboard.allTime, up: true },
  ]

  return (
    <>
      <Topbar
        title={t.dashboard.title}
        actions={
          <div className="flex items-center gap-3">
            <span className="hidden md:inline" style={{ fontSize: 13, color: "var(--ink3)" }}>{todayLabel}</span>
            <Link href="/sesi/baru" style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, background: 'var(--accent)', color: '#F5F0E8', textDecoration: 'none', fontFamily: 'var(--font-dm-sans)' }}>
              + {lang === 'id' ? 'Sesi Baru' : 'New Session'}
            </Link>
          </div>
        }
      />

      <div className="p-4 md:p-7 flex-1 space-y-5">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {cards.map((card) => (
            <div key={card.label} className="rounded-xl p-5" style={{ background: 'var(--surface)', border: `1px solid ${(card as any).accent ? 'var(--accent)' : 'var(--border)'}` }}>
              <p style={{ fontSize: 11, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{card.label}</p>
              <p style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 26, color: (card as any).accent ? 'var(--accent)' : 'var(--ink)', lineHeight: 1 }}>{card.value}</p>
              {card.trend && (
                <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                  {card.trend}
                </span>
              )}
              {card.sub && <p style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 4 }}>{card.sub}</p>}
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-[1fr_320px]">
          {/* Schedule */}
          <div className="rounded-[18px] overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border2)' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 16, color: 'var(--ink)' }}>{t.dashboard.weeklySchedule}</h2>
                {weekAppts.length > 0 && (
                  <p style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 2 }}>{weekAppts.length} {t.dashboard.scheduledSessions}</p>
                )}
              </div>
              <Link href="/jadwal" style={{ padding: '5px 12px', borderRadius: 8, fontSize: 12, background: 'transparent', border: '1px solid var(--border)', color: 'var(--ink2)', textDecoration: 'none', fontFamily: 'var(--font-dm-sans)' }}>
                {lang === 'id' ? 'Lihat semua' : 'View all'}
              </Link>
            </div>

            <div className="px-5 py-2" style={{ maxHeight: 340, overflowY: 'auto' }}>
              {weekAppts.length === 0 ? (
                <div className="py-10 text-center">
                  <p style={{ fontSize: 13, color: 'var(--ink3)' }}>{t.dashboard.noSchedule}</p>
                  <Link href="/jadwal/baru" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none', display: 'inline-block', marginTop: 6 }}>
                    {t.dashboard.createSchedule}
                  </Link>
                </div>
              ) : (
                Object.entries(groupedByDay).map(([dayKey, appts]) => {
                  const dayDate = new Date(dayKey)
                  const now = new Date(); now.setHours(0,0,0,0)
                  const isToday = dayDate.getTime() === now.getTime()
                  const isTomorrow = dayDate.getTime() === now.getTime() + 86400000
                  const dayLabel = isToday ? t.common.today : isTomorrow ? t.common.tomorrow
                    : dayDate.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { weekday: 'long', day: 'numeric', month: 'short' })

                  return (
                    <div key={dayKey}>
                      <div className="flex items-center gap-2 py-2 sticky top-0" style={{ background: 'var(--surface)' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: isToday ? 'var(--accent)' : 'var(--ink2)', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                          {dayLabel}
                        </span>
                        <div style={{ flex: 1, height: 1, background: 'var(--border2)' }} />
                        <span style={{ fontSize: 11, color: 'var(--ink3)' }}>{(appts as any[]).length} {t.schedule.sessions}</span>
                      </div>

                      {(appts as any[]).map((appt: any, i: number) => {
                        const status = getStatus(appt.scheduled_at, appt.status)
                        const badge = STATUS_BADGE[status]
                        const name = appt.patient?.name ?? (appt as any).external_name ?? (lang === 'id' ? 'Pasien Baru' : 'New Patient')
                        const col = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
                        const time = new Date(appt.scheduled_at).toLocaleTimeString(lang === 'id' ? 'id-ID' : 'en-US', { hour: '2-digit', minute: '2-digit' })

                        return (
                          <div key={appt.id} className="flex items-center gap-3 py-2.5"
                            style={{ borderBottom: i < (appts as any[]).length - 1 ? '1px solid var(--border2)' : 'none', marginBottom: i === (appts as any[]).length - 1 ? 8 : 0 }}>
                            <div style={{ width: 34, height: 34, borderRadius: '50%', background: col.bg, color: col.text, fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {getInitials(name)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{name}</div>
                              <div style={{ fontSize: 11.5, color: 'var(--ink3)', marginTop: 1 }}>
                                {time} · {appt.reason ?? (lang === 'id' ? 'Sesi akupuntur' : 'Acupuncture session')} · {appt.duration_minutes} {lang === 'id' ? 'mnt' : 'min'}
                              </div>
                            </div>
                            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: badge.bg, color: badge.color, whiteSpace: 'nowrap' }}>
                              {badge.label}
                            </span>
                            {status !== 'selesai' && appt.status === 'scheduled' ? (
                              <Link href={`/sesi/baru?pasien=${appt.patient?.id ?? ''}&alasan=${encodeURIComponent(appt.reason ?? '')}&jadwal=${appt.id}`}
                                style={{ padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 500, background: 'var(--accent)', color: '#F5F0E8', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                {t.dashboard.start}
                              </Link>
                            ) : appt.session_id ? (
                              <Link href={`/sesi/${appt.session_id}`}
                                style={{ padding: '3px 9px', borderRadius: 6, fontSize: 11, border: '1px solid var(--border)', color: 'var(--ink3)', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                {t.dashboard.view}
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

          {/* Follow-up pasien */}
          {followUpPatients.length > 0 && (
            <div className="rounded-[18px] overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border2)' }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 15, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                    {lang === 'id' ? 'Perlu Follow-up' : 'Follow-up Needed'}
                  </h2>
                  <p style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 2 }}>
                    {followUpPatients.length} {lang === 'id' ? 'pasien tidak kembali > 30 hari' : 'patients inactive > 30 days'}
                  </p>
                </div>
                <Link href="/pasien" style={{ fontSize: 11, color: 'var(--ink2)', fontWeight: 500, textDecoration: 'none', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: 7 }}>
                  {lang === 'id' ? 'Semua pasien' : 'All patients'}
                </Link>
              </div>
              <div className="px-5 divide-y" style={{ borderColor: 'var(--border2)' }}>
                {followUpPatients.map(p => {
                  const days = daysSince(p.lastDate)
                  const urgency = days > 90 ? 'var(--red)' : days > 60 ? 'var(--gold)' : 'var(--ink3)'
                  return (
                    <div key={p.id} className="flex items-center gap-3 py-3">
                      <div className="flex-1 min-w-0">
                        <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--ink)' }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: urgency, marginTop: 1 }}>
                          {lang === 'id' ? `Terakhir sesi ${days} hari lalu` : `Last session ${days} days ago`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Link href={`/pasien/${p.id}`}
                          style={{ padding: '4px 10px', borderRadius: 7, fontSize: 12, border: '1px solid var(--border)', color: 'var(--ink2)', textDecoration: 'none' }}>
                          {lang === 'id' ? 'Lihat' : 'View'}
                        </Link>
                        {p.phone && (
                          <a href={waLink(p.phone)} target="_blank" rel="noopener noreferrer"
                            style={{ padding: '4px 10px', borderRadius: 7, fontSize: 12, fontWeight: 500, background: '#25D366', color: '#fff', textDecoration: 'none' }}>
                            WA
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Alert stok rendah */}
          {lowStockItems.length > 0 && (
            <div className="rounded-[18px] overflow-hidden" style={{ background: 'var(--surface)', border: `1px solid ${lowStockItems.some(i => i.quantity === 0) ? 'var(--red)' : 'var(--gold)'}` }}>
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border2)', background: lowStockItems.some(i => i.quantity === 0) ? 'var(--red-light)' : 'var(--gold-light)' }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 15, color: 'var(--ink)' }}>
                    {lowStockItems.some(i => i.quantity === 0) ? '🚨' : '⚠️'} {lang === 'id' ? 'Stok Perlu Diisi' : 'Stock Alert'}
                  </h2>
                  <p style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 2 }}>
                    {lowStockItems.length} {lang === 'id' ? 'item hampir habis atau kosong' : 'items low or out of stock'}
                  </p>
                </div>
                <Link href="/stok" style={{ fontSize: 11, color: 'var(--ink2)', fontWeight: 500, textDecoration: 'none', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: 7 }}>
                  {lang === 'id' ? 'Kelola stok' : 'Manage stock'}
                </Link>
              </div>
              <div className="px-5 py-1">
                {lowStockItems.slice(0, 5).map((item, i) => (
                  <div key={item.id} className="flex items-center justify-between py-2.5"
                    style={{ borderBottom: i < Math.min(lowStockItems.length, 5) - 1 ? '1px solid var(--border2)' : 'none' }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--ink)' }}>{item.name}</div>
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 12, color: 'var(--ink3)' }}>{item.category}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 20, background: item.quantity === 0 ? 'var(--red-light)' : 'var(--gold-light)', color: item.quantity === 0 ? 'var(--red)' : 'var(--gold)' }}>
                        {item.quantity === 0 ? (lang === 'id' ? 'Habis' : 'Out') : `${item.quantity} ${item.unit}`}
                      </span>
                    </div>
                  </div>
                ))}
                {lowStockItems.length > 5 && (
                  <p style={{ fontSize: 12, color: 'var(--ink3)', padding: '8px 0', textAlign: 'center' }}>
                    +{lowStockItems.length - 5} item lainnya — <Link href="/stok" style={{ color: 'var(--accent)', textDecoration: 'none' }}>lihat semua</Link>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Permintaan jadwal masuk */}
          {pendingRequests.length > 0 && (
            <div className="rounded-[18px] overflow-hidden mt-4" style={{ background: 'var(--surface)', border: '1px solid var(--gold)' }}>
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border2)', background: 'var(--gold-light)' }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 15, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                    {lang === 'id' ? 'Permintaan Jadwal Masuk' : 'Incoming Appointment Requests'}
                  </h2>
                  <p style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 2 }}>{pendingRequests.length} {lang === 'id' ? 'menunggu konfirmasi' : 'awaiting confirmation'}</p>
                </div>
                <Link href="/jadwal/permintaan" style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 500, textDecoration: 'none' }}>
                  {lang === 'id' ? 'Kelola →' : 'Manage →'}
                </Link>
              </div>
              <div className="px-5 py-3 space-y-3">
                {pendingRequests.map((req: any) => (
                  <div key={req.id} style={{ paddingBottom: 12, borderBottom: '1px solid var(--border2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--ink)' }}>{req.patient_name}</span>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'var(--gold-light)', color: 'var(--gold)' }}>
                        {lang === 'id' ? 'Menunggu' : 'Pending'}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--ink3)' }}>
                      {req.patient_phone}
                      {req.preferred_date ? ` · ${new Date(req.preferred_date).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short' })}` : ''}
                      {req.preferred_time ? ` ${req.preferred_time}` : ''}
                    </p>
                    {req.reason && <p style={{ fontSize: 12, color: 'var(--ink2)', marginTop: 2 }}>{req.reason}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
