'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Topbar from '@/components/layout/Topbar'
import { createClient } from '@/lib/supabase/client'
import { NewSessionForm, TongueColor, TongueCoating, PulseQuality } from '@/types'

// Titik akupuntur umum dikelompokkan per meridian
const POINT_GROUPS: { label: string; points: string[] }[] = [
  { label: 'Meridian Utama', points: ['LI4', 'LI11', 'LU7', 'LU9'] },
  { label: 'Lambung & Limpa', points: ['ST36', 'ST40', 'SP6', 'SP8', 'SP10'] },
  { label: 'Hati & Kantung Empedu', points: ['LV3', 'LV8', 'GB20', 'GB21', 'GB34'] },
  { label: 'Ginjal & Kandung Kemih', points: ['KD3', 'KD7', 'BL10', 'BL23', 'BL40', 'BL60'] },
  { label: 'Jantung & Perikardium', points: ['HT7', 'PC6'] },
  { label: 'Du & Ren Mai', points: ['GV4', 'GV14', 'GV20', 'CV4', 'CV6', 'CV12'] },
]

const TONGUE_COLORS: { value: TongueColor; label: string }[] = [
  { value: 'pale', label: 'Pucat' },
  { value: 'pale-red', label: 'Merah Muda' },
  { value: 'red', label: 'Merah' },
  { value: 'dark-red', label: 'Merah Gelap' },
  { value: 'purple', label: 'Ungu' },
]

const TONGUE_COATINGS: { value: TongueCoating; label: string }[] = [
  { value: 'none', label: 'Tidak Ada' },
  { value: 'thin-white', label: 'Tipis Putih' },
  { value: 'thick-white', label: 'Tebal Putih' },
  { value: 'thin-yellow', label: 'Tipis Kuning' },
  { value: 'thick-yellow', label: 'Tebal Kuning' },
]

const PULSE_QUALITIES: { value: PulseQuality; label: string }[] = [
  { value: 'wiry', label: 'Tegang (Wiry)' },
  { value: 'slippery', label: 'Licin (Slippery)' },
  { value: 'weak', label: 'Lemah' },
  { value: 'rapid', label: 'Cepat' },
  { value: 'slow', label: 'Lambat' },
  { value: 'deep', label: 'Dalam' },
  { value: 'floating', label: 'Mengambang' },
]

