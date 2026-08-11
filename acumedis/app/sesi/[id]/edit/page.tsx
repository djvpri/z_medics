'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Topbar from '@/components/layout/Topbar'
import { mockSessions, mockPatients } from '@/lib/mock-data'
import { TongueColor, TongueCoating, PulseQuality } from '@/types'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8,
  fontFamily: 'var(--font-dm-sans)', fontSize: 13.5, color: 'var(--ink)', background: 'var(--surface)', outline: 'none',
}
const selectStyle: React.CSSProperties = { ...inputStyle, appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%239C9389' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 32 }
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: 'var(--ink2)', letterSpacing: 0.3, marginBottom: 6, display: 'block' }

const TONGUE_COLORS = [{ value: 'pale', label: 'Pucat' }, { value: 'pale-red', label: 'Merah muda' }, { value: 'red', label: 'Merah' }, { value: 'dark-red', label: 'Merah gelap' }, { value: 'purple', label: 'Ungu' }]
const TONGUE_COATINGS = [{ value: 'none', label: 'Tidak ada' }, { value: 'thin-white', label: 'Putih tipis' }, { value: 'thick-white', label: 'Putih tebal' }, { value: 'thin-yellow', label: 'Kuning tipis' }, { value: 'thick-yellow', label: 'Kuning tebal' }]
const PULSE_QUALITIES = [{ value: 'wiry', label: 'Wiry (Xian)' }, { value: 'slippery', label: 'Slippery (Hua)' }, { value: 'weak', label: 'Lemah (Ruo)' }, { value: 'rapid', label: 'Cepat (Shu)' }, { value: 'slow', label: 'Lambat' }, { value: 'deep', label: 'Dalam' }, { value: 'floating', label: 'Mengambang' }]

