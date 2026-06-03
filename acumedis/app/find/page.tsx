'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const PROVINCES = [
  'Aceh','Sumatera Utara','Sumatera Barat','Riau','Jambi','Sumatera Selatan',
  'Bengkulu','Lampung','Kepulauan Bangka Belitung','Kepulauan Riau',
  'DKI Jakarta','Jawa Barat','Jawa Tengah','DI Yogyakarta','Jawa Timur',
  'Banten','Bali','Nusa Tenggara Barat','Nusa Tenggara Timur',
  'Kalimantan Barat','Kalimantan Tengah','Kalimantan Selatan','Kalimantan Timur','Kalimantan Utara',
  'Sulawesi Utara','Sulawesi Tengah','Sulawesi Selatan','Sulawesi Tenggara','Gorontalo','Sulawesi Barat',
  'Maluku','Maluku Utara','Papua Barat','Papua',
]

interface Clinic {
  id: string
  name: string
  clinic_name: string | null
  city: string | null
  province: string | null
  public_address: string | null
  description: string | null
  specialty: string | null
  phone_public: string | null
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

export default function FindPage() {
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [filtered, setFiltered] = useState<Clinic[]>([])
  const [province, setProvince] = useState('')
  const [city, setCity] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('practitioners')
        .select('id, name, clinic_name, city, province, public_address, description, specialty, phone_public')
        .eq('is_listed', true)
        .order('name')
      setClinics(data ?? [])
      setFiltered(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    let result = clinics
    if (province) result = result.filter(c => c.province === province)
    if (city) result = result.filter(c => c.city?.toLowerCase().includes(city.toLowerCase()))
    if (search) result = result.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.clinic_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.specialty?.toLowerCase().includes(search.toLowerCase())
    )
    setFiltered(result)
  }, [province, city, search, clinics])

  const inp: React.CSSProperties = {
    padding: '9px 12px', border: '1px solid #e0dbd4', borderRadius: 8,
    fontFamily: 'var(--font-dm-sans)', fontSize: 13.5, color: 'var(--ink)',
    background: 'var(--surface)', outline: 'none',
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{ background: 'var(--ink)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 22, color: '#F5F0E8', letterSpacing: -0.5 }}>Z Medics</div>
          <div style={{ fontSize: 10, color: 'rgba(245,240,232,0.4)', letterSpacing: 2, textTransform: 'uppercase' }}>Temukan Klinik</div>
        </div>
        <Link href="/login" style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, background: 'var(--accent)', color: '#F5F0E8', textDecoration: 'none' }}>
          Login Klinik
        </Link>
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 34, color: 'var(--ink)', marginBottom: 10 }}>
            Temukan Klinik Akupuntur & TCM
          </h1>
          <p style={{ fontSize: 15, color: 'var(--ink3)', maxWidth: 480, margin: '0 auto' }}>
            Cari praktisi akupuntur dan TCM terdekat di kotamu
          </p>
        </div>

        {/* Filter */}
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: 32 }}>
          <select value={province} onChange={e => { setProvince(e.target.value); setCity('') }}
            style={{ ...inp, width: '100%' }}>
            <option value="">Semua Provinsi</option>
            {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <input type="text" placeholder="Cari kota..."
            value={city} onChange={e => setCity(e.target.value)}
            style={{ ...inp, width: '100%' }} />
          <input type="text" placeholder="Cari nama klinik atau spesialisasi..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...inp, width: '100%' }} />
        </div>

        {/* Results */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--ink3)', fontSize: 14 }}>
            Memuat daftar klinik...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontSize: 14, color: 'var(--ink3)' }}>
              {clinics.length === 0
                ? 'Belum ada klinik yang terdaftar di direktori.'
                : 'Tidak ada klinik ditemukan dengan filter tersebut.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
            {filtered.map(clinic => (
              <Link key={clinic.id} href={`/klinik/${clinic.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 20, cursor: 'pointer', transition: 'box-shadow 0.15s', height: '100%' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-lg)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.boxShadow = 'none')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'var(--accent)', color: '#F5F0E8', fontFamily: 'var(--font-dm-serif)', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {getInitials(clinic.name)}
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 16, color: 'var(--ink)', lineHeight: 1.3 }}>
                        {clinic.clinic_name ?? clinic.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 2 }}>{clinic.name}</div>
                    </div>
                  </div>

                  {clinic.specialty && (
                    <span style={{ display: 'inline-block', fontSize: 11, padding: '3px 9px', borderRadius: 20, background: 'var(--accent-light)', color: 'var(--accent)', marginBottom: 10 }}>
                      {clinic.specialty}
                    </span>
                  )}

                  {clinic.public_address && (
                    <p style={{ fontSize: 12.5, color: 'var(--ink2)', marginBottom: 6, display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 1 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                      {clinic.public_address}
                    </p>
                  )}

                  {(clinic.city || clinic.province) && (
                    <p style={{ fontSize: 12, color: 'var(--ink3)' }}>
                      {[clinic.city, clinic.province].filter(Boolean).join(', ')}
                    </p>
                  )}

                  <div style={{ marginTop: 14, padding: '8px 14px', background: 'var(--accent)', borderRadius: 8, textAlign: 'center', fontSize: 12.5, fontWeight: 500, color: '#F5F0E8' }}>
                    Lihat & Minta Jadwal →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
