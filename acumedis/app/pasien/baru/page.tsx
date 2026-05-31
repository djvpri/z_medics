'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Topbar from '@/components/layout/Topbar'
import { createClient } from '@/lib/supabase/client'
import { NewPatientForm } from '@/types'

const initialForm: NewPatientForm = {
  name: '',
  gender: undefined,
  birth_date: '',
  phone: '',
  email: '',
  address: '',
}

export default function TambahPasienPage() {
  const router = useRouter()
  const [form, setForm] = useState<NewPatientForm>(initialForm)
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
        title="Tambah Pasien Baru"
        subtitle="Lengkapi data dasar pasien"
        actions={
          <Link
            href="/pasien"
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            ← Kembali
          </Link>
        }
      />

      <div className="p-6 flex-1">
        <form onSubmit={handleSubmit} className="max-w-lg space-y-5">

          {/* Nama */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Contoh: Ahmad Fauzi"
              required
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label>
            <div className="flex gap-3">
              {(['male', 'female'] as const).map(g => (
                <label key={g} className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer text-sm transition-colors ${
                  form.gender === g
                    ? 'border-teal-500 bg-teal-50 text-teal-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="gender"
                    value={g}
                    checked={form.gender === g}
                    onChange={() => set('gender', g)}
                    className="sr-only"
                  />
                  {g === 'male' ? 'Laki-laki' : 'Perempuan'}
                </label>
              ))}
            </div>
          </div>

          {/* Tanggal Lahir */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Lahir</label>
            <input
              type="date"
              value={form.birth_date ?? ''}
              onChange={e => set('birth_date', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {/* Telepon */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon</label>
            <input
              type="tel"
              value={form.phone ?? ''}
              onChange={e => set('phone', e.target.value)}
              placeholder="08xxxxxxxxxx"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email ?? ''}
              onChange={e => set('email', e.target.value)}
              placeholder="pasien@email.com"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {/* Alamat */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
            <textarea
              value={form.address ?? ''}
              onChange={e => set('address', e.target.value)}
              placeholder="Jl. ..."
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || !form.name.trim()}
              className="px-5 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Menyimpan...' : 'Simpan Pasien'}
            </button>
            <Link href="/pasien" className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
              Batal
            </Link>
          </div>
        </form>
      </div>
    </>
  )
}