export default function EditSesiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [form, setForm] = useState<any>({ chief_complaint: '', session_date: '', tongue_color: '', tongue_coating: '', pulse_quality: '', pain_scale: '', points_used: '', duration_minutes: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [patients, setPatients] = useState<{ id: string; name: string }[]>(mockPatients.map(p => ({ id: p.id, name: p.name })))

  useEffect(() => {
    async function load() {
      try {
        const [sesiRes, pRes] = await Promise.all([
          fetch(`/api/sessions/${id}`),
          fetch('/api/patients'),
        ])
        const sesi = sesiRes.ok ? await sesiRes.json() : null
        const pList = pRes.ok ? await pRes.json() : []
        if (Array.isArray(pList) && pList.length > 0) setPatients(pList.map((p: any) => ({ id: p.id, name: p.name })))
        if (sesi && sesi.id) {
          setForm({ ...sesi, patient_id: sesi.patient_id ?? '', points_used: sesi.points_used?.join(', ') ?? '', session_date: sesi.session_date?.slice(0, 16) ?? '' })
        } else {
          const mock = mockSessions.find(s => s.id === id)
          if (mock) setForm({ ...mock, points_used: mock.points_used?.join(', ') ?? '', session_date: mock.session_date?.slice(0, 16) ?? '' })
        }
      } catch {
        const mock = mockSessions.find(s => s.id === id)
        if (mock) setForm({ ...mock, points_used: mock.points_used?.join(', ') ?? '', session_date: mock.session_date?.slice(0, 16) ?? '' })
      } finally {
        setFetching(false)
      }
    }
    load()
  }, [id])

  function set(field: string, value: any) {
    setForm((prev: any) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const points = form.points_used ? form.points_used.split(',').map((p: string) => p.trim()).filter(Boolean) : []
    const res = await fetch(`/api/sessions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_id: form.patient_id || null,
        session_date: form.session_date,
        chief_complaint: form.chief_complaint,
        tongue_color: form.tongue_color || null,
        tongue_coating: form.tongue_coating || null,
        pulse_quality: form.pulse_quality || null,
        pain_scale: form.pain_scale ? Number(form.pain_scale) : null,
        points_used: points,
        duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
        notes: form.notes || null,
        tcm_diagnosis: form.tcm_diagnosis || null,
        fee: form.fee ? Number(form.fee) : null,
        payment_status: form.payment_status || null,
      }),
    })
    setLoading(false)
    if (!res.ok) { alert('Gagal menyimpan sesi'); return }
    router.push(`/sesi/${id}`)
    router.refresh()
  }

  if (fetching) {
    return (
      <>
        <Topbar title="Edit Sesi" back={`/sesi/${id}`} />
        <div className="p-4 md:p-7 text-center" style={{ color: 'var(--ink3)', fontSize: 13 }}>Memuat data...</div>
      </>
    )
  }

  const fo = (e: React.FocusEvent<any>) => (e.target.style.borderColor = 'var(--accent2)')
  const bl = (e: React.FocusEvent<any>) => (e.target.style.borderColor = 'var(--border)')

  return (
    <>
      <Topbar title="Edit Sesi" back={`/sesi/${id}`} />
      <div className="p-4 md:p-7">
        <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">

          <div className="rounded-[18px] overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border2)' }}>
              <h2 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 16, color: 'var(--ink)' }}>Informasi Sesi</h2>
            </div>
            <div className="p-4 md:p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle}>Pasien</label>
                  <select value={form.patient_id ?? ''} onChange={e => set('patient_id', e.target.value)} style={selectStyle} onFocus={fo} onBlur={bl}>
                    <option value="">Pilih pasien...</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Tanggal & waktu</label>
                  <input type="datetime-local" value={form.session_date} onChange={e => set('session_date', e.target.value)} style={inputStyle} onFocus={fo} onBlur={bl} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Keluhan Utama <span style={{ color: 'var(--red)' }}>*</span></label>
                <input type="text" value={form.chief_complaint} onChange={e => set('chief_complaint', e.target.value)} required style={inputStyle} onFocus={fo} onBlur={bl} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label style={labelStyle}>Warna Lidah</label>
                  <select value={form.tongue_color ?? ''} onChange={e => set('tongue_color', e.target.value)} style={selectStyle} onFocus={fo} onBlur={bl}>
                    <option value="">Pilih...</option>
                    {TONGUE_COLORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Selaput Lidah</label>
                  <select value={form.tongue_coating ?? ''} onChange={e => set('tongue_coating', e.target.value)} style={selectStyle} onFocus={fo} onBlur={bl}>
                    <option value="">Pilih...</option>
                    {TONGUE_COATINGS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Kualitas Nadi</label>
                  <select value={form.pulse_quality ?? ''} onChange={e => set('pulse_quality', e.target.value)} style={selectStyle} onFocus={fo} onBlur={bl}>
                    <option value="">Pilih...</option>
                    {PULSE_QUALITIES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle}>Skala Nyeri (1–10)</label>
                  <input type="number" min={1} max={10} value={form.pain_scale ?? ''} onChange={e => set('pain_scale', e.target.value)} style={inputStyle} onFocus={fo} onBlur={bl} />
                </div>
                <div>
                  <label style={labelStyle}>Durasi (menit)</label>
                  <input type="number" min={5} max={180} value={form.duration_minutes ?? ''} onChange={e => set('duration_minutes', e.target.value)} style={inputStyle} onFocus={fo} onBlur={bl} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Titik Akupuntur (pisah koma)</label>
                <input type="text" value={form.points_used} onChange={e => set('points_used', e.target.value)} placeholder="GB20, LI4, ST36" style={inputStyle} onFocus={fo} onBlur={bl} />
              </div>

              <div>
                <label style={labelStyle}>Diagnosis TCM</label>
                <input type="text" value={form.tcm_diagnosis ?? ''} onChange={e => set('tcm_diagnosis', e.target.value)} style={inputStyle} onFocus={fo} onBlur={bl} />
              </div>

              <div>
                <label style={labelStyle}>Catatan Klinis</label>
                <textarea value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} rows={3} style={{ ...inputStyle, resize: 'none' }} onFocus={fo} onBlur={bl} />
              </div>

              <div style={{ paddingTop: 16, borderTop: '1px solid var(--border2)' }}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={labelStyle}>Biaya Terapi (Rp)</label>
                    <input type="number" min={0} step={1000} value={form.fee ?? ''} onChange={e => set('fee', e.target.value)} placeholder="150000" style={inputStyle} onFocus={fo} onBlur={bl} />
                  </div>
                  <div>
                    <label style={labelStyle}>Status Pembayaran</label>
                    <div className="flex gap-1.5">
                      {([['paid', 'Lunas'], ['unpaid', 'Belum'], ['partial', 'Sebagian']] as const).map(([val, label]) => {
                        const active = form.payment_status === val
                        const colors: Record<string, string> = { paid: 'var(--accent)', unpaid: 'var(--red)', partial: 'var(--gold)' }
                        return (
                          <button key={val} type="button" onClick={() => set('payment_status', val)}
                            style={{ flex: 1, padding: '8px 4px', borderRadius: 8, fontSize: 12, fontWeight: active ? 600 : 400, cursor: 'pointer', border: '1px solid', transition: 'all 0.15s', fontFamily: 'var(--font-dm-sans)', borderColor: active ? colors[val] : 'var(--border)', background: active ? (val === 'paid' ? 'var(--accent-light)' : val === 'unpaid' ? 'var(--red-light)' : 'var(--gold-light)') : 'transparent', color: active ? colors[val] : 'var(--ink3)' }}>
                            {label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" disabled={loading} style={{ padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', background: loading ? 'var(--bg2)' : 'var(--accent)', color: loading ? 'var(--ink3)' : '#F5F0E8', fontFamily: 'var(--font-dm-sans)', transition: 'all 0.15s' }}>
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
            <Link href={`/sesi/${id}`} style={{ padding: '9px 16px', fontSize: 13, color: 'var(--ink2)', textDecoration: 'none', fontFamily: 'var(--font-dm-sans)' }}>Batal</Link>
          </div>
        </form>
      </div>
    </>
  )
}
