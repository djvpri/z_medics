'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useT } from '@/contexts/LanguageContext'

export default function ForgotPasswordPage() {
  const { lang, setLang } = useT()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const id = lang === 'id'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const supabase = createClient()
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setSent(true)
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10,
    fontFamily: 'var(--font-dm-sans)', fontSize: 14, color: 'var(--ink)', background: 'var(--surface)', outline: 'none',
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      {/* Lang switcher */}
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h1 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 26, color: 'var(--ink)', marginBottom: 4 }}>Z Medics</h1>
          <p style={{ fontSize: 13, color: 'var(--ink3)' }}>{id ? 'Rekam Medis Akupuntur & TCM' : 'Acupuncture & TCM Medical Record'}</p>
        </div>

        <div className="rounded-2xl p-7 space-y-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
          {sent ? (
            <div className="text-center space-y-4">
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="var(--accent)" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <h2 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 20, color: 'var(--ink)' }}>
                {id ? 'Email Terkirim!' : 'Email Sent!'}
              </h2>
              <p style={{ fontSize: 13, color: 'var(--ink3)', lineHeight: 1.6 }}>
                {id
                  ? `Link reset password telah dikirim ke ${email}. Cek inbox atau folder spam.`
                  : `Password reset link sent to ${email}. Check your inbox or spam folder.`}
              </p>
              <Link href="/login" style={{ display: 'inline-block', marginTop: 8, fontSize: 13, color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}>
                ← {id ? 'Kembali ke Login' : 'Back to Login'}
              </Link>
            </div>
          ) : (
            <>
              <div>
                <h2 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 20, color: 'var(--ink)', marginBottom: 4 }}>
                  {id ? 'Lupa Password' : 'Forgot Password'}
                </h2>
                <p style={{ fontSize: 13, color: 'var(--ink3)' }}>
                  {id ? 'Masukkan email Anda, kami akan kirim link reset password.' : 'Enter your email, we will send you a password reset link.'}
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--ink2)', marginBottom: 6 }}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="dokter@klinik.com" required autoComplete="email" style={inp}
                    onFocus={e => (e.target.style.borderColor = 'var(--accent2)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                </div>
                {error && <div className="rounded-lg p-3" style={{ background: 'var(--red-light)', fontSize: 13, color: 'var(--red)' }}>{error}</div>}
                <button type="submit" disabled={loading} style={{ width: '100%', padding: '11px', borderRadius: 10, fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)', background: loading ? 'var(--bg2)' : 'var(--accent)', color: loading ? 'var(--ink3)' : '#F5F0E8', transition: 'all 0.15s' }}>
                  {loading ? (id ? 'Mengirim...' : 'Sending...') : (id ? 'Kirim Link Reset' : 'Send Reset Link')}
                </button>
              </form>
              <p className="text-center" style={{ fontSize: 13, color: 'var(--ink3)' }}>
                <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}>
                  ← {id ? 'Kembali ke Login' : 'Back to Login'}
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
