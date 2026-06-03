'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useT } from '@/contexts/LanguageContext'

export default function ResetPasswordPage() {
  const router = useRouter()
  const { lang } = useT()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)

  const id = lang === 'id'

  useEffect(() => {
    // Supabase mengirim session via hash fragment setelah klik link reset
    const supabase = createClient()
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError(id ? 'Password tidak cocok.' : 'Passwords do not match.'); return }
    if (password.length < 6) { setError(id ? 'Password minimal 6 karakter.' : 'Password must be at least 6 characters.'); return }
    setLoading(true); setError('')
    const supabase = createClient()
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (err) { setError(err.message); return }
    setDone(true)
    setTimeout(() => router.push('/dashboard'), 2000)
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10,
    fontFamily: 'var(--font-dm-sans)', fontSize: 14, color: 'var(--ink)', background: 'var(--surface)', outline: 'none',
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3" style={{ background: 'var(--ink)' }}>
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#F5F0E8" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg>
          </div>
          <h1 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 26, color: 'var(--ink)', marginBottom: 4 }}>Z Medics</h1>
        </div>

        <div className="rounded-2xl p-7 space-y-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
          {done ? (
            <div className="text-center space-y-3">
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="var(--accent)" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h2 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 20, color: 'var(--ink)' }}>
                {id ? 'Password Berhasil Diubah!' : 'Password Updated!'}
              </h2>
              <p style={{ fontSize: 13, color: 'var(--ink3)' }}>
                {id ? 'Mengalihkan ke dashboard...' : 'Redirecting to dashboard...'}
              </p>
            </div>
          ) : !ready ? (
            <div className="text-center space-y-3">
              <p style={{ fontSize: 14, color: 'var(--ink3)' }}>
                {id ? 'Memverifikasi link reset...' : 'Verifying reset link...'}
              </p>
              <p style={{ fontSize: 12, color: 'var(--ink3)' }}>
                {id ? 'Jika tidak berhasil, coba minta link reset baru.' : 'If this fails, try requesting a new reset link.'}
              </p>
              <Link href="/forgot-password" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none' }}>
                {id ? 'Minta link baru →' : 'Request new link →'}
              </Link>
            </div>
          ) : (
            <>
              <div>
                <h2 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 20, color: 'var(--ink)', marginBottom: 4 }}>
                  {id ? 'Buat Password Baru' : 'Create New Password'}
                </h2>
                <p style={{ fontSize: 13, color: 'var(--ink3)' }}>
                  {id ? 'Masukkan password baru untuk akun Anda.' : 'Enter a new password for your account.'}
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--ink2)', marginBottom: 6 }}>
                    {id ? 'Password Baru' : 'New Password'}
                  </label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 karakter" required style={inp}
                    onFocus={e => (e.target.style.borderColor = 'var(--accent2)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--ink2)', marginBottom: 6 }}>
                    {id ? 'Konfirmasi Password' : 'Confirm Password'}
                  </label>
                  <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required style={inp}
                    onFocus={e => (e.target.style.borderColor = 'var(--accent2)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                </div>
                {error && <div className="rounded-lg p-3" style={{ background: 'var(--red-light)', fontSize: 13, color: 'var(--red)' }}>{error}</div>}
                <button type="submit" disabled={loading} style={{ width: '100%', padding: '11px', borderRadius: 10, fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)', background: loading ? 'var(--bg2)' : 'var(--accent)', color: loading ? 'var(--ink3)' : '#F5F0E8', transition: 'all 0.15s' }}>
                  {loading ? (id ? 'Menyimpan...' : 'Saving...') : (id ? 'Simpan Password Baru' : 'Save New Password')}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
