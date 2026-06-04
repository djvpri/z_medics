'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Topbar from '@/components/layout/Topbar'
import { createClient } from '@/lib/supabase/client'
import { useT } from '@/contexts/LanguageContext'

interface Request {
  id: string
  patient_name: string
  patient_phone: string
  patient_email: string | null
  preferred_date: string | null
  preferred_time: string | null
  reason: string | null
  status: 'pending' | 'confirmed' | 'declined'
  notes: string | null
  created_at: string
}

interface ScheduleForm {
  date: string
  time: string
  duration: number
  notes: string
}

const STATUS = {
  pending:   { label: 'Menunggu',     en: 'Pending',   bg: 'var(--gold-light)',   color: 'var(--gold)' },
  confirmed: { label: 'Dikonfirmasi', en: 'Confirmed', bg: 'var(--accent-light)', color: 'var(--accent)' },
  declined:  { label: 'Ditolak',      en: 'Declined',  bg: 'var(--red-light)',    color: 'var(--red)' },
}

const inp: React.CSSProperties = {
  width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 7,
  fontFamily: 'var(--font-dm-sans)', fontSize: 13, color: 'var(--ink)', background: 'var(--bg)', outline: 'none',
}

export default function PermintaanPage() {
  const { lang } = useT()
  const id = lang === 'id'
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'declined'>('pending')
  const [actionId, setActionId] = useState<string | null>(null)

  // State untuk form jadwal inline per request
  const [schedulingId, setSchedulingId] = useState<string | null>(null)
  const [schedForm, setSchedForm] = useState<ScheduleForm>({ date: '', time: '', duration: 45, notes: '' })

  async function load() {
    const supabase = createClient()
    const query = supabase.from('appointment_requests').select('*').order('created_at', { ascending: false })
    const { data } = filter === 'all' ? await query : await query.eq('status', filter)
    setRequests(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [filter])

  function openScheduleForm(req: Request) {
    // Pre-fill dengan preferensi pasien
    const pad = (n: number) => String(n).padStart(2, '0')
    const defaultDate = req.preferred_date ?? (() => {
      const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
    })()
    setSchedForm({
      date: defaultDate,
      time: req.preferred_time ?? '09:00',
      duration: 45,
      notes: '',
    })
    setSchedulingId(req.id)
  }

  async function confirmWithSchedule(req: Request) {
    setActionId(req.id)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Cari patient_id berdasarkan nomor telepon
    const { data: patient } = await supabase
      .from('patients').select('id')
      .ilike('phone', `%${req.patient_phone}%`)
      .limit(1).single()

    const scheduledAt = new Date(`${schedForm.date}T${schedForm.time}`).toISOString()

    // Buat appointment — pakai patient_id jika ada, fallback ke data eksternal
    await supabase.from('appointments').insert({
      practitioner_id: user.id,
      patient_id: patient?.id ?? null,
      scheduled_at: scheduledAt,
      reason: req.reason,
      status: 'scheduled',
      duration_minutes: schedForm.duration,
      notes: schedForm.notes || null,
      // Simpan data pasien eksternal jika belum terdaftar
      ...(patient?.id ? {} : {
        external_name: req.patient_name,
        external_phone: req.patient_phone,
      }),
    })

    // Update status request
    await supabase.from('appointment_requests')
      .update({ status: 'confirmed', notes: schedForm.notes || null })
      .eq('id', req.id)

    setSchedulingId(null)
    await load()
    setActionId(null)
  }

  async function declineRequest(reqId: string) {
    setActionId(reqId)
    const supabase = createClient()
    await supabase.from('appointment_requests').update({ status: 'declined' }).eq('id', reqId)
    await load()
    setActionId(null)
  }

  const filtered = requests.filter(r => filter === 'all' || r.status === filter)
  const pendingCount = requests.filter(r => r.status === 'pending').length

  function fmtDate(s: string) {
    return new Date(s).toLocaleDateString(id ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <>
      <Topbar
        title={id ? 'Permintaan Jadwal' : 'Appointment Requests'}
        subtitle={pendingCount > 0 ? `${pendingCount} ${id ? 'menunggu konfirmasi' : 'awaiting confirmation'}` : undefined}
        back="/jadwal"
      />

      <div className="p-4 md:p-7 space-y-4">
        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(['pending', 'confirmed', 'declined', 'all'] as const).map(f => (
            <button key={f} onClick={() => { setFilter(f); setSchedulingId(null) }}
              style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)', transition: 'all 0.15s', background: filter === f ? 'var(--accent)' : 'var(--surface)', color: filter === f ? '#F5F0E8' : 'var(--ink2)', boxShadow: filter === f ? 'none' : '0 1px 3px rgba(0,0,0,0.06)' }}>
              {f === 'all' ? (id ? 'Semua' : 'All') :
               f === 'pending' ? `${id ? 'Menunggu' : 'Pending'} (${requests.filter(r => r.status === 'pending').length})` :
               f === 'confirmed' ? (id ? 'Dikonfirmasi' : 'Confirmed') : (id ? 'Ditolak' : 'Declined')}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--ink3)', fontSize: 13 }}>{id ? 'Memuat...' : 'Loading...'}</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontSize: 14, color: 'var(--ink3)' }}>{id ? 'Tidak ada permintaan.' : 'No requests found.'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(req => {
              const st = STATUS[req.status]
              const isLoading = actionId === req.id
              const isScheduling = schedulingId === req.id

              return (
                <div key={req.id} className="rounded-[18px]" style={{ background: 'var(--surface)', border: `1px solid ${isScheduling ? 'var(--accent)' : 'var(--border)'}`, overflow: 'hidden', transition: 'border-color 0.2s' }}>
                  <div className="p-5">
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        {/* Nama + status */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <span style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 17, color: 'var(--ink)' }}>{req.patient_name}</span>
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: st.bg, color: st.color }}>
                            {id ? st.label : st.en}
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', fontSize: 13, color: 'var(--ink3)' }}>
                          <span>📞 {req.patient_phone}</span>
                          {req.patient_email && <span>✉️ {req.patient_email}</span>}
                          {req.preferred_date && (
                            <span>📅 {id ? 'Pilihan pasien:' : 'Patient prefers:'} {fmtDate(req.preferred_date)}{req.preferred_time ? ` ${req.preferred_time}` : ''}</span>
                          )}
                        </div>

                        {req.reason && (
                          <p style={{ marginTop: 8, fontSize: 13.5, color: 'var(--ink2)', lineHeight: 1.5 }}>💬 {req.reason}</p>
                        )}

                        <p style={{ marginTop: 6, fontSize: 11, color: 'var(--ink3)' }}>
                          {id ? 'Diterima' : 'Received'} {fmtDate(req.created_at)}
                        </p>
                      </div>

                      {/* Actions — pending */}
                      {req.status === 'pending' && !isScheduling && (
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                          <button onClick={() => openScheduleForm(req)} disabled={isLoading}
                            style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)', background: 'var(--accent)', color: '#F5F0E8' }}>
                            {id ? '✓ Konfirmasi & Atur Jadwal' : '✓ Confirm & Schedule'}
                          </button>
                          <button onClick={() => declineRequest(req.id)} disabled={isLoading}
                            style={{ padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)', background: 'transparent', color: 'var(--red)' }}>
                            {id ? 'Tolak' : 'Decline'}
                          </button>
                        </div>
                      )}

                      {req.status === 'confirmed' && (
                        <Link href="/jadwal" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
                          {id ? 'Lihat jadwal →' : 'View schedule →'}
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* ── Form penyesuaian jadwal (inline, muncul saat klik Konfirmasi) ── */}
                  {isScheduling && (
                    <div style={{ borderTop: '1px solid var(--border)', background: 'var(--surface2)', padding: '20px 20px 24px' }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
                        {id ? 'Sesuaikan Jadwal' : 'Adjust Schedule'}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                        <div>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--ink3)', marginBottom: 5 }}>{id ? 'Tanggal' : 'Date'}</label>
                          <input type="date" value={schedForm.date} onChange={e => setSchedForm(p => ({ ...p, date: e.target.value }))} style={inp}
                            onFocus={e => (e.target.style.borderColor = 'var(--accent2)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--ink3)', marginBottom: 5 }}>{id ? 'Jam' : 'Time'}</label>
                          <input type="time" value={schedForm.time} onChange={e => setSchedForm(p => ({ ...p, time: e.target.value }))} style={inp}
                            onFocus={e => (e.target.style.borderColor = 'var(--accent2)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--ink3)', marginBottom: 5 }}>{id ? 'Durasi' : 'Duration'}</label>
                          <select value={schedForm.duration} onChange={e => setSchedForm(p => ({ ...p, duration: Number(e.target.value) }))}
                            style={{ ...inp, appearance: 'none' }}>
                            {[30, 45, 60, 90].map(d => <option key={d} value={d}>{d} {id ? 'menit' : 'min'}</option>)}
                          </select>
                        </div>
                      </div>

                      <div style={{ marginBottom: 14 }}>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--ink3)', marginBottom: 5 }}>{id ? 'Catatan untuk pasien (opsional)' : 'Note for patient (optional)'}</label>
                        <input type="text" value={schedForm.notes} onChange={e => setSchedForm(p => ({ ...p, notes: e.target.value }))}
                          placeholder={id ? 'Contoh: Harap datang 10 menit lebih awal' : 'E.g. Please arrive 10 minutes early'}
                          style={inp} onFocus={e => (e.target.style.borderColor = 'var(--accent2)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                      </div>

                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => confirmWithSchedule(req)} disabled={isLoading || !schedForm.date || !schedForm.time}
                          style={{ padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)', background: 'var(--accent)', color: '#F5F0E8', opacity: isLoading ? 0.7 : 1 }}>
                          {isLoading ? '...' : (id ? '✓ Simpan & Konfirmasi' : '✓ Save & Confirm')}
                        </button>
                        <button onClick={() => setSchedulingId(null)}
                          style={{ padding: '9px 14px', borderRadius: 8, fontSize: 13, border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)', background: 'transparent', color: 'var(--ink2)' }}>
                          {id ? 'Batal' : 'Cancel'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
