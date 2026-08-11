'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Topbar from '@/components/layout/Topbar'
import { NewPatientForm } from '@/types'
import { useT } from '@/contexts/LanguageContext'
import AvatarUploader from '@/components/ui/AvatarUploader'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontFamily: 'var(--font-dm-sans)',
  fontSize: 13.5,
  color: 'var(--ink)',
  background: 'var(--surface)',
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--ink2)',
  letterSpacing: 0.3,
  marginBottom: 6,
  display: 'block',
}

export default function TambahPasienPage() {
  const router = useRouter()
  const { t } = useT()
  const [form, setForm] = useState<NewPatientForm>({ name: '', gender: undefined, birth_date: '', phone: '', email: '', address: '', avatar_url: '' })
  const [loading, setLoading] = useState(false)

  function set(field: keyof NewPatientForm, value: string) {
    setForm(prev => ({ ...prev, [field]: value || undefined }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          gender: form.gender,
          birth_date: form.birth_date || undefined,
          phone: form.phone,
          email: form.email,
          address: form.address,
        }),
      })
      if (!res.ok) {
        const b = await res.json().catch(() => ({}))
        throw new Error(b.error || 'Gagal menyimpan')
      }
      const patient = await res.json()
      if (form.avatar_url) {
        await fetch(`/api/patients/${patient.id}/avatar`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatarBase64: form.avatar_url.split(',')[1] }),
        })
      }
      router.push('/pasien')
    } catch (err) {
      alert((t as any).common?.saveFailed ?? 'Gagal menyimpan: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Topbar
        title={t.patient.newPatient}
        back="/pasien"
      />

      <div className="p-4 md:p-7">
        <form onSubmit={handleSubmit}>
          <div className="rounded-[18px] overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border2)' }}>
              <h2 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 16, color: 'var(--ink)' }}>{t.patient.patientInfo}</h2>
            </div>
            <div className="p-4 md:p-6">
              <div className="mb-5">
                <AvatarUploader
                  currentUrl={form.avatar_url || undefined}
                  name={form.name || '?'}
                  size={72}
                  filePrefix="patient"
                  onUpload={(url) => setForm(prev => ({ ...prev, avatar_url: url }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label style={labelStyle}>{t.patient.fullName} <span style={{ color: 'var(--red)' }}>*</span></label>
                  <input type="text" value={form.name} onChange={e => set('name', e.target.value)} required style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = 'var(--accent2)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                </div>

                <div className="col-span-2">
                  <label style={labelStyle}>{t.patient.gender}</label>
                  <div className="flex gap-2">
                    {(['male', 'female'] as const).map(g => (
                      <label key={g} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13.5, border: '1px solid', borderColor: form.gender === g ? 'var(--accent)' : 'var(--border)', background: form.gender === g ? 'var(--accent-light)' : 'var(--surface)', color: form.gender === g ? 'var(--accent)' : 'var(--ink2)', fontWeight: form.gender === g ? 500 : 400 }}>
                        <input type="radio" name="gender" value={g} checked={form.gender === g} onChange={() => set('gender', g)} className="sr-only" />
                        {g === 'male' ? t.patient.male : t.patient.female}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>{t.patient.birthDate}</label>
                  <input type="date" value={form.birth_date ?? ''} onChange={e => set('birth_date', e.target.value)} style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = 'var(--accent2)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                  />
                </div>

                <div>
                  <label style={labelStyle}>{t.patient.phone}</label>
                  <input type="tel" value={form.phone ?? ''} onChange={e => set('phone', e.target.value)} placeholder="08xxxxxxxxxx" style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = 'var(--accent2)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                  />
                </div>

                <div>
                  <label style={labelStyle}>{t.patient.email}</label>
                  <input type="email" value={form.email ?? ''} onChange={e => set('email', e.target.value)} placeholder="pasien@email.com" style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = 'var(--accent2)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                  />
                </div>

                <div className="col-span-2">
                  <label style={labelStyle}>{t.patient.address}</label>
                  <textarea
                    value={form.address ?? ''}
                    onChange={e => set('address', e.target.value)}
                    placeholder="Jl. ..."
                    rows={3}
                    style={{ ...inputStyle, resize: 'none' }}
                    onFocus={e => (e.target.style.borderColor = 'var(--accent2)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-4">
            <button type="submit" disabled={loading || !form.name.trim()} style={{
              padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              background: loading || !form.name.trim() ? 'var(--bg2)' : 'var(--accent)',
              color: loading || !form.name.trim() ? 'var(--ink3)' : '#F5F0E8',
              fontFamily: 'var(--font-dm-sans)',
              transition: 'all 0.15s',
            }}>
              {loading ? t.common.saving : t.patient.savePatient}
            </button>
            <Link href="/pasien" style={{ padding: '9px 16px', fontSize: 13, color: 'var(--ink2)', textDecoration: 'none', fontFamily: 'var(--font-dm-sans)' }}>
              {t.common.cancel}
            </Link>
          </div>
        </form>
      </div>
    </>
  )
}
