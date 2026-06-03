import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function LandingPage() {
  // Jika sudah login, langsung ke dashboard
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) redirect('/dashboard')
  } catch {}

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', fontFamily: 'var(--font-dm-sans)' }}>

      {/* ── Navbar ── */}
      <nav style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 22, color: 'var(--ink)', letterSpacing: -0.5 }}>Z Medics</div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link href="/find" style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, color: 'var(--ink2)', textDecoration: 'none', border: '1px solid var(--border)' }}>
            Cari Klinik
          </Link>
          <Link href="/login" style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, background: 'var(--accent)', color: '#F5F0E8', textDecoration: 'none' }}>
            Login Klinik
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ textAlign: 'center', padding: '80px 24px 64px' }}>
        <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--accent)', background: 'var(--accent-light)', padding: '5px 14px', borderRadius: 20, marginBottom: 24 }}>
          Platform Rekam Medis Akupuntur & TCM
        </div>
        <h1 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 'clamp(30px, 6vw, 52px)', color: 'var(--ink)', lineHeight: 1.15, marginBottom: 20, maxWidth: 680, margin: '0 auto 20px' }}>
          Temukan Klinik Akupuntur & TCM Terpercaya
        </h1>
        <p style={{ fontSize: 16, color: 'var(--ink3)', lineHeight: 1.7, marginBottom: 36, maxWidth: 500, margin: '0 auto 36px' }}>
          Direktori klinik akupuntur dan TCM di seluruh Indonesia. Cari berdasarkan kota, baca profil, dan minta jadwal langsung.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/find" style={{ padding: '14px 32px', borderRadius: 10, fontSize: 15, fontWeight: 600, background: 'var(--accent)', color: '#F5F0E8', textDecoration: 'none' }}>
            Cari Klinik Terdekat →
          </Link>
          <Link href="/register" style={{ padding: '14px 32px', borderRadius: 10, fontSize: 15, fontWeight: 500, background: 'transparent', color: 'var(--ink2)', textDecoration: 'none', border: '1px solid var(--border)' }}>
            Daftarkan Klinik Saya
          </Link>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section style={{ background: 'var(--ink)', padding: '36px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 28, textAlign: 'center' }}>
          {[
            { value: '100%', label: 'Gratis untuk pasien' },
            { value: 'AI', label: 'Analisis foto lidah' },
            { value: 'TCM', label: 'Rekam medis digital' },
            { value: '🌿', label: 'Akupuntur & herbal' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 30, color: '#F5F0E8', marginBottom: 5 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'rgba(245,240,232,0.45)', letterSpacing: 0.5 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Cara kerja pasien ── */}
      <section style={{ padding: '72px 24px', maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 30, color: 'var(--ink)', textAlign: 'center', marginBottom: 8 }}>Cara Menemukan Klinik</h2>
        <p style={{ textAlign: 'center', color: 'var(--ink3)', fontSize: 14, marginBottom: 48 }}>3 langkah mudah untuk pasien</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
          {[
            { step: '01', title: 'Cari berdasarkan kota', desc: 'Filter klinik di provinsi atau kota kamu. Lihat alamat, spesialisasi, dan profil lengkap.' },
            { step: '02', title: 'Baca profil klinik', desc: 'Lihat deskripsi klinik, spesialisasi, alamat, dan nomor kontak praktisi.' },
            { step: '03', title: 'Minta jadwal', desc: 'Isi form permintaan. Klinik akan menghubungi kamu via WhatsApp untuk konfirmasi.' },
          ].map(item => (
            <div key={item.step} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '28px 22px' }}>
              <div style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 34, color: 'var(--accent)', opacity: 0.25, marginBottom: 10 }}>{item.step}</div>
              <h3 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 17, color: 'var(--ink)', marginBottom: 8 }}>{item.title}</h3>
              <p style={{ fontSize: 13.5, color: 'var(--ink3)', lineHeight: 1.65 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Untuk Praktisi ── */}
      <section style={{ background: 'var(--surface2)', padding: '72px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 48, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 14 }}>Untuk Praktisi</div>
            <h2 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 28, color: 'var(--ink)', marginBottom: 14, lineHeight: 1.25 }}>
              Kelola Klinik Lebih Cerdas dengan AI
            </h2>
            <p style={{ fontSize: 14, color: 'var(--ink3)', lineHeight: 1.7, marginBottom: 22 }}>
              Sistem rekam medis digital dengan analisis foto lidah Gemini Vision, rekomendasi titik akupuntur, SOAP Notes otomatis, dan booking online dari pasien.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 26px', display: 'flex', flexDirection: 'column', gap: 9 }}>
              {['Rekam medis pasien lengkap','Analisis foto lidah AI (Gemini Vision)','Rekomendasi titik akupuntur','SOAP Notes otomatis','Jadwal & manajemen pasien','Tampil di direktori klinik online'].map(f => (
                <li key={f} style={{ fontSize: 13.5, color: 'var(--ink2)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--accent)', fontWeight: 700, flexShrink: 0 }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/register" style={{ padding: '12px 28px', borderRadius: 10, fontSize: 14, fontWeight: 600, background: 'var(--accent)', color: '#F5F0E8', textDecoration: 'none', display: 'inline-block' }}>
              Daftar Gratis Sekarang →
            </Link>
          </div>

          {/* Mock dashboard preview */}
          <div style={{ background: 'var(--ink)', borderRadius: 18, padding: '24px 22px' }}>
            <div style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 17, color: '#F5F0E8', marginBottom: 18 }}>Dashboard Klinik</div>
            {[
              { label: 'Pasien Aktif', value: '84', badge: '+3 bulan ini' },
              { label: 'Sesi Hari Ini', value: '7', badge: '5 tersisa' },
              { label: 'Titik Terpopuler', value: 'GB20', badge: '24× digunakan' },
            ].map(item => (
              <div key={item.label} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 14px', marginBottom: 8 }}>
                <div style={{ fontSize: 10, color: 'rgba(245,240,232,0.35)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>{item.label}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 24, color: '#F5F0E8' }}>{item.value}</span>
                  <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: 'rgba(74,140,96,0.3)', color: '#7DC49A' }}>{item.badge}</span>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(74,140,96,0.15)', borderRadius: 10, fontSize: 12, color: '#7DC49A', lineHeight: 1.5 }}>
              🤖 AI: Pasien berikutnya memiliki riwayat 8 sesi — rekomendasikan GB20 + LI4
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Bottom ── */}
      <section style={{ textAlign: 'center', padding: '72px 24px' }}>
        <h2 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 28, color: 'var(--ink)', marginBottom: 12 }}>Mulai Sekarang, Gratis</h2>
        <p style={{ fontSize: 14, color: 'var(--ink3)', marginBottom: 32, maxWidth: 380, margin: '0 auto 32px' }}>
          Untuk praktisi akupuntur dan TCM yang ingin mengelola klinik lebih modern.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/find" style={{ padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 500, border: '1px solid var(--border)', color: 'var(--ink2)', textDecoration: 'none' }}>
            Cari Klinik
          </Link>
          <Link href="/register" style={{ padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 600, background: 'var(--accent)', color: '#F5F0E8', textDecoration: 'none' }}>
            Daftar sebagai Praktisi →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: 'var(--ink)', padding: '24px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 18, color: '#F5F0E8', marginBottom: 5 }}>Z Medics</div>
        <p style={{ fontSize: 11, color: 'rgba(245,240,232,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>Rekam Medis Akupuntur & TCM</p>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[{ label: 'Cari Klinik', href: '/find' },{ label: 'Login Klinik', href: '/login' },{ label: 'Daftar Klinik', href: '/register' }].map(l => (
            <Link key={l.href} href={l.href} style={{ fontSize: 12, color: 'rgba(245,240,232,0.4)', textDecoration: 'none' }}>{l.label}</Link>
          ))}
        </div>
      </footer>

    </div>
  )
}
