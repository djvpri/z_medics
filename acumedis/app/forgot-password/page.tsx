'use client'

import Link from 'next/link'
import { useT } from '@/contexts/LanguageContext'

export default function ForgotPasswordPage() {
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h1 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 26, color: 'var(--ink)', marginBottom: 4 }}>Z Medics</h1>
          <p style={{ fontSize: 13, color: 'var(--ink3)' }}>{id ? 'Rekam Medis Akupuntur & TCM' : 'Acupuncture & TCM Medical Record'}</p>
        </div>

        <div className="rounded-2xl p-7 space-y-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
          <div className="text-center">
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="var(--accent)" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
            </div>
            <h2 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 20, color: 'var(--ink)', marginBottom: 8 }}>
              {id ? 'Reset Password via Admin' : 'Password Reset via Admin'}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--ink3)', lineHeight: 1.7 }}>
              {id
                ? 'Reset password otomatis belum tersedia. Hubungi administrator Z Medics untuk mendapatkan password baru.'
                : 'Automatic password reset is not available yet. Please contact the Z Medics administrator for a new password.'}
            </p>
            <Link href="/login" style={{ display: 'inline-block', marginTop: 16, fontSize: 13, color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}>
              ← {id ? 'Kembali ke Login' : 'Back to Login'}
            </Link>
          </div>

          {/* ponytail: reset otomatis butuh provider email (SMTP/Resend) + token flow; tak ada di stack sekarang */}
        </div>
      </div>
    </div>
  )
}
