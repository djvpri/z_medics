'use client'

import { useState, useEffect } from 'react'
import Topbar from '@/components/layout/Topbar'
import { createClient } from '@/lib/supabase/client'
import { mockSessions, mockPatients } from '@/lib/mock-data'
import { useT } from '@/contexts/LanguageContext'

interface MonthData { label: string; count: number }
interface Stats { totalPatients: number; totalSessions: number; monthSessions: number; avgPerWeek: number }

function getMonthLabel(offset: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() - offset)
  return d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })
}

function BarChart({ data }: { data: MonthData[] }) {
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div className="flex items-end gap-2" style={{ height: 140 }}>
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
          <span style={{ fontSize: 11, color: 'var(--ink3)', fontWeight: 500 }}>{d.count || ''}</span>
          <div
            style={{
              width: '100%', borderRadius: '6px 6px 0 0', transition: 'height 0.4s ease',
              height: d.count === 0 ? 4 : `${Math.max((d.count / max) * 110, 8)}px`,
              background: i === 0 ? 'var(--accent)' : 'var(--accent-light)',
              border: i === 0 ? 'none' : '1px solid rgba(45,90,61,0.15)',
            }}
          />
          <span style={{ fontSize: 10, color: 'var(--ink3)', whiteSpace: 'nowrap' }}>{d.label}</span>
        </div>
      ))}
    </div>
  )
}

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div className="rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div style={{ fontSize: 11, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 28, color: accent ? 'var(--accent)' : 'var(--ink)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

