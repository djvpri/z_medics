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

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message === 'Invalid login credentials'
        ? 'Email atau password salah.'
        : authError.message)
      setLoading(false)
      return
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
            <h2 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 20, color: 'var(--ink)', marginBottom: 4 }}>Masuk</h2>
            <p style={{ fontSize: 13, color: 'var(--ink3)' }}>Masuk ke akun klinik Anda</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--ink2)', marginBottom: 6 }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="dokter@klinik.com"
                required
                autoComplete="email"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = 'var(--accent2)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink2)' }}>Password</label>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = 'var(--accent2)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            {error && (
              <div className="rounded-lg p-3" style={{ background: 'var(--red-light)', fontSize: 13, color: 'var(--red)' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '11px', borderRadius: 10, fontSize: 14, fontWeight: 500,
                border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                background: loading ? 'var(--bg2)' : 'var(--accent)',
                color: loading ? 'var(--ink3)' : '#F5F0E8',
                fontFamily: 'var(--font-dm-sans)', transition: 'all 0.15s',
              }}
            >
              {loading ? 'Masuk...' : 'Masuk'}
            </button>
          </form>

          <p className="text-center" style={{ fontSize: 13, color: 'var(--ink3)' }}>
            Belum punya akun?{' '}
            <Link href="/register" style={{ color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}>
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
