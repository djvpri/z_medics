'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Topbar from '@/components/layout/Topbar'
import { createClient } from '@/lib/supabase/client'
import { mockPatients } from '@/lib/mock-data'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', border: '1px solid var(--border)',
  borderRadius: 8, fontFamily: 'var(--font-dm-sans)', fontSize: 13.5,
  color: 'var(--ink)', background: 'var(--surface)', outline: 'none',
}
const selectStyle: React.CSSProperties = {
  ...inputStyle, appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%239C9389' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 32,
}
const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 500, color: 'var(--ink2)', letterSpacing: 0.3, marginBottom: 6, display: 'block',
}

const DURATIONS = [
  { value: 30, label: '30 menit' }, { value: 45, label: '45 menit' },
  { value: 60, label: '60 menit' }, { value: 90, label: '90 menit' },
]

export default function EditJadwalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [patients, setPatients] = useState<{ id: string; name: string }[]>(
    mockPatients.map(p => ({ id: p.id, name: p.name }))
  )
  const [form, setForm] = useState({
    patient_id: '', scheduled_at: '', duration_minutes: 45, reason: '', notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [{ data: appt }, { data: pList }] = await Promise.all([
        supabase.from('appointments').select('*').eq('id', id).single(),
        supabase.from('patients').select('id, name').order('name'),
      ])
      if (pList && pList.length > 0) setPatients(pList)
      if (appt) {
        setForm({
          patient_id: appt.patient_id ?? '',
          scheduled_at: appt.scheduled_at?.slice(0, 16) ?? '',
          duration_minutes: appt.duration_minutes ?? 45,
          reason: appt.reason ?? '',
          notes: appt.notes ?? '',
        })
      }
      setFetching(false)
    }
    load()
  }, [id])

  function set(k: string, v: any) { setForm(p => ({ ...p, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase.from('appointments').update({
      patient_id: form.patient_id,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      duration_minutes: form.duration_minutes,
      reason: form.reason || null,
      notes: form.notes || null,
    }).eq('id', id)
    setLoading(false)
    if (err) { setError(err.message); return }
    router.push('/jadwal')
    router.refresh()
  }

  const fo = (e: React.FocusEvent<any>) => (e.target.style.borderColor = 'var(--accent2)')
  const bl = (e: React.FocusEvent<any>) => (e.target.style.borderColor = 'var(--border)')

  if (fetching) {
    return (
      <>
        <Topbar title="Edit Jadwal" back="/jadwal" />
        <div className="p-7 text-center" style={{ fontSize: 13, color: 'var(--ink3)' }}>Memuat data...</div>
      </>
    )
  }

  return (
    <>
      <Topbar title="Edit Jadwal" back="/jadwal" />
      <div className="p-7">
        <form onSubmit={handleSubmit} className="max-w-lg">
          <div className="rounded-[18px] overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border2)' }}>
              <h2 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 16, color: 'var(--ink)' }}>Edit Jadwal Sesi</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label style={labelStyle}>Pasien <span style={{ color: 'var(--red)' }}>*</span></label>
                <select value={form.patient_id} onChange={e => set('patient_id', e.target.value)} required style={selectStyle} onFocus={fo} onBlur={bl}>
                  <option value="">Pilih pasien...</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

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

              <div>
                <label style={labelStyle}>Alasan Kunjungan</label>
                <input type="text" value={form.reason} onChange={e => set('reason', e.target.value)}
                  placeholder="Contoh: sesi lanjutan, kontrol, dll."
                  style={inputStyle} onFocus={fo} onBlur={bl} />
              </div>

              <div>
                <label style={labelStyle}>Catatan (opsional)</label>
                <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
                  rows={3} style={{ ...inputStyle, resize: 'none' }} onFocus={fo} onBlur={bl} />
              </div>

              {error && (
                <div className="rounded-lg p-3" style={{ background: 'var(--red-light)', fontSize: 13, color: 'var(--red)' }}>
                  {error}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <button type="submit" disabled={loading}
              style={{ padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)', background: loading ? 'var(--bg2)' : 'var(--accent)', color: loading ? 'var(--ink3)' : '#F5F0E8', transition: 'all 0.15s' }}>
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
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
