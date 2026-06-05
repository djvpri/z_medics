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
    badge: id ? 'Platform Rekam Medis Akupuntur & TCM Global' : 'Global Acupuncture & TCM Medical Record Platform',
    hero: id ? 'Temukan Klinik Akupuntur & TCM Terpercaya di Seluruh Dunia' : 'Find Trusted Acupuncture & TCM Clinics Worldwide',
    heroSub: id
      ? 'Direktori klinik akupuntur dan TCM dari berbagai negara. Cari berdasarkan negara dan kota, baca profil, dan minta jadwal langsung.'
      : 'Directory of acupuncture and TCM clinics from around the world. Search by country and city, read profiles, and request appointments.',
    ctaFind: id ? 'Cari Klinik Terdekat →' : 'Find Nearest Clinic →',
    ctaRegister: id ? 'Daftarkan Klinik Saya' : 'Register My Clinic',
    stats: [
      { value: '100%', label: id ? 'Gratis untuk pasien' : 'Free for patients' },
      { value: 'AI', label: id ? 'Analisis foto lidah' : 'Tongue photo analysis' },
      { value: 'TCM', label: id ? 'Rekam medis digital' : 'Digital medical record' },
      { value: '🌍', label: id ? 'Multi-negara & mata uang' : 'Multi-country & currency' },
    ],
    howTitle: id ? 'Cara Menemukan Klinik' : 'How to Find a Clinic',
    howSub: id ? '3 langkah mudah untuk pasien di seluruh dunia' : '3 easy steps for patients worldwide',
    steps: id ? [
      { step: '01', title: 'Cari berdasarkan negara & kota', desc: 'Filter klinik berdasarkan negara dan kota. Lihat alamat, spesialisasi, dan profil lengkap.' },
      { step: '02', title: 'Baca profil klinik', desc: 'Lihat deskripsi klinik, spesialisasi, alamat, dan nomor kontak praktisi.' },
      { step: '03', title: 'Minta jadwal', desc: 'Isi form permintaan. Klinik akan menghubungi kamu untuk konfirmasi.' },
    ] : [
      { step: '01', title: 'Search by country & city', desc: 'Filter clinics by country and city. View addresses, specializations, and full profiles.' },
      { step: '02', title: 'Read clinic profile', desc: 'View clinic description, specialization, address, and practitioner contact info.' },
      { step: '03', title: 'Request appointment', desc: 'Fill the request form. The clinic will contact you to confirm.' },
    ],
    forPractitioner: id ? 'Untuk Praktisi' : 'For Practitioners',
    practTitle: id ? 'Kelola Klinik Lebih Cerdas dengan AI' : 'Manage Your Clinic Smarter with AI',
    practDesc: id
      ? 'Sistem rekam medis digital dengan analisis foto lidah AI, rekomendasi titik akupuntur, SOAP Notes otomatis, multi-mata uang, dan booking online dari pasien.'
      : 'Digital medical records with AI tongue photo analysis, acupuncture point recommendations, automatic SOAP Notes, multi-currency support, and online patient booking.',
    features: id
      ? ['Rekam medis pasien lengkap','Analisis foto lidah AI','Rekomendasi titik akupuntur','SOAP Notes otomatis','Jadwal & manajemen pasien','Multi-mata uang (IDR, USD, MYR, SGD, dll)','Tampil di direktori klinik global']
      : ['Complete patient medical records','AI tongue photo analysis','Acupuncture point recommendations','Automatic SOAP Notes','Schedule & patient management','Multi-currency (IDR, USD, MYR, SGD, etc.)','Listed in global clinic directory'],
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

      {/* ── Kontak ── */}
      <section style={{ background: 'var(--surface2)', borderTop: '1px solid var(--border)', padding: '64px 24px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 14 }}>
            {id ? 'Hubungi Kami' : 'Contact Us'}
          </div>
          <h2 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 26, color: 'var(--ink)', marginBottom: 10 }}>
            {id ? 'Ada pertanyaan? Kami siap membantu.' : 'Have questions? We\'re here to help.'}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--ink3)', lineHeight: 1.7, marginBottom: 36 }}>
            {id
              ? 'Untuk informasi lebih lanjut tentang Z Medics, kerja sama, atau pendaftaran klinik, jangan ragu untuk menghubungi kami.'
              : 'For more information about Z Medics, partnerships, or clinic registration, feel free to reach out to us.'}
          </p>

          {/* Contact cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginBottom: 32 }}>
            {/* WhatsApp */}
            <a href="https://wa.me/6282153533164" target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '20px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, textDecoration: 'none', transition: 'box-shadow 0.15s' }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-lg)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.boxShadow = 'none')}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#E8F5EC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#25D366">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>WhatsApp</div>
                <div style={{ fontSize: 12, color: 'var(--ink3)' }}>+62 821-5353-3164</div>
              </div>
            </a>

            {/* Email */}
            <a href="mailto:sentarummedia@gmail.com"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '20px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, textDecoration: 'none', transition: 'box-shadow 0.15s' }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-lg)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.boxShadow = 'none')}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="var(--accent)" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>Email</div>
                <div style={{ fontSize: 11.5, color: 'var(--ink3)' }}>sentarummedia@gmail.com</div>
              </div>
            </a>

            {/* LinkedIn */}
            <a href="https://www.linkedin.com/in/muhammad-andi-juprianto-s-pd-mm-380745192" target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '20px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, textDecoration: 'none', transition: 'box-shadow 0.15s' }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-lg)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.boxShadow = 'none')}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#E8F0F8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#0A66C2">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>LinkedIn</div>
                <div style={{ fontSize: 11.5, color: 'var(--ink3)', lineHeight: 1.4 }}>Muhammad Andi Juprianto, S.Pd., MM.</div>
              </div>
            </a>
          </div>

          {/* WA CTA button */}
          <a href="https://wa.me/6282153533164?text=Halo%2C%20saya%20tertarik%20dengan%20Z%20Medics" target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', borderRadius: 10, fontSize: 14, fontWeight: 600, background: '#25D366', color: '#fff', textDecoration: 'none' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            {id ? 'Chat WhatsApp Sekarang' : 'Chat on WhatsApp Now'}
          </a>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: 'var(--ink)', padding: '28px 24px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 18, color: '#F5F0E8', marginBottom: 5 }}>Z Medics</div>
        <p style={{ fontSize: 11, color: 'rgba(245,240,232,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>
          {id ? 'Rekam Medis Akupuntur & TCM' : 'Acupuncture & TCM Medical Record'}
        </p>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
          {[
            { label: copy.nav.find, href: '/find' },
            { label: copy.nav.login, href: '/login' },
            { label: id ? 'Daftar Klinik' : 'Register Clinic', href: '/register' },
          ].map(l => (
            <Link key={l.href} href={l.href} style={{ fontSize: 12, color: 'rgba(245,240,232,0.4)', textDecoration: 'none' }}>{l.label}</Link>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="https://wa.me/6282153533164" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'rgba(245,240,232,0.35)', textDecoration: 'none' }}>WhatsApp</a>
          <a href="mailto:sentarummedia@gmail.com" style={{ fontSize: 12, color: 'rgba(245,240,232,0.35)', textDecoration: 'none' }}>Email</a>
          <a href="https://www.linkedin.com/in/muhammad-andi-juprianto-s-pd-mm-380745192" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'rgba(245,240,232,0.35)', textDecoration: 'none' }}>LinkedIn</a>
        </div>
      </footer>

    </div>
  )
}
