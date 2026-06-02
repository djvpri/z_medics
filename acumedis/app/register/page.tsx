'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useT } from '@/contexts/LanguageContext'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  border: '1px solid var(--border)', borderRadius: 10,
  fontFamily: 'var(--font-dm-sans)', fontSize: 14,
  color: 'var(--ink)', background: 'var(--surface)', outline: 'none',
  transition: 'border-color 0.15s',
}

export default function RegisterPage() {
  const router = useRouter()
  const { t, lang, setLang } = useT()
  const [form, setForm] = useState({ name: '', clinic_name: '', email: '', password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(k: string, v: string) { setForm(p => ({ ...p, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirmPassword) { setError(t.auth.passwordMismatch); return }
    if (form.password.length < 6) { setError(t.auth.passwordTooShort); return }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { name: form.name, clinic_name: form.clinic_name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (authError) { setError(authError.message); setLoading(false); return }
    if (data.user) {
      await supabase.from('practitioners').insert({
        id: data.user.id, name: form.name, email: form.email, clinic_name: form.clinic_name || null,
      })
    }
    router.push('/dashboard')
    router.refresh()
  }

  const fo = (e: React.FocusEvent<any>) => (e.target.style.borderColor = 'var(--accent2)')
  const bl = (e: React.FocusEvent<any>) => (e.target.style.borderColor = 'var(--border)')

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      {/* Language switcher */}
      <div style={{ position: 'fixed', top: 16, right: 16, display: 'flex', gap: 4, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 3 }}>
        {(['en', 'id'] as const).map(l => (
          <button key={l} onClick={() => setLang(l)} style={{ padding: '3px 10px', borderRadius: 5, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', background: lang === l ? 'var(--accent)' : 'transparent', color: lang === l ? '#F5F0E8' : 'var(--ink3)', fontFamily: 'var(--font-dm-sans)', transition: 'all 0.15s' }}>
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3" style={{ background: 'var(--ink)' }}>
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#F5F0E8" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
            </svg>
          </div>
          <h1 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 26, color: 'var(--ink)', marginBottom: 4 }}>Z Medics</h1>
          <p style={{ fontSize: 13, color: 'var(--ink3)' }}>
            {lang === 'id' ? 'Rekam Medis Akupuntur & TCM' : 'Acupuncture & TCM Medical Record'}
          </p>
        </div>

        <div className="rounded-2xl p-7 space-y-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 20, color: 'var(--ink)', marginBottom: 4 }}>{t.auth.registerTitle}</h2>
            <p style={{ fontSize: 13, color: 'var(--ink3)' }}>{t.auth.registerSubtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--ink2)', marginBottom: 6 }}>
                  {t.auth.doctorName} <span style={{ color: 'var(--red)' }}>*</span>
                </label>
                <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Dr. ..." required style={inputStyle} onFocus={fo} onBlur={bl} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--ink2)', marginBottom: 6 }}>{t.auth.clinicName}</label>
                <input type="text" value={form.clinic_name} onChange={e => set('clinic_name', e.target.value)} style={inputStyle} onFocus={fo} onBlur={bl} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--ink2)', marginBottom: 6 }}>
                {t.auth.email} <span style={{ color: 'var(--red)' }}>*</span>
              </label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="dokter@klinik.com" required autoComplete="email" style={inputStyle} onFocus={fo} onBlur={bl} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--ink2)', marginBottom: 6 }}>
                {t.auth.password} <span style={{ color: 'var(--red)' }}>*</span>
              </label>
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min. 6 karakter" required autoComplete="new-password" style={inputStyle} onFocus={fo} onBlur={bl} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--ink2)', marginBottom: 6 }}>
                {t.auth.confirmPassword} <span style={{ color: 'var(--red)' }}>*</span>
              </label>
              <input type="password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} required autoComplete="new-password" style={inputStyle} onFocus={fo} onBlur={bl} />
            </div>

            {error && (
              <div className="rounded-lg p-3" style={{ background: 'var(--red-light)', fontSize: 13, color: 'var(--red)' }}>{error}</div>
            )}

            <button type="submit" disabled={loading} style={{ width: '100%', padding: '11px', borderRadius: 10, fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer', background: loading ? 'var(--bg2)' : 'var(--accent)', color: loading ? 'var(--ink3)' : '#F5F0E8', fontFamily: 'var(--font-dm-sans)', transition: 'all 0.15s' }}>
              {loading ? t.auth.registering : t.auth.registerBtn}
            </button>
          </form>

          <p className="text-center" style={{ fontSize: 13, color: 'var(--ink3)' }}>
            {t.auth.hasAccount}{' '}
            <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}>{t.auth.signIn}</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
