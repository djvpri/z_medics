'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Topbar from '@/components/layout/Topbar'
import { mockPatients } from '@/lib/mock-data'
import { NewPatientForm } from '@/types'
import AvatarUploader from '@/components/ui/AvatarUploader'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8,
  fontFamily: 'var(--font-dm-sans)', fontSize: 13.5, color: 'var(--ink)',
  background: 'var(--surface)', outline: 'none',
}
const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 500, color: 'var(--ink2)', letterSpacing: 0.3, marginBottom: 6, display: 'block',
}

export default function EditPasienPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [form, setForm] = useState<NewPatientForm>({ name: '', gender: undefined, birth_date: '', phone: '', email: '', address: '', avatar_url: '' })
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/patients/${id}`)
        if (res.ok) {
          const d = await res.json()
          if (d && d.id) {
            setForm({ name: d.name, gender: d.gender, birth_date: d.birth_date ?? '', phone: d.phone ?? '', email: d.email ?? '', address: d.address ?? '', avatar_url: d.avatar_url ?? '' })
            return
          }
        }
        const mock = mockPatients.find(p => p.id === id)
        if (mock) setForm({ name: mock.name, gender: mock.gender, birth_date: mock.birth_date ?? '', phone: mock.phone ?? '', email: mock.email ?? '', address: mock.address ?? '' })
      } catch {
        const mock = mockPatients.find(p => p.id === id)
        if (mock) setForm({ name: mock.name, gender: mock.gender, birth_date: mock.birth_date ?? '', phone: mock.phone ?? '', email: mock.email ?? '', address: mock.address ?? '' })
      } finally {
        setFetching(false)
      }
    }
    load()
  }, [id])

  function set(field: keyof NewPatientForm, value: string) {
    setForm(prev => ({ ...prev, [field]: value || undefined }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/patients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          gender: form.gender,
          birth_date: form.birth_date || undefined,
          phone: form.phone,
          email: form.email,
          address: form.address,
        }),
      })
      if (!res.ok) throw new Error('Gagal menyimpan')
      router.push(`/pasien/${id}`)
      router.refresh()
    } catch {
      alert('Gagal menyimpan pasien')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <>
        <Topbar title="Edit Pasien" back={`/pasien/${id}`} />
        <div className="p-4 md:p-7 text-center" style={{ color: 'var(--ink3)', fontSize: 13 }}>Memuat data...</div>
      </>
    )
  }

  return (
    <>
      <Topbar title="Edit Pasien" back={`/pasien/${id}`} />
      <div className="p-4 md:p-7">
        <form onSubmit={handleSubmit}>
          <div className="rounded-[18px] overflow-hidden max-w-lg" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border2)' }}>
              <h2 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 16, color: 'var(--ink)' }}>Informasi Pasien</h2>
            </div>
            <div className="p-4 md:p-6 space-y-4">
              <AvatarUploader
                table="patients"
                id={id}
                currentUrl={form.avatar_url || undefined}
                name={form.name || '?'}
                size={72}
              />
              <div>
                <label style={labelStyle}>Nama Lengkap <span style={{ color: 'var(--red)' }}>*</span></label>
                <input type="text" value={form.name} onChange={e => set('name', e.target.value)} required style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = 'var(--accent2)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
              </div>

              <div>
                <label style={labelStyle}>Jenis Kelamin</label>
                <div className="flex gap-2">
                  {(['male', 'female'] as const).map(g => (
                    <label key={g} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13.5, border: '1px solid', borderColor: form.gender === g ? 'var(--accent)' : 'var(--border)', background: form.gender === g ? 'var(--accent-light)' : 'var(--surface)', color: form.gender === g ? 'var(--accent)' : 'var(--ink2)', fontWeight: form.gender === g ? 500 : 400 }}>
                      <input type="radio" name="gender" value={g} checked={form.gender === g} onChange={() => set('gender', g)} className="sr-only" />
                      {g === 'male' ? 'Laki-laki' : 'Perempuan'}
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle}>Tanggal Lahir</label>
                  <input type="date" value={form.birth_date ?? ''} onChange={e => set('birth_date', e.target.value)} style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = 'var(--accent2)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                </div>
                <div>
                  <label style={labelStyle}>Nomor Telepon</label>
                  <input type="tel" value={form.phone ?? ''} onChange={e => set('phone', e.target.value)} placeholder="08xxxxxxxxxx" style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = 'var(--accent2)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Email</label>
                <input type="email" value={form.email ?? ''} onChange={e => set('email', e.target.value)} style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = 'var(--accent2)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
              </div>

              <div>
                <label style={labelStyle}>Alamat</label>
                <textarea value={form.address ?? ''} onChange={e => set('address', e.target.value)} rows={3} style={{ ...inputStyle, resize: 'none' }}
                  onFocus={e => (e.target.style.borderColor = 'var(--accent2)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <button type="submit" disabled={loading || !form.name.trim()} style={{ padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', background: loading ? 'var(--bg2)' : 'var(--accent)', color: loading ? 'var(--ink3)' : '#F5F0E8', fontFamily: 'var(--font-dm-sans)', transition: 'all 0.15s' }}>
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
            <Link href={`/pasien/${id}`} style={{ padding: '9px 16px', fontSize: 13, color: 'var(--ink2)', textDecoration: 'none', fontFamily: 'var(--font-dm-sans)' }}>Batal</Link>
          </div>
        </form>
      </div>
    </>
  )
}
