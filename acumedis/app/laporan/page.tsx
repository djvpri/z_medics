'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Topbar from '@/components/layout/Topbar'
import { mockSessions, mockPatients } from '@/lib/mock-data'
import { useT } from '@/contexts/LanguageContext'
import { formatMoneyShort, formatMoney } from '@/lib/formatMoney'

interface MonthData { label: string; count: number; income?: number }
interface Stats { totalPatients: number; totalSessions: number; monthSessions: number; avgPerWeek: number; monthIncome: number; totalIncome: number; monthExpense: number; netProfit: number }


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
  const { t, lang, currency } = useT()
  const [stats, setStats] = useState<Stats>({ totalPatients: 0, totalSessions: 0, monthSessions: 0, avgPerWeek: 0, monthIncome: 0, totalIncome: 0, monthExpense: 0, netProfit: 0 })
  const [monthlyData, setMonthlyData] = useState<MonthData[]>([])
  const [topKeluhan, setTopKeluhan] = useState<{ label: string; count: number }[]>([])
  const [recentSessions, setRecentSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()

        const [{ count: totalPatients }, { count: totalSessions }, { data: sessions }, { data: expensesData }] = await Promise.all([
          supabase.from('patients').select('*', { count: 'exact', head: true }),
          supabase.from('sessions').select('*', { count: 'exact', head: true }),
          supabase.from('sessions').select('id, session_date, chief_complaint, fee, payment_status, patient:patients(name)').order('session_date', { ascending: false }).limit(100),
          supabase.from('expenses').select('expense_date, amount').order('expense_date', { ascending: false }).limit(200),
        ])

        const allSessions = (sessions && sessions.length > 0)
          ? sessions
          : mockSessions.map(s => ({ ...s, patient: s.patient ? { name: s.patient.name } : null }))

        const totalP = totalPatients ?? mockPatients.length
        const totalS = totalSessions ?? mockSessions.length

        // Monthly data (last 6 months)
        const now = new Date()
        const months: MonthData[] = Array.from({ length: 6 }, (_, i) => {
          const d = new Date()
          d.setMonth(d.getMonth() - (5 - i))
          const y = d.getFullYear()
          const m = d.getMonth()
          const monthSes = allSessions.filter((s: any) => {
            const sd = new Date(s.session_date)
            return sd.getFullYear() === y && sd.getMonth() === m
          })
          const income = monthSes.filter((s: any) => s.payment_status === 'paid').reduce((sum: number, s: any) => sum + (s.fee ?? 0), 0)
          return { label: getMonthLabel(5 - i), count: monthSes.length, income }
        })
        setMonthlyData(months)

        // This month sessions + income
        const monthSessions = allSessions.filter((s: any) => {
          const sd = new Date(s.session_date)
          return sd.getFullYear() === now.getFullYear() && sd.getMonth() === now.getMonth()
        }).length
        const monthIncome = allSessions.filter((s: any) => {
          const sd = new Date(s.session_date)
          return sd.getFullYear() === now.getFullYear() && sd.getMonth() === now.getMonth() && s.payment_status === 'paid'
        }).reduce((sum: number, s: any) => sum + (s.fee ?? 0), 0)
        const totalIncome = allSessions.filter((s: any) => s.payment_status === 'paid').reduce((sum: number, s: any) => sum + (s.fee ?? 0), 0)

        // Avg per week
        const avgPerWeek = totalS > 0 ? Math.round((totalS / 12) * 3) : 0

        const nowStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
        const monthExpense = (expensesData ?? []).filter((e: any) => e.expense_date?.startsWith(nowStr)).reduce((s: number, e: any) => s + (e.amount ?? 0), 0)
        const netProfit = monthIncome - monthExpense

        setStats({ totalPatients: totalP, totalSessions: totalS, monthSessions, avgPerWeek, monthIncome, totalIncome, monthExpense, netProfit })

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
        setStats({ totalPatients: mockPatients.length, totalSessions: mockSessions.length, monthSessions: mockSessions.length, avgPerWeek: 3, monthIncome: 0, totalIncome: 0, monthExpense: 0, netProfit: 0 })
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
          <div className="flex items-center gap-2">
            <button onClick={exportCSV} style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--ink2)', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)' }}>
              {t.common.export} CSV
            </button>
            <Link href={`/laporan-pdf?bulan=${new Date().getMonth() + 1}&tahun=${new Date().getFullYear()}`} target="_blank"
              style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, border: 'none', background: 'var(--accent)', color: '#F5F0E8', textDecoration: 'none', fontFamily: 'var(--font-dm-sans)', whiteSpace: 'nowrap' }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 5 }}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              Export PDF
            </Link>
          </div>
        }
      />

      <div className="p-4 md:p-7 space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatCard label={t.report.activePatients} value={loading ? '...' : stats.totalPatients} sub={t.dashboard.registered} />
          <StatCard label={t.report.totalSessions} value={loading ? '...' : stats.totalSessions} sub={t.dashboard.allTime} />
          <StatCard label={t.report.thisMonth} value={loading ? '...' : stats.monthSessions} sub={new Date().toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { month: 'long' })} accent />
          <StatCard label={t.report.avgPerWeek} value={loading ? '...' : stats.avgPerWeek} sub={t.report.estimated} />
        </div>

        {/* Stat keuangan */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatCard label="Pendapatan Bulan Ini" value={loading ? '...' : formatMoneyShort(stats.monthIncome, currency)} sub="Sesi yang sudah lunas" accent />
          <StatCard label="Total Pendapatan" value={loading ? '...' : formatMoneyShort(stats.totalIncome, currency)} sub="Semua waktu · sesi lunas" />
          <StatCard label="Pengeluaran Bulan Ini" value={loading ? '...' : formatMoneyShort(stats.monthExpense, currency)} sub="Dari menu Pengeluaran" />
          <StatCard label="Laba Bersih" value={loading ? '...' : formatMoneyShort(stats.netProfit, currency)} sub="Pendapatan - Pengeluaran" accent={stats.netProfit >= 0} />
        </div>

        {/* Chart + Top Keluhan */}
        <div className="grid gap-5 grid-cols-1 lg:grid-cols-[1fr_300px]">
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
                  {[t.report.date, t.report.patient, t.session.chiefComplaint, 'Biaya', 'Status'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 20px', fontSize: 11, color: 'var(--ink3)', fontWeight: 500, letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentSessions.map((s, i) => {
                  const paymentCfg: Record<string, { label: string; bg: string; color: string }> = {
                    paid:    { label: 'Lunas',    bg: 'var(--accent-light)', color: 'var(--accent)' },
                    unpaid:  { label: 'Belum',    bg: 'var(--red-light)',    color: 'var(--red)'    },
                    partial: { label: 'Sebagian', bg: 'var(--gold-light)',   color: 'var(--gold)'   },
                  }
                  const pay = s.payment_status ? paymentCfg[s.payment_status] : null
                  return (
                    <tr key={s.id} style={{ borderBottom: i < recentSessions.length - 1 ? '1px solid var(--border2)' : 'none' }}>
                      <td style={{ padding: '11px 20px', color: 'var(--ink3)', whiteSpace: 'nowrap' }}>
                        {new Date(s.session_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '11px 20px', color: 'var(--ink)', fontWeight: 500 }}>
                        {(s.patient as any)?.name ?? '-'}
                      </td>
                      <td style={{ padding: '11px 20px', color: 'var(--ink2)' }}>{s.chief_complaint}</td>
                      <td style={{ padding: '11px 20px', color: 'var(--ink)', whiteSpace: 'nowrap' }}>
                        {s.fee ? formatMoney(Number(s.fee), currency) : '—'}
                      </td>
                      <td style={{ padding: '11px 20px' }}>
                        {pay ? <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: pay.bg, color: pay.color }}>{pay.label}</span> : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}
