'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatMoney } from '@/lib/formatMoney'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

const PAY_LABEL: Record<string, string> = { paid: 'Lunas', unpaid: 'Belum', partial: 'Sebagian' }
const PAY_COLOR: Record<string, string> = { paid: '#2D5A3D', unpaid: '#8B2020', partial: '#B8860B' }

function LaporanPDFContent() {
  const params = useSearchParams()
  const now = new Date()
  const [bulan, setBulan] = useState(Number(params.get('bulan') ?? now.getMonth() + 1))
  const [tahun, setTahun] = useState(Number(params.get('tahun') ?? now.getFullYear()))
  const [klinik, setKlinik] = useState<any>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [currency, setCurrency] = useState('IDR')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const monthStr = `${tahun}-${String(bulan).padStart(2, '0')}`
      const start = `${monthStr}-01`
      const end = new Date(tahun, bulan, 0).toISOString().slice(0, 10)

      const [{ data: klinikData }, { data: sessData }, { data: expData }] = await Promise.all([
        supabase.from('practitioners').select('name, clinic_name, public_address, city, phone_public, avatar_url, currency').eq('id', user.id).single(),
        supabase.from('sessions').select('session_date, fee, payment_status, chief_complaint, patient:patients(name)').gte('session_date', start).lte('session_date', end).order('session_date'),
        supabase.from('expenses').select('expense_date, amount, category, description').gte('expense_date', start).lte('expense_date', end).order('expense_date'),
      ])

      setKlinik(klinikData)
      setSessions(sessData ?? [])
      setExpenses(expData ?? [])
      if (klinikData?.currency) setCurrency(klinikData.currency)
      setLoading(false)
    }
    load()
  }, [bulan, tahun])

  const totalIncome = sessions.filter(s => s.payment_status === 'paid').reduce((sum, s) => sum + (s.fee ?? 0), 0)
  const totalPending = sessions.filter(s => s.payment_status !== 'paid').reduce((sum, s) => sum + (s.fee ?? 0), 0)
  const totalExpense = expenses.reduce((sum, e) => sum + (e.amount ?? 0), 0)
  const netProfit = totalIncome - totalExpense
  const bulanLabel = new Date(tahun, bulan - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

  const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
  const YEARS = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i)

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f0f0f0; font-family: 'DM Sans', Arial, sans-serif; font-size: 13px; color: #1C2B1F; }
        table { border-collapse: collapse; width: 100%; }
        th, td { text-align: left; padding: 7px 10px; border-bottom: 1px solid #e8e3dc; font-size: 12px; }
        th { background: #F8F5F0; font-weight: 600; font-size: 11px; color: #6B6260; text-transform: uppercase; letter-spacing: 0.5px; }
        @media print {
          body { background: white; }
          .no-print { display: none !important; }
          .report { box-shadow: none !important; max-width: 100% !important; margin: 0 !important; }
          @page { margin: 1cm; size: A4 portrait; }
        }
      `}</style>

      {/* Toolbar */}
      <div className="no-print" style={{ background: '#1C2B1F', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ color: 'rgba(245,240,232,0.6)', fontSize: 13, marginRight: 8 }}>Laporan Keuangan PDF</span>
        <select value={bulan} onChange={e => setBulan(Number(e.target.value))}
          style={{ padding: '6px 10px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: '#F5F0E8', fontSize: 13, cursor: 'pointer' }}>
          {MONTHS.map((m, i) => <option key={i} value={i + 1} style={{ background: '#1C2B1F' }}>{m}</option>)}
        </select>
        <select value={tahun} onChange={e => setTahun(Number(e.target.value))}
          style={{ padding: '6px 10px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: '#F5F0E8', fontSize: 13, cursor: 'pointer' }}>
          {YEARS.map(y => <option key={y} value={y} style={{ background: '#1C2B1F' }}>{y}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <button onClick={() => window.history.back()}
          style={{ padding: '7px 16px', borderRadius: 8, fontSize: 13, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
          ← Kembali
        </button>
        <button onClick={() => window.print()} disabled={loading}
          style={{ padding: '7px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: 'none', background: '#4A8C60', color: '#fff', cursor: 'pointer', opacity: loading ? 0.5 : 1 }}>
          🖨 Cetak / Simpan PDF
        </button>
      </div>

      {/* Report */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 16px', minHeight: 'calc(100vh - 52px)' }}>
        <div className="report" style={{ background: 'white', width: '100%', maxWidth: 780, borderRadius: 12, boxShadow: '0 4px 40px rgba(0,0,0,0.1)', overflow: 'hidden' }}>

          {/* Header */}
          <div style={{ background: '#1C2B1F', padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {klinik?.avatar_url
                ? <img src={klinik.avatar_url} alt="logo" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.2)' }} />
                : <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#4A8C60', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#fff' }}>
                    {(klinik?.clinic_name ?? klinik?.name ?? 'K')[0]}
                  </div>
              }
              <div>
                <div style={{ fontFamily: 'serif', fontSize: 18, color: '#F5F0E8' }}>{klinik?.clinic_name ?? klinik?.name ?? 'Z Medics'}</div>
                {klinik?.public_address && <div style={{ fontSize: 11, color: 'rgba(245,240,232,0.45)', marginTop: 2 }}>{[klinik.public_address, klinik.city].filter(Boolean).join(', ')}</div>}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: 'rgba(245,240,232,0.4)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>Laporan Keuangan</div>
              <div style={{ fontFamily: 'serif', fontSize: 20, color: '#F5F0E8' }}>{bulanLabel}</div>
            </div>
          </div>

          <div style={{ padding: '24px 32px' }}>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#9C9389' }}>Memuat data...</div>
            ) : (
              <>
                {/* Ringkasan */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
                  {[
                    { label: 'Pendapatan Lunas', value: formatMoney(totalIncome, currency), color: '#2D5A3D', bg: '#E8F2EC' },
                    { label: 'Belum Terbayar', value: formatMoney(totalPending, currency), color: '#6B6260', bg: '#F8F5F0' },
                    { label: 'Total Pengeluaran', value: formatMoney(totalExpense, currency), color: '#8B2020', bg: '#FEECEC' },
                    { label: 'Laba Bersih', value: formatMoney(netProfit, currency), color: netProfit >= 0 ? '#2D5A3D' : '#8B2020', bg: netProfit >= 0 ? '#E8F2EC' : '#FEECEC' },
                  ].map(card => (
                    <div key={card.label} style={{ background: card.bg, borderRadius: 10, padding: '14px 16px' }}>
                      <div style={{ fontSize: 10, color: card.color, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, fontWeight: 600 }}>{card.label}</div>
                      <div style={{ fontFamily: 'serif', fontSize: 17, color: card.color }}>{card.value}</div>
                    </div>
                  ))}
                </div>

                {/* Tabel Pendapatan */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1C2B1F', marginBottom: 10, paddingBottom: 6, borderBottom: '2px solid #1C2B1F' }}>
                    Riwayat Pendapatan — {sessions.length} sesi
                  </div>
                  {sessions.length === 0 ? (
                    <p style={{ color: '#9C9389', fontSize: 12, padding: '12px 0' }}>Tidak ada sesi pada periode ini.</p>
                  ) : (
                    <table>
                      <thead>
                        <tr>
                          <th style={{ width: 30 }}>No</th>
                          <th>Tanggal</th>
                          <th>Pasien</th>
                          <th>Keluhan</th>
                          <th style={{ textAlign: 'right' }}>Biaya</th>
                          <th style={{ textAlign: 'center' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessions.map((s, i) => (
                          <tr key={i}>
                            <td style={{ color: '#9C9389' }}>{i + 1}</td>
                            <td style={{ whiteSpace: 'nowrap' }}>{formatDate(s.session_date)}</td>
                            <td style={{ fontWeight: 500 }}>{(s.patient as any)?.name ?? '—'}</td>
                            <td style={{ color: '#6B6260', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.chief_complaint}</td>
                            <td style={{ textAlign: 'right', fontWeight: 500 }}>{s.fee ? formatMoney(s.fee, currency) : '—'}</td>
                            <td style={{ textAlign: 'center' }}>
                              {s.payment_status
                                ? <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600, color: PAY_COLOR[s.payment_status] ?? '#6B6260', background: s.payment_status === 'paid' ? '#E8F2EC' : s.payment_status === 'unpaid' ? '#FEECEC' : '#FFF8E1' }}>
                                    {PAY_LABEL[s.payment_status] ?? s.payment_status}
                                  </span>
                                : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={4} style={{ fontWeight: 600, fontSize: 12, borderTop: '2px solid #1C2B1F', paddingTop: 8 }}>Total Lunas</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 13, borderTop: '2px solid #1C2B1F', paddingTop: 8, color: '#2D5A3D' }}>{formatMoney(totalIncome, currency)}</td>
                          <td style={{ borderTop: '2px solid #1C2B1F' }} />
                        </tr>
                      </tfoot>
                    </table>
                  )}
                </div>

                {/* Tabel Pengeluaran */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1C2B1F', marginBottom: 10, paddingBottom: 6, borderBottom: '2px solid #1C2B1F' }}>
                    Riwayat Pengeluaran — {expenses.length} transaksi
                  </div>
                  {expenses.length === 0 ? (
                    <p style={{ color: '#9C9389', fontSize: 12, padding: '12px 0' }}>Tidak ada pengeluaran pada periode ini.</p>
                  ) : (
                    <table>
                      <thead>
                        <tr>
                          <th style={{ width: 30 }}>No</th>
                          <th>Tanggal</th>
                          <th>Kategori</th>
                          <th>Keterangan</th>
                          <th style={{ textAlign: 'right' }}>Nominal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expenses.map((e, i) => (
                          <tr key={i}>
                            <td style={{ color: '#9C9389' }}>{i + 1}</td>
                            <td style={{ whiteSpace: 'nowrap' }}>{formatDate(e.expense_date)}</td>
                            <td><span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#F8F5F0', color: '#6B6260' }}>{e.category}</span></td>
                            <td style={{ color: '#6B6260' }}>{e.description ?? '—'}</td>
                            <td style={{ textAlign: 'right', fontWeight: 500, color: '#8B2020' }}>{formatMoney(e.amount, currency)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={4} style={{ fontWeight: 600, fontSize: 12, borderTop: '2px solid #1C2B1F', paddingTop: 8 }}>Total Pengeluaran</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 13, borderTop: '2px solid #1C2B1F', paddingTop: 8, color: '#8B2020' }}>{formatMoney(totalExpense, currency)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  )}
                </div>

                {/* Laba bersih summary */}
                <div style={{ background: netProfit >= 0 ? '#E8F2EC' : '#FEECEC', borderRadius: 10, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: '#1C2B1F' }}>Laba Bersih {bulanLabel}</span>
                  <span style={{ fontFamily: 'serif', fontSize: 22, fontWeight: 700, color: netProfit >= 0 ? '#2D5A3D' : '#8B2020' }}>{formatMoney(netProfit, currency)}</span>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '10px 32px', background: '#F8F5F0', textAlign: 'center' }}>
            <span style={{ fontSize: 10, color: '#9C9389' }}>Dicetak dari Z Medics · {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
      </div>
    </>
  )
}

export default function LaporanPDFPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#666' }}>Memuat...</div>}>
      <LaporanPDFContent />
    </Suspense>
  )
}
