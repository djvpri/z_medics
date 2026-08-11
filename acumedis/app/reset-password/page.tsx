'use client'

import Link from 'next/link'
import { useT } from '@/contexts/LanguageContext'

export default function ResetPasswordPage() {
  const { lang, setLang } = useT()
  const id = lang === 'id'

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
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg>
          </div>
          <h1 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 26, color: 'var(--ink)', marginBottom: 4 }}>Z Medics</h1>
        </div>

        <div className="rounded-2xl p-7 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="var(--accent)" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg>
          </div>
          <h2 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 22, color: 'var(--ink)', marginBottom: 8 }}>
            {id ? 'Reset Password via Admin' : 'Password Reset via Admin'}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--ink3)', lineHeight: 1.7 }}>
            {id
              ? 'Reset password otomatis tidak tersedia di platform ini. Hubungi administrator Z Medics untuk set ulang password Anda.'
              : 'Automatic password reset is not available on this platform. Please contact the Z Medics administrator to reset your password.'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 18 }}>
            <Link href="/forgot-password" style={{ padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 500, border: '1px solid var(--border)', color: 'var(--ink2)', textDecoration: 'none' }}>
              {id ? 'Lupa Password' : 'Forgot Password'}
            </Link>
            <Link href="/login" style={{ padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 500, background: 'var(--accent)', color: '#F5F0E8', textDecoration: 'none' }}>
              {id ? 'Kembali ke Login' : 'Back to Login'}
            </Link>
          </div>
          {/* ponytail: reset otomatis butuh email provider + token flow; tak ada di stack sekarang */}
        </div>
      </div>
    </div>
  )
}
