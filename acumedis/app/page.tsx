'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useT } from '@/contexts/LanguageContext'
import { createClient } from '@/lib/supabase/client'

export default function LandingPage() {
  const router = useRouter()
  const { lang, setLang } = useT()

  // Redirect ke dashboard jika sudah login
  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (user) router.push('/dashboard')
    })
  }, [])

  const id = lang === 'id'

  const copy = {
    nav: { find: id ? 'Cari Klinik' : 'Find Clinic', login: id ? 'Login Klinik' : 'Clinic Login' },
    badge: id ? 'Platform Rekam Medis Akupuntur & TCM' : 'Acupuncture & TCM Medical Record Platform',
    hero: id ? 'Temukan Klinik Akupuntur & TCM Terpercaya' : 'Find Trusted Acupuncture & TCM Clinics',
    heroSub: id
      ? 'Direktori klinik akupuntur dan TCM di seluruh Indonesia. Cari berdasarkan kota, baca profil, dan minta jadwal langsung.'
      : 'Directory of acupuncture and TCM clinics across Indonesia. Search by city, read profiles, and request appointments.',
    ctaFind: id ? 'Cari Klinik Terdekat →' : 'Find Nearest Clinic →',
    ctaRegister: id ? 'Daftarkan Klinik Saya' : 'Register My Clinic',
    stats: [
      { value: '100%', label: id ? 'Gratis untuk pasien' : 'Free for patients' },
      { value: 'AI', label: id ? 'Analisis foto lidah' : 'Tongue photo analysis' },
      { value: 'TCM', label: id ? 'Rekam medis digital' : 'Digital medical record' },
      { value: '🌿', label: id ? 'Akupuntur & herbal' : 'Acupuncture & herbal' },
    ],
    howTitle: id ? 'Cara Menemukan Klinik' : 'How to Find a Clinic',
    howSub: id ? '3 langkah mudah untuk pasien' : '3 easy steps for patients',
    steps: id ? [
      { step: '01', title: 'Cari berdasarkan kota', desc: 'Filter klinik di provinsi atau kota kamu. Lihat alamat, spesialisasi, dan profil lengkap.' },
      { step: '02', title: 'Baca profil klinik', desc: 'Lihat deskripsi klinik, spesialisasi, alamat, dan nomor kontak praktisi.' },
      { step: '03', title: 'Minta jadwal', desc: 'Isi form permintaan. Klinik akan menghubungi kamu via WhatsApp untuk konfirmasi.' },
    ] : [
      { step: '01', title: 'Search by city', desc: 'Filter clinics by province or city. View addresses, specializations, and full profiles.' },
      { step: '02', title: 'Read clinic profile', desc: 'View clinic description, specialization, address, and practitioner contact info.' },
      { step: '03', title: 'Request appointment', desc: 'Fill the request form. The clinic will contact you via WhatsApp to confirm.' },
    ],
    forPractitioner: id ? 'Untuk Praktisi' : 'For Practitioners',
    practTitle: id ? 'Kelola Klinik Lebih Cerdas dengan AI' : 'Manage Your Clinic Smarter with AI',
    practDesc: id
      ? 'Sistem rekam medis digital dengan analisis foto lidah Gemini Vision, rekomendasi titik akupuntur, SOAP Notes otomatis, dan booking online dari pasien.'
      : 'Digital medical records with Gemini Vision tongue photo analysis, acupuncture point recommendations, automatic SOAP Notes, and online patient booking.',
    features: id
      ? ['Rekam medis pasien lengkap','Analisis foto lidah AI (Gemini Vision)','Rekomendasi titik akupuntur','SOAP Notes otomatis','Jadwal & manajemen pasien','Tampil di direktori klinik online']
      : ['Complete patient medical records','AI tongue photo analysis (Gemini Vision)','Acupuncture point recommendations','Automatic SOAP Notes','Schedule & patient management','Listed in online clinic directory'],
    ctaRegister2: id ? 'Daftar Gratis Sekarang →' : 'Sign Up Free Now →',
    ctaTitle: id ? 'Mulai Sekarang, Gratis' : 'Get Started, Free',
    ctaDesc: id ? 'Untuk praktisi akupuntur dan TCM yang ingin mengelola klinik lebih modern.' : 'For acupuncture and TCM practitioners who want to manage their clinic more efficiently.',
    aiPreview: id ? '🤖 AI: Pasien berikutnya memiliki riwayat 8 sesi — rekomendasikan GB20 + LI4' : '🤖 AI: Next patient has 8 session history — recommend GB20 + LI4',
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', fontFamily: 'var(--font-dm-sans)' }}>

      {/* ── Navbar ── */}
      <nav style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 22, color: 'var(--ink)', letterSpacing: -0.5 }}>Z Medics</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Lang switcher */}
          <div style={{ display: 'flex', gap: 3, background: 'var(--bg2)', borderRadius: 8, padding: 3 }}>
            {(['en','id'] as const).map(l => (
              <button key={l} onClick={() => setLang(l)} style={{ padding: '4px 10px', borderRadius: 5, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', background: lang === l ? 'var(--accent)' : 'transparent', color: lang === l ? '#F5F0E8' : 'var(--ink3)', fontFamily: 'var(--font-dm-sans)', transition: 'all 0.15s' }}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <Link href="/find" style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, color: 'var(--ink2)', textDecoration: 'none', border: '1px solid var(--border)' }}>
            {copy.nav.find}
          </Link>
          <Link href="/login" style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, background: 'var(--accent)', color: '#F5F0E8', textDecoration: 'none' }}>
            {copy.nav.login}
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ textAlign: 'center', padding: '72px 24px 56px' }}>
        <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--accent)', background: 'var(--accent-light)', padding: '5px 14px', borderRadius: 20, marginBottom: 24 }}>
          {copy.badge}
        </div>
        <h1 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 'clamp(28px, 5vw, 50px)', color: 'var(--ink)', lineHeight: 1.15, marginBottom: 18, maxWidth: 680, margin: '0 auto 18px' }}>
          {copy.hero}
        </h1>
        <p style={{ fontSize: 15, color: 'var(--ink3)', lineHeight: 1.7, maxWidth: 500, margin: '0 auto 32px' }}>
          {copy.heroSub}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/find" style={{ padding: '13px 28px', borderRadius: 10, fontSize: 14, fontWeight: 600, background: 'var(--accent)', color: '#F5F0E8', textDecoration: 'none' }}>
            {copy.ctaFind}
          </Link>
          <Link href="/register" style={{ padding: '13px 28px', borderRadius: 10, fontSize: 14, fontWeight: 500, background: 'transparent', color: 'var(--ink2)', textDecoration: 'none', border: '1px solid var(--border)' }}>
            {copy.ctaRegister}
          </Link>
        </div>
      </section>

      {/* ── Stats ── */}
      <section style={{ background: 'var(--ink)', padding: '36px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 24, textAlign: 'center' }}>
          {copy.stats.map(s => (
            <div key={s.label}>
              <div style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 28, color: '#F5F0E8', marginBottom: 5 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'rgba(245,240,232,0.4)', letterSpacing: 0.5 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Cara kerja ── */}
      <section style={{ padding: '64px 24px', maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 28, color: 'var(--ink)', textAlign: 'center', marginBottom: 8 }}>{copy.howTitle}</h2>
        <p style={{ textAlign: 'center', color: 'var(--ink3)', fontSize: 14, marginBottom: 44 }}>{copy.howSub}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
          {copy.steps.map(item => (
            <div key={item.step} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '26px 20px' }}>
              <div style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 32, color: 'var(--accent)', opacity: 0.25, marginBottom: 10 }}>{item.step}</div>
              <h3 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 17, color: 'var(--ink)', marginBottom: 8 }}>{item.title}</h3>
              <p style={{ fontSize: 13.5, color: 'var(--ink3)', lineHeight: 1.65 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Untuk Praktisi ── */}
      <section style={{ background: 'var(--surface2)', padding: '64px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 44, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 14 }}>{copy.forPractitioner}</div>
            <h2 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 26, color: 'var(--ink)', marginBottom: 14, lineHeight: 1.25 }}>{copy.practTitle}</h2>
            <p style={{ fontSize: 14, color: 'var(--ink3)', lineHeight: 1.7, marginBottom: 20 }}>{copy.practDesc}</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 9 }}>
              {copy.features.map(f => (
                <li key={f} style={{ fontSize: 13.5, color: 'var(--ink2)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--accent)', fontWeight: 700, flexShrink: 0 }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/register" style={{ padding: '12px 26px', borderRadius: 10, fontSize: 14, fontWeight: 600, background: 'var(--accent)', color: '#F5F0E8', textDecoration: 'none', display: 'inline-block' }}>
              {copy.ctaRegister2}
            </Link>
          </div>
          <div style={{ background: 'var(--ink)', borderRadius: 18, padding: '22px 20px' }}>
            <div style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 16, color: '#F5F0E8', marginBottom: 16 }}>Dashboard</div>
            {[
              { label: id ? 'Pasien Aktif' : 'Active Patients', value: '84', badge: id ? '+3 bulan ini' : '+3 this month' },
              { label: id ? 'Sesi Hari Ini' : "Today's Sessions", value: '7', badge: id ? '5 tersisa' : '5 remaining' },
              { label: id ? 'Titik Terpopuler' : 'Top Point', value: 'GB20', badge: '24×' },
            ].map(item => (
              <div key={item.label} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 14px', marginBottom: 8 }}>
                <div style={{ fontSize: 10, color: 'rgba(245,240,232,0.35)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>{item.label}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 24, color: '#F5F0E8' }}>{item.value}</span>
                  <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: 'rgba(74,140,96,0.3)', color: '#7DC49A' }}>{item.badge}</span>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(74,140,96,0.15)', borderRadius: 10, fontSize: 11.5, color: '#7DC49A', lineHeight: 1.5 }}>
              {copy.aiPreview}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Bottom ── */}
      <section style={{ textAlign: 'center', padding: '64px 24px' }}>
        <h2 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 28, color: 'var(--ink)', marginBottom: 12 }}>{copy.ctaTitle}</h2>
        <p style={{ fontSize: 14, color: 'var(--ink3)', marginBottom: 30, maxWidth: 380, margin: '0 auto 30px' }}>{copy.ctaDesc}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/find" style={{ padding: '12px 22px', borderRadius: 10, fontSize: 14, fontWeight: 500, border: '1px solid var(--border)', color: 'var(--ink2)', textDecoration: 'none' }}>
            {copy.nav.find}
          </Link>
          <Link href="/register" style={{ padding: '12px 22px', borderRadius: 10, fontSize: 14, fontWeight: 600, background: 'var(--accent)', color: '#F5F0E8', textDecoration: 'none' }}>
            {copy.ctaRegister2}
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: 'var(--ink)', padding: '24px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 18, color: '#F5F0E8', marginBottom: 5 }}>Z Medics</div>
        <p style={{ fontSize: 11, color: 'rgba(245,240,232,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>
          {id ? 'Rekam Medis Akupuntur & TCM' : 'Acupuncture & TCM Medical Record'}
        </p>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { label: copy.nav.find, href: '/find' },
            { label: copy.nav.login, href: '/login' },
            { label: id ? 'Daftar Klinik' : 'Register Clinic', href: '/register' },
          ].map(l => (
            <Link key={l.href} href={l.href} style={{ fontSize: 12, color: 'rgba(245,240,232,0.4)', textDecoration: 'none' }}>{l.label}</Link>
          ))}
        </div>
      </footer>

    </div>
  )
}
