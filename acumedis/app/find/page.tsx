'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toWaLink } from '@/lib/formatMoney'

const COUNTRIES = [
  'Indonesia','Malaysia','Singapore','Brunei','Philippines',
  'Thailand','Vietnam','Cambodia','Myanmar','Timor-Leste',
  'Australia','United Kingdom','United States','Netherlands',
  'Germany','France','Japan','South Korea','Other',
]

interface Clinic {
  id: string; name: string; clinic_name: string | null; city: string | null
  province: string | null; public_address: string | null; description: string | null
  specialty: string | null; phone_public: string | null; avatar_url?: string | null
  clinic_photos?: { url: string }[]
  verified: boolean
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

const PAGE_SIZE = 24

export default function FindPage() {
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [filtered, setFiltered] = useState<Clinic[]>([])
  const [country, setCountry] = useState('')
  const [city, setCity] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [{ data: verified }, { data: unverified }] = await Promise.all([
        supabase
          .from('practitioners')
          .select('id, name, clinic_name, city, province, public_address, description, specialty, phone_public, avatar_url, clinic_photos(url)')
          .eq('is_listed', true)
          .order('name'),
        supabase
          .from('unverified_clinics')
          .select('id, name, clinic_name, city, country, public_address, description, specialty, phone_public')
          .order('name'),
      ])
      const merged: Clinic[] = [
        ...(verified ?? []).map(c => ({ ...c, verified: true })),
        ...(unverified ?? []).map(c => ({ ...c, province: c.country, avatar_url: null, clinic_photos: [], verified: false })),
      ].sort((a, b) => (a.clinic_name ?? a.name).localeCompare(b.clinic_name ?? b.name))
      setClinics(merged)
      setFiltered(merged)
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    let result = clinics
    if (country) result = result.filter(c => c.province === country)
    if (city) result = result.filter(c => c.city?.toLowerCase().includes(city.toLowerCase()))
    if (search) result = result.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.clinic_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.specialty?.toLowerCase().includes(search.toLowerCase())
    )
    setFiltered(result)
    setVisibleCount(PAGE_SIZE)
  }, [country, city, search, clinics])

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
          <div style={{ fontSize: 10, color: 'rgba(245,240,232,0.4)', letterSpacing: 2, textTransform: 'uppercase' }}>Find a Clinic</div>
        </div>
        <Link href="/login" style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, background: 'var(--accent)', color: '#F5F0E8', textDecoration: 'none' }}>
          Login Klinik
        </Link>
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 34, color: 'var(--ink)', marginBottom: 10 }}>
            Find Acupuncture & TCM Clinics
          </h1>
          <p style={{ fontSize: 15, color: 'var(--ink3)', maxWidth: 480, margin: '0 auto' }}>
            Search for acupuncture and TCM practitioners worldwide
          </p>
        </div>

        {/* Filter */}
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: 32 }}>
          <select value={country} onChange={e => { setCountry(e.target.value); setCity('') }}
            style={{ ...inp, width: '100%' }}>
            <option value="">All Countries</option>
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="text" placeholder="Search city..."
            value={city} onChange={e => setCity(e.target.value)}
            style={{ ...inp, width: '100%' }} />
          <input type="text" placeholder="Search clinic name or specialty..."
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
                ? 'No clinics listed yet.'
                : 'No clinics found with those filters.'}
            </p>
          </div>
        ) : (
          <>
          <p style={{ fontSize: 12.5, color: 'var(--ink3)', marginBottom: 16 }}>
            Menampilkan {Math.min(visibleCount, filtered.length)} dari {filtered.length} klinik
          </p>
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
            {filtered.slice(0, visibleCount).map(clinic => {
              const card = (
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden', cursor: clinic.verified ? 'pointer' : 'default', transition: 'box-shadow 0.15s', height: '100%' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-lg)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.boxShadow = 'none')}>
                  {/* Cover photo */}
                  {clinic.clinic_photos?.[0]?.url && (
                    <div style={{ width: '100%', height: 140, overflow: 'hidden' }}>
                      <img src={clinic.clinic_photos[0].url} alt={clinic.clinic_name ?? clinic.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <div style={{ padding: 20 }}>
                  {!clinic.verified && (
                    <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: '#FFF3D6', color: '#9A7B1F', marginBottom: 10, letterSpacing: 0.3 }}>
                      ⚠ Belum Terverifikasi · data publik
                    </span>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'var(--accent)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {clinic.avatar_url
                        ? <img src={clinic.avatar_url} alt={clinic.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ color: '#F5F0E8', fontFamily: 'var(--font-dm-serif)', fontSize: 18 }}>{getInitials(clinic.name)}</span>}
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

                  {clinic.verified ? (
                    <div style={{ marginTop: 14, padding: '8px 14px', background: 'var(--accent)', borderRadius: 8, textAlign: 'center', fontSize: 12.5, fontWeight: 500, color: '#F5F0E8' }}>
                      Lihat & Minta Jadwal →
                    </div>
                  ) : clinic.phone_public ? (
                    <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                      <a href={toWaLink(clinic.phone_public)} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                        style={{ flex: 1, padding: '8px 10px', background: 'var(--accent)', borderRadius: 8, textAlign: 'center', fontSize: 12, fontWeight: 500, color: '#F5F0E8', textDecoration: 'none' }}>
                        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                        WhatsApp
                      </a>
                      <a href={`tel:${clinic.phone_public.replace(/\D/g, '')}`} onClick={e => e.stopPropagation()}
                        style={{ flex: 1, padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8, textAlign: 'center', fontSize: 12, fontWeight: 500, color: 'var(--ink2)', textDecoration: 'none' }}>
                        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                        Telepon
                      </a>
                    </div>
                  ) : (
                    <p style={{ marginTop: 14, fontSize: 11.5, color: 'var(--ink3)', fontStyle: 'italic' }}>
                      Kontak tidak tersedia — info bersumber dari direktori publik.
                    </p>
                  )}
                  </div>
                </div>
              )
              return clinic.verified ? (
                <Link key={clinic.id} href={`/klinik/${clinic.id}`} style={{ textDecoration: 'none' }}>{card}</Link>
              ) : (
                <div key={clinic.id}>{card}</div>
              )
            })}
          </div>
          {visibleCount < filtered.length && (
            <div style={{ textAlign: 'center', marginTop: 28 }}>
              <button onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
                style={{ padding: '10px 24px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--ink)', fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }}>
                Tampilkan lebih banyak
              </button>
            </div>
          )}
          </>
        )}
      </div>
    </div>
  )
}
