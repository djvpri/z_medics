'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Clinic {
  id: string; name: string; clinic_name: string | null; city: string | null
  province: string | null; public_address: string | null; description: string | null
  specialty: string | null; phone_public: string | null; email: string; avatar_url?: string | null
  clinic_photos?: { id: string; url: string }[]
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

const inp: React.CSSProperties = {
  width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8,
  fontFamily: 'var(--font-dm-sans)', fontSize: 13.5, color: 'var(--ink)', background: 'var(--surface)', outline: 'none',
}

const TIMES = ['08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00','17:00']

export default function KlinikPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [clinic, setClinic] = useState<Clinic | null>(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ patient_name: '', patient_phone: '', patient_email: '', preferred_date: '', preferred_time: '', reason: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('practitioners')
        .select('id, name, clinic_name, city, province, public_address, description, specialty, phone_public, email, avatar_url, clinic_photos(id, url)')
        .eq('id', id)
        .eq('is_listed', true)
        .single()
      setClinic(data)
      setLoading(false)
    }
    load()
  }, [id])

  function set(k: string, v: string) { setForm(p => ({ ...p, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.patient_name || !form.patient_phone) return
    setSubmitting(true); setError('')
    try {
      const supabase = createClient()
      const { error: err } = await supabase.from('appointment_requests').insert({
        practitioner_id: id,
        patient_name: form.patient_name,
        patient_phone: form.patient_phone,
        patient_email: form.patient_email || null,
        preferred_date: form.preferred_date || null,
        preferred_time: form.preferred_time || null,
        reason: form.reason || null,
        status: 'pending',
      })
      if (err) throw err
      setSubmitted(true)
    } catch {
      setError('Gagal mengirim permintaan. Coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink3)', fontSize: 14 }}>
      Memuat profil klinik...
    </div>
  )

  if (!clinic) return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <p style={{ fontSize: 14, color: 'var(--ink3)' }}>Klinik tidak ditemukan atau tidak terdaftar di direktori.</p>
      <Link href="/find" style={{ color: 'var(--accent)', fontSize: 14 }}>← Kembali ke direktori</Link>
    </div>
  )

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{ background: 'var(--ink)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/find" style={{ color: 'rgba(245,240,232,0.6)', fontSize: 13, textDecoration: 'none' }}>← Direktori</Link>
        <div style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 18, color: '#F5F0E8' }}>Z Medics</div>
        <Link href="/login" style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, background: 'var(--accent)', color: '#F5F0E8', textDecoration: 'none' }}>
          Login Klinik
        </Link>
      </header>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 16px' }}>
        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>

          {/* Profil klinik */}
          <div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 24, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--accent)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {clinic.avatar_url
                    ? <img src={clinic.avatar_url} alt={clinic.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ color: '#F5F0E8', fontFamily: 'var(--font-dm-serif)', fontSize: 22 }}>{getInitials(clinic.name)}</span>}
                </div>
                <div>
                  <h1 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 20, color: 'var(--ink)', marginBottom: 2 }}>
                    {clinic.clinic_name ?? clinic.name}
                  </h1>
                  <p style={{ fontSize: 13, color: 'var(--ink3)' }}>{clinic.name}</p>
                </div>
              </div>

              {clinic.specialty && (
                <span style={{ display: 'inline-block', fontSize: 12, padding: '4px 12px', borderRadius: 20, background: 'var(--accent-light)', color: 'var(--accent)', marginBottom: 14 }}>
                  {clinic.specialty}
                </span>
              )}

              {clinic.description && (
                <p style={{ fontSize: 13.5, color: 'var(--ink2)', lineHeight: 1.7, marginBottom: 16 }}>{clinic.description}</p>
              )}

              {/* Galeri foto */}
              {clinic.clinic_photos && clinic.clinic_photos.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 11, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Foto Klinik</p>
                  <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                    {clinic.clinic_photos.map(photo => (
                      <a key={photo.id} href={photo.url} target="_blank" rel="noopener noreferrer"
                        style={{ flexShrink: 0, width: 130, height: 90, borderRadius: 10, overflow: 'hidden', display: 'block', border: '1px solid var(--border)', cursor: 'zoom-in' }}>
                        <img src={photo.url} alt="Foto klinik" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {clinic.public_address && (
                  <div style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--ink2)', alignItems: 'flex-start' }}>
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 1 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    {clinic.public_address}{clinic.city ? `, ${clinic.city}` : ''}{clinic.province ? `, ${clinic.province}` : ''}
                  </div>
                )}
                {clinic.phone_public && (
                  <div style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--ink2)', alignItems: 'center' }}>
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                    {clinic.phone_public}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form permintaan jadwal */}
          <div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 24 }}>
              {submitted ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="var(--accent)" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 18, color: 'var(--ink)', marginBottom: 8 }}>Permintaan Terkirim!</h3>
                  <p style={{ fontSize: 13, color: 'var(--ink3)', lineHeight: 1.6 }}>
                    Klinik akan menghubungi Anda di nomor <strong>{form.patient_phone}</strong> untuk konfirmasi jadwal.
                  </p>
                  <button onClick={() => setSubmitted(false)}
                    style={{ marginTop: 16, padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500, border: '1px solid var(--border)', background: 'transparent', color: 'var(--ink2)', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)' }}>
                    Minta Jadwal Lain
                  </button>
                </div>
              ) : (
                <>
                  <h2 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 17, color: 'var(--ink)', marginBottom: 4 }}>Minta Jadwal</h2>
                  <p style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 18 }}>Isi form di bawah, klinik akan menghubungi Anda untuk konfirmasi.</p>

                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--ink2)', marginBottom: 5 }}>
                        Nama Lengkap <span style={{ color: 'var(--red)' }}>*</span>
                      </label>
                      <input type="text" value={form.patient_name} onChange={e => set('patient_name', e.target.value)} required style={inp}
                        onFocus={e => (e.target.style.borderColor = 'var(--accent2)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--ink2)', marginBottom: 5 }}>
                        No. WhatsApp / Telepon <span style={{ color: 'var(--red)' }}>*</span>
                      </label>
                      <input type="tel" value={form.patient_phone} onChange={e => set('patient_phone', e.target.value)} placeholder="08xxxxxxxxxx" required style={inp}
                        onFocus={e => (e.target.style.borderColor = 'var(--accent2)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--ink2)', marginBottom: 5 }}>Email (opsional)</label>
                      <input type="email" value={form.patient_email} onChange={e => set('patient_email', e.target.value)} style={inp}
                        onFocus={e => (e.target.style.borderColor = 'var(--accent2)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--ink2)', marginBottom: 5 }}>Tanggal Pilihan</label>
                        <input type="date" value={form.preferred_date} onChange={e => set('preferred_date', e.target.value)} style={inp}
                          onFocus={e => (e.target.style.borderColor = 'var(--accent2)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--ink2)', marginBottom: 5 }}>Waktu Pilihan</label>
                        <select value={form.preferred_time} onChange={e => set('preferred_time', e.target.value)} style={{ ...inp, appearance: 'none' }}>
                          <option value="">Pilih...</option>
                          {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--ink2)', marginBottom: 5 }}>Keluhan / Alasan</label>
                      <textarea value={form.reason} onChange={e => set('reason', e.target.value)} rows={3}
                        placeholder="Ceritakan keluhan Anda..."
                        style={{ ...inp, resize: 'none' }}
                        onFocus={e => (e.target.style.borderColor = 'var(--accent2)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                    </div>

                    {error && <p style={{ fontSize: 13, color: 'var(--red)', background: 'var(--red-light)', padding: '8px 12px', borderRadius: 8 }}>{error}</p>}

                    <button type="submit" disabled={submitting || !form.patient_name || !form.patient_phone}
                      style={{ padding: '11px', borderRadius: 10, fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)', background: submitting ? 'var(--bg2)' : 'var(--accent)', color: submitting ? 'var(--ink3)' : '#F5F0E8', transition: 'all 0.15s' }}>
                      {submitting ? 'Mengirim...' : 'Kirim Permintaan Jadwal'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
