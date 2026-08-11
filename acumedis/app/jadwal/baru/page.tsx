'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Topbar from '@/components/layout/Topbar'
import { mockPatients } from '@/lib/mock-data'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px',
  border: '1px solid var(--border)', borderRadius: 8,
  fontFamily: 'var(--font-dm-sans)', fontSize: 13.5,
  color: 'var(--ink)', background: 'var(--surface)', outline: 'none',
}
const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%239C9389' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 32,
}
const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 500, color: 'var(--ink2)', letterSpacing: 0.3, marginBottom: 6, display: 'block',
}

const DURATIONS = [
  { value: 30, label: '30 menit' },
  { value: 45, label: '45 menit' },
  { value: 60, label: '60 menit' },
  { value: 90, label: '90 menit' },
]

export default function JadwalBaruPage() {
  const router = useRouter()
  const [patients, setPatients] = useState<{ id: string; name: string }[]>(
    mockPatients.map(p => ({ id: p.id, name: p.name }))
  )
  const [form, setForm] = useState({
    patient_id: '',
    scheduled_at: (() => {
      const d = new Date(Math.ceil(Date.now() / (30 * 60000)) * (30 * 60000))
      const pad = (n: number) => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    })(),
    duration_minutes: 45,
    reason: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/patients').then(r => r.ok ? r.json() : []).then((data: any[]) => {
      if (data && data.length > 0) setPatients(data.map((p: any) => ({ id: p.id, name: p.name })))
    }).catch(() => {})
  }, [])

  function set(k: string, v: any) {
    setForm(p => ({ ...p, [k]: v }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.patient_id || !form.scheduled_at) return
    setLoading(true)
    setError('')

    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_id: form.patient_id,
        scheduled_at: new Date(form.scheduled_at).toISOString(),
        duration_minutes: form.duration_minutes,
        reason: form.reason || null,
      }),
    })

    setLoading(false)
    if (!res.ok) { const b = await res.json().catch(() => ({})); setError(b.error || 'Gagal menyimpan'); return }
    router.push('/jadwal')
    router.refresh()
  }

  const fo = (e: React.FocusEvent<any>) => (e.target.style.borderColor = 'var(--accent2)')
  const bl = (e: React.FocusEvent<any>) => (e.target.style.borderColor = 'var(--border)')

  return (
    <>
      <Topbar title="Jadwal Baru" back="/jadwal" />
      <div className="p-4 md:p-7">
        <form onSubmit={handleSubmit} className="max-w-lg">
          <div className="rounded-[18px] overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border2)' }}>
              <h2 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 16, color: 'var(--ink)' }}>Buat Jadwal Sesi</h2>
              <p style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 3 }}>
                Rekam medis lengkap diisi saat sesi berlangsung
              </p>
            </div>

            <div className="p-4 md:p-6 space-y-4">
              {/* Pasien */}
              <div>
                <label style={labelStyle}>Pasien <span style={{ color: 'var(--red)' }}>*</span></label>
                <select value={form.patient_id} onChange={e => set('patient_id', e.target.value)} required style={selectStyle} onFocus={fo} onBlur={bl}>
                  <option value="">Pilih pasien...</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              {/* Tanggal & waktu */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle}>Tanggal & Waktu <span style={{ color: 'var(--red)' }}>*</span></label>
                  <input type="datetime-local" value={form.scheduled_at} onChange={e => set('scheduled_at', e.target.value)} required style={inputStyle} onFocus={fo} onBlur={bl} />
                </div>
                <div>
                  <label style={labelStyle}>Durasi</label>
                  <select value={form.duration_minutes} onChange={e => set('duration_minutes', Number(e.target.value))} style={selectStyle} onFocus={fo} onBlur={bl}>
                    {DURATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Alasan kunjungan */}
              <div>
                <label style={labelStyle}>Alasan Kunjungan</label>
                <input type="text" value={form.reason} onChange={e => set('reason', e.target.value)}
                  placeholder="Contoh: Kontrol nyeri punggung, sesi lanjutan..."
                  style={inputStyle} onFocus={fo} onBlur={bl} />
              </div>

              {error && (
                <div className="rounded-lg p-3" style={{ background: 'var(--red-light)', fontSize: 13, color: 'var(--red)' }}>
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-4">
            <button type="submit" disabled={loading || !form.patient_id || !form.scheduled_at}
              style={{
                padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                border: 'none', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)',
                background: loading || !form.patient_id ? 'var(--bg2)' : 'var(--accent)',
                color: loading || !form.patient_id ? 'var(--ink3)' : '#F5F0E8',
                transition: 'all 0.15s',
              }}>
              {loading ? 'Menyimpan...' : 'Simpan Jadwal'}
            </button>
            <Link href="/jadwal" style={{ padding: '9px 16px', fontSize: 13, color: 'var(--ink2)', textDecoration: 'none', fontFamily: 'var(--font-dm-sans)' }}>
              Batal
            </Link>
          </div>
        </form>
      </div>
    </>
  )
}