export default function LaporanPage() {
  const { t, lang } = useT()
  const [stats, setStats] = useState<Stats>({ totalPatients: 0, totalSessions: 0, monthSessions: 0, avgPerWeek: 0 })
  const [monthlyData, setMonthlyData] = useState<MonthData[]>([])
  const [topKeluhan, setTopKeluhan] = useState<{ label: string; count: number }[]>([])
  const [recentSessions, setRecentSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()

        const [{ count: totalPatients }, { count: totalSessions }, { data: sessions }] = await Promise.all([
          supabase.from('patients').select('*', { count: 'exact', head: true }),
          supabase.from('sessions').select('*', { count: 'exact', head: true }),
          supabase.from('sessions').select('id, session_date, chief_complaint, patient:patients(name)').order('session_date', { ascending: false }).limit(100),
        ])

        const allSessions = (sessions && sessions.length > 0)
          ? sessions
          : mockSessions.map(s => ({ ...s, patient: s.patient ? { name: s.patient.name } : null }))

        const totalP = totalPatients ?? mockPatients.length
        const totalS = totalSessions ?? mockSessions.length

        // Monthly data (last 6 months)
        const months: MonthData[] = Array.from({ length: 6 }, (_, i) => {
          const d = new Date()
          d.setMonth(d.getMonth() - (5 - i))
          const y = d.getFullYear()
          const m = d.getMonth()
          const count = allSessions.filter((s: any) => {
            const sd = new Date(s.session_date)
            return sd.getFullYear() === y && sd.getMonth() === m
          }).length
          return { label: getMonthLabel(5 - i), count }
        })
        setMonthlyData(months)

        // This month sessions
        const now = new Date()
        const monthSessions = allSessions.filter((s: any) => {
          const sd = new Date(s.session_date)
          return sd.getFullYear() === now.getFullYear() && sd.getMonth() === now.getMonth()
        }).length

        // Avg per week
        const avgPerWeek = totalS > 0 ? Math.round((totalS / 12) * 3) : 0

        setStats({ totalPatients: totalP, totalSessions: totalS, monthSessions, avgPerWeek })

        // Top keluhan
        const keluhanMap: Record<string, number> = {}
        allSessions.forEach((s: any) => {
          const words = s.chief_complaint?.split(' ').slice(0, 3).join(' ') ?? 'Lainnya'
          keluhanMap[words] = (keluhanMap[words] || 0) + 1
        })
        const top = Object.entries(keluhanMap).sort((a, b) => b[1] - a[1]).slice(0, 5)
          .map(([label, count]) => ({ label, count }))
        setTopKeluhan(top)

        // Recent sessions
        setRecentSessions(allSessions.slice(0, 8))
      } catch {
        // Fallback mock
        setStats({ totalPatients: mockPatients.length, totalSessions: mockSessions.length, monthSessions: mockSessions.length, avgPerWeek: 3 })
        setMonthlyData(Array.from({ length: 6 }, (_, i) => ({ label: getMonthLabel(5 - i), count: i === 5 ? mockSessions.length : Math.floor(Math.random() * 5) })))
        setTopKeluhan([{ label: 'Nyeri punggung bawah', count: 2 }, { label: 'Insomnia', count: 1 }, { label: 'Migrain kronis', count: 1 }])
        setRecentSessions(mockSessions.map(s => ({ ...s, patient: s.patient ? { name: s.patient.name } : null })))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function exportCSV() {
    const rows = [
      [t.report.date, t.report.patient, t.session.chiefComplaint],
      ...recentSessions.map(s => [
        new Date(s.session_date).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US'),
        (s.patient as any)?.name ?? '-',
        s.chief_complaint ?? '-',
      ]),
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `laporan-acumedis-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <Topbar
        title={t.report.title}
        actions={
          <button onClick={exportCSV} style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--ink2)', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)' }}>
            {t.common.export}
          </button>
        }
      />

      <div className="p-7 space-y-5">
        <div className="grid grid-cols-4 gap-4">
          <StatCard label={t.report.activePatients} value={loading ? '...' : stats.totalPatients} sub={t.dashboard.registered} />
          <StatCard label={t.report.totalSessions} value={loading ? '...' : stats.totalSessions} sub={t.dashboard.allTime} />
          <StatCard label={t.report.thisMonth} value={loading ? '...' : stats.monthSessions} sub={new Date().toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { month: 'long' })} accent />
          <StatCard label={t.report.avgPerWeek} value={loading ? '...' : stats.avgPerWeek} sub={t.report.estimated} />
        </div>

        {/* Chart + Top Keluhan */}
        <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 300px' }}>
          {/* Bar chart */}
          <div className="rounded-[18px] p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 16, color: 'var(--ink)' }}>{t.report.sessionsByMonth}</h2>
              <span style={{ fontSize: 11, color: 'var(--ink3)' }}>{t.report.last6Months}</span>
            </div>
            {loading ? (
              <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink3)', fontSize: 13 }}>Memuat...</div>
            ) : (
              <BarChart data={monthlyData} />
            )}
          </div>

          {/* Top keluhan */}
          <div className="rounded-[18px] p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h2 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 16, color: 'var(--ink)', marginBottom: 16 }}>{t.report.topComplaints}</h2>
            {loading ? (
              <div style={{ fontSize: 13, color: 'var(--ink3)' }}>{t.common.loading}</div>
            ) : topKeluhan.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--ink3)' }}>{t.report.noData}</div>
            ) : (
              <div className="space-y-3">
                {topKeluhan.map((k, i) => {
                  const max = topKeluhan[0].count
                  const pct = Math.round((k.count / max) * 100)
                  return (
                    <div key={i}>
                      <div className="flex justify-between mb-1">
                        <span style={{ fontSize: 12.5, color: 'var(--ink2)', fontWeight: 500 }}>{k.label}</span>
                        <span style={{ fontSize: 12, color: 'var(--ink3)' }}>{k.count}x</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: 'var(--bg2)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3, background: 'var(--accent)', transition: 'width 0.4s ease' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Riwayat sesi terbaru */}
        <div className="rounded-[18px] overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border2)' }}>
            <h2 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 16, color: 'var(--ink)' }}>{t.report.recentSessions}</h2>
            <span style={{ fontSize: 12, color: 'var(--ink3)' }}>{recentSessions.length} sesi</span>
          </div>
          {loading ? (
            <div className="py-10 text-center" style={{ fontSize: 13, color: 'var(--ink3)' }}>Memuat...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border2)' }}>
                  {[t.report.date, t.report.patient, t.session.chiefComplaint].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 20px', fontSize: 11, color: 'var(--ink3)', fontWeight: 500, letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentSessions.map((s, i) => (
                  <tr key={s.id} style={{ borderBottom: i < recentSessions.length - 1 ? '1px solid var(--border2)' : 'none' }}>
                    <td style={{ padding: '11px 20px', color: 'var(--ink3)', whiteSpace: 'nowrap' }}>
                      {new Date(s.session_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '11px 20px', color: 'var(--ink)', fontWeight: 500 }}>
                      {(s.patient as any)?.name ?? '-'}
                    </td>
                    <td style={{ padding: '11px 20px', color: 'var(--ink2)' }}>{s.chief_complaint}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}