function SesiBaruForm() {
  const router = useRouter()
  const params = useSearchParams()
  const defaultPatient = params.get('pasien') ?? ''

  const today = new Date().toISOString().slice(0, 16)

  const [patients, setPatients] = useState<{ id: string; name: string }[]>([])
  const [form, setForm] = useState<NewSessionForm>({
    patient_id: defaultPatient,
    session_date: today,
    chief_complaint: '',
    tongue_color: undefined,
    tongue_coating: undefined,
    pulse_quality: undefined,
    pain_scale: undefined,
    points_used: [],
    duration_minutes: undefined,
    notes: '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    createClient().from('patients').select('id, name').order('name').then(({ data }) => setPatients(data ?? []))
  }, [])

  function setField<K extends keyof NewSessionForm>(key: K, value: NewSessionForm[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function togglePoint(point: string) {
    const current = form.points_used ?? []
    setField('points_used',
      current.includes(point)
        ? current.filter(p => p !== point)
        : [...current, point]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.patient_id || !form.chief_complaint.trim()) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const practitioner_id = user?.id ?? process.env.NEXT_PUBLIC_DEV_PRACTITIONER_ID ?? '00000000-0000-0000-0000-000000000001'

    const { error } = await supabase.from('sessions').insert({ ...form, practitioner_id })
    setLoading(false)
    if (error) { alert('Gagal menyimpan: ' + error.message); return }
    router.push('/sesi')
  }

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      {children}
    </div>
  )

  const Label = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )

  const inputCls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
  const selectCls = `${inputCls} bg-white`

  return (
    <>
      <Topbar
        title="Sesi Baru"
        subtitle="Catat sesi akupuntur"
        actions={
          <Link href="/sesi" className="text-sm text-gray-500 hover:text-gray-700">
            ← Kembali
          </Link>
        }
      />

      <div className="p-6 flex-1">
        <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">

          {/* Pasien & Waktu */}
          <Section title="Pasien & Waktu">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label required>Pasien</Label>
                <select
                  value={form.patient_id}
                  onChange={e => setField('patient_id', e.target.value)}
                  required
                  className={selectCls}
                >
                  <option value="">Pilih pasien...</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label required>Tanggal & Jam</Label>
                <input
                  type="datetime-local"
                  value={form.session_date}
                  onChange={e => setField('session_date', e.target.value)}
                  required
                  className={inputCls}
                />
              </div>
            </div>
          </Section>

          {/* Keluhan */}
          <Section title="Keluhan">
            <div>
              <Label required>Keluhan Utama</Label>
              <textarea
                value={form.chief_complaint}
                onChange={e => setField('chief_complaint', e.target.value)}
                placeholder="Deskripsikan keluhan utama pasien..."
                rows={3}
                required
                className={`${inputCls} resize-none`}
              />
            </div>
            <div>
              <Label>Skala Nyeri</Label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={form.pain_scale ?? 5}
                  onChange={e => setField('pain_scale', Number(e.target.value))}
                  className="flex-1 accent-teal-600"
                />
                <span className={`w-10 text-center text-sm font-semibold px-2 py-0.5 rounded-lg ${
                  !form.pain_scale ? 'text-gray-400' :
                  form.pain_scale <= 3 ? 'bg-green-50 text-green-700' :
                  form.pain_scale <= 6 ? 'bg-yellow-50 text-yellow-700' :
                  'bg-red-50 text-red-700'
                }`}>
                  {form.pain_scale ?? '—'}{form.pain_scale ? '/10' : ''}
                </span>
                {form.pain_scale && (
                  <button type="button" onClick={() => setField('pain_scale', undefined)} className="text-xs text-gray-400 hover:text-gray-600">
                    Hapus
                  </button>
                )}
              </div>
            </div>
          </Section>

          {/* Diagnosis TCM */}
          <Section title="Diagnosis TCM">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Warna Lidah</Label>
                <select
                  value={form.tongue_color ?? ''}
                  onChange={e => setField('tongue_color', (e.target.value as TongueColor) || undefined)}
                  className={selectCls}
                >
                  <option value="">Pilih...</option>
                  {TONGUE_COLORS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Selaput Lidah</Label>
                <select
                  value={form.tongue_coating ?? ''}
                  onChange={e => setField('tongue_coating', (e.target.value as TongueCoating) || undefined)}
                  className={selectCls}
                >
                  <option value="">Pilih...</option>
                  {TONGUE_COATINGS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Kualitas Nadi</Label>
                <select
                  value={form.pulse_quality ?? ''}
                  onChange={e => setField('pulse_quality', (e.target.value as PulseQuality) || undefined)}
                  className={selectCls}
                >
                  <option value="">Pilih...</option>
                  {PULSE_QUALITIES.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </Section>

          {/* Titik Akupuntur */}
          <Section title="Titik Akupuntur">
            {form.points_used && form.points_used.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pb-2 border-b border-gray-100">
                {form.points_used.map(p => (
                  <span
                    key={p}
                    onClick={() => togglePoint(p)}
                    className="flex items-center gap-1 px-2 py-0.5 bg-teal-600 text-white text-xs font-mono rounded cursor-pointer hover:bg-teal-700"
                  >
                    {p}
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </span>
                ))}
              </div>
            )}
            <div className="space-y-3">
              {POINT_GROUPS.map(group => (
                <div key={group.label}>
                  <p className="text-xs text-gray-500 mb-1.5">{group.label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.points.map(point => {
                      const selected = form.points_used?.includes(point)
                      return (
                        <button
                          key={point}
                          type="button"
                          onClick={() => togglePoint(point)}
                          className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors ${
                            selected
                              ? 'bg-teal-600 text-white border-teal-600'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-teal-400 hover:text-teal-600'
                          }`}
                        >
                          {point}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Catatan */}
          <Section title="Catatan & Durasi">
            <div>
              <Label>Durasi Sesi (menit)</Label>
              <input
                type="number"
                value={form.duration_minutes ?? ''}
                onChange={e => setField('duration_minutes', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="45"
                min={5}
                max={180}
                className={`${inputCls} w-32`}
              />
            </div>
            <div>
              <Label>Catatan Klinis</Label>
              <textarea
                value={form.notes ?? ''}
                onChange={e => setField('notes', e.target.value || undefined)}
                placeholder="Catatan observasi, respons pasien, instruksi lanjutan..."
                rows={3}
                className={`${inputCls} resize-none`}
              />
            </div>
          </Section>

          {/* Submit */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={loading || !form.patient_id || !form.chief_complaint.trim()}
              className="px-5 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Menyimpan...' : 'Simpan Sesi'}
            </button>
            <Link href="/sesi" className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
              Batal
            </Link>
          </div>

        </form>
      </div>
    </>
  )
}

export default function SesiBaruPage() {
  return (
    <Suspense>
      <SesiBaruForm />
    </Suspense>
  )
}
