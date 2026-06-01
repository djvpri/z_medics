'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  border: '1px solid var(--border)', borderRadius: 10,
  fontFamily: 'var(--font-dm-sans)', fontSize: 14,
  color: 'var(--ink)', background: 'var(--surface)', outline: 'none',
  transition: 'border-color 0.15s',
}

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', clinic_name: '', email: '', password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(k: string, v: string) { setForm(p => ({ ...p, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirmPassword) { setError('Password tidak cocok.'); return }
    if (form.password.length < 6) { setError('Password minimal 6 karakter.'); return }

    setLoading(true)
    setError('')

    const supabase = createClient()

    // 1. Daftar akun Supabase Auth
    const { data, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { name: form.name, clinic_name: form.clinic_name },
      },
    })

    if (authError) { setError(authError.message); setLoading(false); return }

    // 2. Buat record practitioner
    if (data.user) {
      await supabase.from('practitioners').insert({
        id: data.user.id,
        name: form.name,
        email: form.email,
        clinic_name: form.clinic_name || null,
      })
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3" style={{ background: 'var(--ink)' }}>
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#F5F0E8" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
            </svg>
          </div>
          <h1 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 26, color: 'var(--ink)', marginBottom: 4 }}>Z Medics</h1>
          <p style={{ fontSize: 13, color: 'var(--ink3)' }}>Rekam Medis Akupuntur & TCM</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-7 space-y-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 20, color: 'var(--ink)', marginBottom: 4 }}>Daftar Akun</h2>
            <p style={{ fontSize: 13, color: 'var(--ink3)' }}>Buat akun klinik baru</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--ink2)', marginBottom: 6 }}>
                  Nama Dokter <span style={{ color: 'var(--red)' }}>*</span>
                </label>
                <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Dr. ..." required style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = 'var(--accent2)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--ink2)', marginBottom: 6 }}>Nama Klinik</label>
                <input type="text" value={form.clinic_name} onChange={e => set('clinic_name', e.target.value)} placeholder="Klinik ..." style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = 'var(--accent2)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--ink2)', marginBottom: 6 }}>
                Email <span style={{ color: 'var(--red)' }}>*</span>
              </label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="dokter@klinik.com" required autoComplete="email" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = 'var(--accent2)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--ink2)', marginBottom: 6 }}>
                Password <span style={{ color: 'var(--red)' }}>*</span>
              </label>
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min. 6 karakter" required autoComplete="new-password" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = 'var(--accent2)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--ink2)', marginBottom: 6 }}>
                Konfirmasi Password <span style={{ color: 'var(--red)' }}>*</span>
              </label>
              <input type="password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} placeholder="Ulangi password" required autoComplete="new-password" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = 'var(--accent2)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
            </div>

            {error && (
              <div className="rounded-lg p-3" style={{ background: 'var(--red-light)', fontSize: 13, color: 'var(--red)' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '11px', borderRadius: 10, fontSize: 14, fontWeight: 500,
              border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              background: loading ? 'var(--bg2)' : 'var(--accent)',
              color: loading ? 'var(--ink3)' : '#F5F0E8',
              fontFamily: 'var(--font-dm-sans)', transition: 'all 0.15s',
            }}>
              {loading ? 'Mendaftar...' : 'Buat Akun'}
            </button>
          </form>

          <p className="text-center" style={{ fontSize: 13, color: 'var(--ink3)' }}>
            Sudah punya akun?{' '}
            <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}>Masuk</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
