'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Topbar from '@/components/layout/Topbar'
import { createClient } from '@/lib/supabase/client'
import { NewPatientForm } from '@/types'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontFamily: 'var(--font-dm-sans)',
  fontSize: 13.5,
  color: 'var(--ink)',
  background: 'var(--surface)',
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--ink2)',
  letterSpacing: 0.3,
  marginBottom: 6,
  display: 'block',
}

export default function TambahPasienPage() {
  const router = useRouter()
  const [form, setForm] = useState<NewPatientForm>({ name: '', gender: undefined, birth_date: '', phone: '', email: '', address: '' })
  const [loading, setLoading] = useState(false)

  function set(field: keyof NewPatientForm, value: string) {
    setForm(prev => ({ ...prev, [field]: value || undefined }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const practitioner_id = user?.id ?? process.env.NEXT_PUBLIC_DEV_PRACTITIONER_ID ?? '00000000-0000-0000-0000-000000000001'
    const { error } = await supabase.from('patients').insert({ ...form, practitioner_id })
    setLoading(false)
    if (error) { alert('Gagal menyimpan: ' + error.message); return }
    router.push('/pasien')
  }

  return (
    <>
      <Topbar
        title="Pasien Baru"
        actions={
          <Link href="/pasien" style={{ padding: '6px 10px', fontSize: 12, fontFamily: 'var(--font-dm-sans)', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--ink2)', textDecoration: 'none' }}>
            ← Kembali
          </Link>
        }
      />

      <div className="p-7">
        <form onSubmit={handleSubmit}>
          <div className="rounded-[18px] overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border2)' }}>
              <h2 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 16, color: 'var(--ink)' }}>Informasi Pasien</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                {/* Nama */}
                <div className="col-span-2">
                  <label style={labelStyle}>Nama Lengkap <span style={{ color: 'var(--red)' }}>*</span></label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                    placeholder="Contoh: Ahmad Fauzi"
                    required
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = 'var(--accent2)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                  />
                </div>

                {/* Gender */}
                <div className="col-span-2">
                  <label style={labelStyle}>Jenis Kelamin</label>
                  <div className="flex gap-2">
                    {(['male', 'female'] as const).map(g => (
                      <label key={g} style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13.5, border: '1px solid',
                        borderColor: form.gender === g ? 'var(--accent)' : 'var(--border)',
                        background: form.gender === g ? 'var(--accent-light)' : 'var(--surface)',
                        color: form.gender === g ? 'var(--accent)' : 'var(--ink2)',
                        fontWeight: form.gender === g ? 500 : 400,
                      }}>
                        <input type="radio" name="gender" value={g} checked={form.gender === g} onChange={() => set('gender', g)} className="sr-only" />
                        {g === 'male' ? 'Laki-laki' : 'Perempuan'}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Tanggal Lahir */}
                <div>
                  <label style={labelStyle}>Tanggal Lahir</label>
                  <input type="date" value={form.birth_date ?? ''} onChange={e => set('birth_date', e.target.value)} style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = 'var(--accent2)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                  />
                </div>

                {/* Telepon */}
                <div>
                  <label style={labelStyle}>Nomor Telepon</label>
                  <input type="tel" value={form.phone ?? ''} onChange={e => set('phone', e.target.value)} placeholder="08xxxxxxxxxx" style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = 'var(--accent2)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                  />
                </div>

                {/* Email */}
                <div>
                  <label style={labelStyle}>Email</label>
                  <input type="email" value={form.email ?? ''} onChange={e => set('email', e.target.value)} placeholder="pasien@email.com" style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = 'var(--accent2)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                  />
                </div>

                {/* Alamat */}
                <div className="col-span-2">
                  <label style={labelStyle}>Alamat</label>
                  <textarea
                    value={form.address ?? ''}
                    onChange={e => set('address', e.target.value)}
                    placeholder="Jl. ..."
                    rows={3}
                    style={{ ...inputStyle, resize: 'none' }}
                    onFocus={e => (e.target.style.borderColor = 'var(--accent2)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-4">
            <button type="submit" disabled={loading || !form.name.trim()} style={{
              padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              background: loading || !form.name.trim() ? 'var(--bg2)' : 'var(--accent)',
              color: loading || !form.name.trim() ? 'var(--ink3)' : '#F5F0E8',
              fontFamily: 'var(--font-dm-sans)',
              transition: 'all 0.15s',
            }}>
              {loading ? 'Menyimpan...' : 'Simpan Pasien'}
            </button>
            <Link href="/pasien" style={{ padding: '9px 16px', fontSize: 13, color: 'var(--ink2)', textDecoration: 'none', fontFamily: 'var(--font-dm-sans)' }}>
              Batal
            </Link>
          </div>
        </form>
      </div>
    </>
  )
}
