'use client'

import { useState, useEffect } from 'react'
import Topbar from '@/components/layout/Topbar'
import { createClient } from '@/lib/supabase/client'
import AvatarUploader from '@/components/ui/AvatarUploader'
import ClinicPhotoManager from '@/components/ui/ClinicPhotoManager'
import { useT } from '@/contexts/LanguageContext'
import { CURRENCIES } from '@/lib/formatMoney'

const COUNTRIES = [
  'Indonesia','Malaysia','Singapore','Brunei','Philippines',
  'Thailand','Vietnam','Cambodia','Myanmar','Timor-Leste',
  'Australia','United Kingdom','United States','Netherlands',
  'Germany','France','Japan','South Korea','Other',
]

const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8,
  fontFamily: 'var(--font-dm-sans)', fontSize: 13.5, color: 'var(--ink)', background: 'var(--surface)', outline: 'none',
}

export default function PengaturanPage() {
  const { setCurrency } = useT()
  const [form, setForm] = useState({
    name: '', clinic_name: '', specialty: 'Acupuncture & TCM', city: '', province: '',
    public_address: '', description: '', phone_public: '', is_listed: false, avatar_url: '',
    default_fee: 0, currency: 'IDR', accepts_bookings: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [practitionerId, setPractitionerId] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setPractitionerId(user.id)
      const { data } = await supabase.from('practitioners').select('*').eq('id', user.id).single()
      if (data) {
        setForm({
          name: data.name ?? '',
          clinic_name: data.clinic_name ?? '',
          avatar_url: data.avatar_url ?? '',
          default_fee: data.default_fee ?? 0,
          currency: data.currency ?? 'IDR',
          specialty: data.specialty ?? 'Akupuntur & TCM',
          city: data.city ?? '',
          province: data.province ?? '',
          public_address: data.public_address ?? '',
          description: data.description ?? '',
          phone_public: data.phone_public ?? '',
          is_listed: data.is_listed ?? false,
          accepts_bookings: data.accepts_bookings ?? true,
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  function set(k: string, v: any) { setForm(p => ({ ...p, [k]: v })) }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setSaved(false)
    const supabase = createClient()
    await supabase.from('practitioners').update({
      name: form.name || null,
      clinic_name: form.clinic_name || null,
      specialty: form.specialty || null,
      city: form.city || null,
      province: form.province || null,
      public_address: form.public_address || null,
      description: form.description || null,
      phone_public: form.phone_public || null,
      is_listed: form.is_listed,
      accepts_bookings: form.accepts_bookings,
      avatar_url: form.avatar_url || null,
      default_fee: form.default_fee || 0,
      currency: form.currency || 'IDR',
    }).eq('id', practitionerId)
    setCurrency(form.currency || 'IDR')
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const fo = (e: React.FocusEvent<any>) => (e.target.style.borderColor = 'var(--accent2)')
  const bl = (e: React.FocusEvent<any>) => (e.target.style.borderColor = 'var(--border)')

  if (loading) return (
    <>
      <Topbar title="Pengaturan" />
      <div className="p-4 md:p-7 text-center" style={{ color: 'var(--ink3)', fontSize: 13 }}>Memuat...</div>
    </>
  )

  return (
    <>
      <Topbar title="Pengaturan Klinik" />
      <div className="p-4 md:p-7">
        <form onSubmit={handleSave} className="space-y-5" style={{ maxWidth: 600 }}>

          {/* Toggle listing */}
          <div className="rounded-[18px] p-5" style={{ background: form.is_listed ? 'var(--accent-light)' : 'var(--surface)', border: `1px solid ${form.is_listed ? 'var(--accent)' : 'var(--border)'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 16, color: 'var(--ink)', marginBottom: 4 }}>
                  {form.is_listed ? '✓ Klinik Anda Terdaftar di Direktori' : 'Daftarkan Klinik ke Direktori'}
                </p>
                <p style={{ fontSize: 12.5, color: 'var(--ink3)' }}>
                  {form.is_listed
                    ? 'Pasien dapat menemukan dan menghubungi klinik Anda melalui z-medics.vercel.app/find'
                    : 'Aktifkan agar pasien bisa menemukan klinik Anda secara online'}
                </p>
              </div>
              <button type="button" onClick={() => set('is_listed', !form.is_listed)}
                style={{ width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', position: 'relative', background: form.is_listed ? 'var(--accent)' : 'var(--bg2)', transition: 'background 0.2s', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: 3, left: form.is_listed ? 25 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </button>
            </div>
          </div>

          {/* Toggle terima booking online */}
          <div className="rounded-[18px] p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 16, color: 'var(--ink)', marginBottom: 4 }}>
                  Terima Permintaan Booking dari Website
                </p>
                <p style={{ fontSize: 12.5, color: 'var(--ink3)', lineHeight: 1.6 }}>
                  {form.accepts_bookings
                    ? 'Calon pasien bisa mengirim permintaan jadwal langsung dari halaman profil klinik Anda.'
                    : 'Form permintaan jadwal disembunyikan. Calon pasien akan diarahkan untuk menghubungi Anda langsung via WhatsApp/telepon.'}
                </p>
              </div>
              <button type="button" onClick={() => set('accepts_bookings', !form.accepts_bookings)}
                style={{ width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', position: 'relative', background: form.accepts_bookings ? 'var(--accent)' : 'var(--bg2)', transition: 'background 0.2s', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: 3, left: form.accepts_bookings ? 25 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </button>
            </div>
          </div>

          {/* Info klinik */}
          <div className="rounded-[18px] overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border2)' }}>
              <h2 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 16, color: 'var(--ink)' }}>Informasi Klinik</h2>
              <p style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 2 }}>Ditampilkan kepada calon pasien</p>
            </div>
            <div className="p-5 space-y-4">
              {/* Avatar */}
              <AvatarUploader
                currentUrl={form.avatar_url || undefined}
                name={form.name || 'DR'}
                size={80}
                onUpload={(url) => set('avatar_url', url)}
              />

              {/* Foto klinik */}
              {practitionerId && (
                <div style={{ paddingTop: 16, borderTop: '1px solid var(--border2)' }}>
                  <ClinicPhotoManager practitionerId={practitionerId} />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--ink2)', marginBottom: 5 }}>Nama Praktisi / Dokter</label>
                <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Dr. ..." style={inp} onFocus={fo} onBlur={bl} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--ink2)', marginBottom: 5 }}>Nama Klinik</label>
                  <input type="text" value={form.clinic_name} onChange={e => set('clinic_name', e.target.value)} placeholder="Klinik Akupuntur ..." style={inp} onFocus={fo} onBlur={bl} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--ink2)', marginBottom: 5 }}>Spesialisasi</label>
                  <input type="text" value={form.specialty} onChange={e => set('specialty', e.target.value)} placeholder="Akupuntur & TCM" style={inp} onFocus={fo} onBlur={bl} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--ink2)', marginBottom: 5 }}>Deskripsi Klinik</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
                  placeholder="Ceritakan tentang klinik Anda, pengalaman, layanan yang ditawarkan..."
                  style={{ ...inp, resize: 'none' }} onFocus={fo} onBlur={bl} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--ink2)', marginBottom: 5 }}>Alamat Lengkap</label>
                <input type="text" value={form.public_address} onChange={e => set('public_address', e.target.value)} placeholder="Jl. ..." style={inp} onFocus={fo} onBlur={bl} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--ink2)', marginBottom: 5 }}>City</label>
                  <input type="text" value={form.city} onChange={e => set('city', e.target.value)} placeholder="Kuala Lumpur, Singapore..." style={inp} onFocus={fo} onBlur={bl} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--ink2)', marginBottom: 5 }}>Country</label>
                  <select value={form.province} onChange={e => set('province', e.target.value)} style={{ ...inp, appearance: 'none' }} onFocus={fo} onBlur={bl}>
                    <option value="">Select country...</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--ink2)', marginBottom: 5 }}>No. Telepon / WhatsApp Publik</label>
                <input type="tel" value={form.phone_public} onChange={e => set('phone_public', e.target.value)} placeholder="08xxxxxxxxxx" style={inp} onFocus={fo} onBlur={bl} />
              </div>

              <div style={{ paddingTop: 16, borderTop: '1px solid var(--border2)' }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--ink2)', marginBottom: 5 }}>Currency</label>
                    <select value={form.currency} onChange={e => set('currency', e.target.value)} style={{ ...inp, appearance: 'none' }} onFocus={fo} onBlur={bl}>
                      {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                    </select>
                    <p style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 5 }}>Used for billing, reports, and receipts.</p>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--ink2)', marginBottom: 5 }}>Default Session Fee</label>
                    <input type="number" min={0} step={1000} value={form.default_fee || ''} onChange={e => set('default_fee', Number(e.target.value) || 0)} placeholder="150000" style={inp} onFocus={fo} onBlur={bl} />
                    <p style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 5 }}>Auto-filled when creating a new session.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button type="submit" disabled={saving}
              style={{ padding: '10px 24px', borderRadius: 8, fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)', background: saving ? 'var(--bg2)' : 'var(--accent)', color: saving ? 'var(--ink3)' : '#F5F0E8', transition: 'all 0.15s' }}>
              {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </button>
            {saved && <span style={{ fontSize: 13, color: 'var(--accent)' }}>✓ Tersimpan</span>}
          </div>

          {form.is_listed && practitionerId && (
            <div className="rounded-xl p-4" style={{ background: 'var(--accent-light)', border: '1px solid rgba(45,90,61,0.2)' }}>
              <p style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500, marginBottom: 4 }}>Link profil klinik Anda:</p>
              <a href={`/klinik/${practitionerId}`} target="_blank" rel="noreferrer"
                style={{ fontSize: 13, color: 'var(--accent)', wordBreak: 'break-all' }}>
                z-medics.vercel.app/klinik/{practitionerId}
              </a>
            </div>
          )}
        </form>
      </div>
    </>
  )
}
