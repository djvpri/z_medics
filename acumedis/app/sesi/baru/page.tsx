'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Topbar from '@/components/layout/Topbar'
import { createClient } from '@/lib/supabase/client'
import { mockPatients, mockSessions } from '@/lib/mock-data'
import { NewSessionForm, TongueColor, TongueCoating, PulseQuality } from '@/types'
import TonguePhotoUploader from '@/components/sessions/TonguePhotoUploader'

const MERIDIANS = [
  { code: 'GB', name: 'Gallbladder' },
  { code: 'LI', name: 'Large Intestine' },
  { code: 'ST', name: 'Stomach' },
  { code: 'LV', name: 'Liver' },
  { code: 'BL', name: 'Bladder' },
  { code: 'GV', name: 'Governing' },
  { code: 'HT', name: 'Heart' },
  { code: 'SP', name: 'Spleen' },
  { code: 'KI', name: 'Kidney' },
  { code: 'PC', name: 'Pericardium' },
  { code: 'TE', name: 'Triple Energizer' },
  { code: 'LU', name: 'Lung' },
]

const TONGUE_COLORS = [
  { value: 'pale', label: 'Pucat' },
  { value: 'pale-red', label: 'Merah muda' },
  { value: 'red', label: 'Merah' },
  { value: 'dark-red', label: 'Merah gelap' },
  { value: 'purple', label: 'Ungu' },
]

const TONGUE_COATINGS = [
  { value: 'none', label: 'Tidak ada' },
  { value: 'thin-white', label: 'Putih tipis' },
  { value: 'thick-white', label: 'Putih tebal' },
  { value: 'thin-yellow', label: 'Kuning tipis' },
  { value: 'thick-yellow', label: 'Kuning tebal' },
]

const PULSE_QUALITIES = [
  { value: 'wiry', label: 'Wiry (Xian)' },
  { value: 'slippery', label: 'Slippery (Hua)' },
  { value: 'weak', label: 'Lemah (Ruo)' },
  { value: 'rapid', label: 'Cepat (Shu)' },
  { value: 'slow', label: 'Lambat (Chi)' },
  { value: 'deep', label: 'Dalam (Chen)' },
  { value: 'floating', label: 'Mengambang (Fu)' },
]

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px',
  border: '1px solid var(--border)', borderRadius: 8,
  fontFamily: 'var(--font-dm-sans)', fontSize: 13.5,
  color: 'var(--ink)', background: 'var(--surface)', outline: 'none',
}
const selectStyle: React.CSSProperties = { ...inputStyle, appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%239C9389' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 32 }
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: 'var(--ink2)', letterSpacing: 0.3, marginBottom: 6, display: 'block' }

// AI Primary point suggestions per common conditions
const AI_SUGGESTIONS: Record<string, { sindrom: string; primary: string[]; secondary: string[]; tip: string }> = {
  default: {
    sindrom: 'Isi keluhan utama, warna lidah, dan kualitas nadi untuk mendapat saran AI.',
    primary: [],
    secondary: [],
    tip: 'Dalam TCM, diagnosis didasarkan pada integrasi keluhan, inspeksi lidah, dan kualitas nadi.',
  },
  wiry: {
    sindrom: 'Nadi wiry menunjukkan kemungkinan <strong>Liver Qi Stagnation</strong> atau kondisi nyeri.',
    primary: ['LV3', 'GB34', 'LI4'],
    secondary: ['SP6', 'PC6', 'GB20'],
    tip: 'Kombinasi LV3 + LI4 (Four Gates) adalah protokol klasik untuk melembutkan Liver Qi.',
  },
  rapid: {
    sindrom: 'Nadi cepat + lidah merah menunjukkan <strong>Heat Pattern</strong> atau defisiensi Yin.',
    primary: ['KI3', 'SP6', 'HT7'],
    secondary: ['KI6', 'PC6', 'GV20'],
    tip: 'Untuk Heat dari defisiensi Yin, tonifikasi Kidney Yin melalui KI3 dan SP6 sangat efektif.',
  },
  weak: {
    sindrom: 'Nadi lemah menunjukkan <strong>Qi atau Yang Deficiency</strong>, perlu tonifikasi.',
    primary: ['ST36', 'SP6', 'CV6'],
    secondary: ['CV4', 'BL23', 'GV4'],
    tip: 'ST36 adalah titik tonifikasi utama untuk menguatkan Qi. Moxa di CV4 dan ST36 sangat disarankan.',
  },
}

function SesiBaruForm() {
  const router = useRouter()
  const params = useSearchParams()
  const defaultPatient = params.get('pasien') ?? ''
  const defaultAlasan = params.get('alasan') ?? ''
  const jadwalId = params.get('jadwal') ?? ''
  const today = new Date().toISOString().slice(0, 16)

  const [patients, setPatients] = useState<{ id: string; name: string }[]>(
    mockPatients.map(p => ({ id: p.id, name: p.name }))
  )
  const [form, setForm] = useState<NewSessionForm>({
    patient_id: defaultPatient,
    session_date: today,
    chief_complaint: defaultAlasan,
    tongue_color: undefined,
    tongue_coating: undefined,
    pulse_quality: undefined,
    pain_scale: undefined,
    points_used: [],
    duration_minutes: undefined,
    notes: '',
  })
  const [pointsText, setPointsText] = useState('')
  const [selectedMeridians, setSelectedMeridians] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [tongueAnalysis, setTongueAnalysis] = useState<any>(null)
  const [tongueImageBase64, setTongueImageBase64] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState<{
    sindrom: string
    deskripsi: string
    titik_utama: string[]
    titik_tambahan: string[]
    catatan: string
    model?: string
  } | null>(null)
  const [aiError, setAiError] = useState('')

  useEffect(() => {
    createClient().from('patients').select('id, name').order('name')
      .then(({ data }) => { if (data && data.length > 0) setPatients(data) })
  }, [])

  function setField<K extends keyof NewSessionForm>(key: K, value: NewSessionForm[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function toggleMeridian(code: string) {
    setSelectedMeridians(prev =>
      prev.includes(code) ? prev.filter(m => m !== code) : [...prev, code]
    )
  }

  // Get AI suggestion based on pulse
  const suggestion = form.pulse_quality && AI_SUGGESTIONS[form.pulse_quality]
    ? AI_SUGGESTIONS[form.pulse_quality]
    : AI_SUGGESTIONS.default

  async function generateAISuggestion() {
    if (!form.chief_complaint.trim()) return
    setAiLoading(true)
    setAiError('')
    setAiResult(null)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'treatment-recommendation',
          context: {
            chief_complaint: form.chief_complaint,
            tongue_color: form.tongue_color,
            tongue_coating: form.tongue_coating,
            pulse_quality: form.pulse_quality,
            pain_scale: form.pain_scale,
          },
        }),
      })
      const data = await res.json()
      if (data.error) { setAiError(data.error); return }

      // Parse JSON dari result text
      const raw = data.result ?? ''
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        setAiResult({ ...parsed, model: data.model })
      } else {
        setAiError('Format respons AI tidak sesuai.')
      }
    } catch (e: any) {
      setAiError(e?.message ?? 'Gagal menghubungi AI.')
    } finally {
      setAiLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.patient_id || !form.chief_complaint.trim()) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const practitioner_id = user?.id ?? process.env.NEXT_PUBLIC_DEV_PRACTITIONER_ID ?? '00000000-0000-0000-0000-000000000001'
    const points = pointsText ? pointsText.split(',').map(p => p.trim()).filter(Boolean) : []
    const { data: newSesi, error } = await supabase
      .from('sessions')
      .insert({ ...form, points_used: points, practitioner_id })
      .select('id')
      .single()
    setLoading(false)
    if (error) { alert('Gagal menyimpan: ' + error.message); return }

    if (newSesi?.id) {
      // Upload foto lidah + simpan analisis jika ada
      if (tongueAnalysis) {
        let storage_path = 'local'

        if (tongueImageBase64) {
          try {
            const byteArr = Uint8Array.from(atob(tongueImageBase64), c => c.charCodeAt(0))
            const blob = new Blob([byteArr], { type: 'image/jpeg' })
            const filename = `${newSesi.id}-${Date.now()}.jpg`
            const { data: uploadData } = await supabase.storage
              .from('tongue-photos')
              .upload(filename, blob, { contentType: 'image/jpeg', upsert: true })
            if (uploadData) {
              const { data: { publicUrl } } = supabase.storage
                .from('tongue-photos').getPublicUrl(uploadData.path)
              storage_path = publicUrl
            }
          } catch {}
        }

        await supabase.from('session_photos').insert({
          session_id: newSesi.id,
          photo_type: 'tongue',
          storage_path,
          ai_analysis: JSON.stringify(tongueAnalysis),
        })
      }

      // Tandai jadwal sebagai completed jika berasal dari jadwal
      if (jadwalId) {
        await supabase.from('appointments')
          .update({ status: 'completed', session_id: newSesi.id })
          .eq('id', jadwalId)
      }
    }

    router.push(newSesi?.id ? `/sesi/${newSesi.id}` : '/sesi')
  }

  // Previous sessions for selected patient
  const prevSessions = mockSessions.filter(s => s.patient_id === form.patient_id).slice(0, 2)

  return (
    <>
      <Topbar
        title="Sesi Baru"
        back="/sesi"
        actions={
          <div className="flex items-center gap-2">
            <button type="button" style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--ink2)', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)' }}>
              Simpan Draft
            </button>
            <button form="sesi-form" type="submit" disabled={loading || !form.patient_id || !form.chief_complaint.trim()}
              style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)', background: loading ? 'var(--bg2)' : 'var(--accent)', color: loading ? 'var(--ink3)' : '#F5F0E8', transition: 'all 0.15s' }}>
              {loading ? 'Menyimpan...' : 'Simpan Sesi'}
            </button>
          </div>
        }
      />

      <form id="sesi-form" onSubmit={handleSubmit}>
        <div className="p-7 grid gap-4" style={{ gridTemplateColumns: '1fr 360px', alignItems: 'start' }}>

          {/* LEFT: form */}
          <div className="space-y-4">

            {/* Informasi Sesi */}
            <div className="rounded-[18px] overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border2)' }}>
                <h2 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 16, color: 'var(--ink)' }}>Informasi Sesi</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={labelStyle}>Pasien</label>
                    <select value={form.patient_id} onChange={e => setField('patient_id', e.target.value)} required style={selectStyle}
                      onFocus={e => (e.target.style.borderColor = 'var(--accent2)')}
                      onBlur={e => (e.target.style.borderColor = 'var(--border)')}>
                      <option value="">Pilih pasien...</option>
                      {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Tanggal & waktu</label>
                    <input type="datetime-local" value={form.session_date} onChange={e => setField('session_date', e.target.value)} required style={inputStyle}
                      onFocus={e => (e.target.style.borderColor = 'var(--accent2)')}
                      onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Keluhan utama</label>
                  <input type="text" value={form.chief_complaint} onChange={e => setField('chief_complaint', e.target.value)}
                    placeholder="Contoh: Nyeri kepala sebelah kanan, berdenyut, muncul saat stres" required style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = 'var(--accent2)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={labelStyle}>Warna lidah</label>
                    <select value={form.tongue_color ?? ''} onChange={e => setField('tongue_color', (e.target.value as TongueColor) || undefined)} style={selectStyle}
                      onFocus={e => (e.target.style.borderColor = 'var(--accent2)')}
                      onBlur={e => (e.target.style.borderColor = 'var(--border)')}>
                      <option value="">Pilih...</option>
                      {TONGUE_COLORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Selaput lidah</label>
                    <select value={form.tongue_coating ?? ''} onChange={e => setField('tongue_coating', (e.target.value as TongueCoating) || undefined)} style={selectStyle}
                      onFocus={e => (e.target.style.borderColor = 'var(--accent2)')}
                      onBlur={e => (e.target.style.borderColor = 'var(--border)')}>
                      <option value="">Pilih...</option>
                      {TONGUE_COATINGS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={labelStyle}>Kualitas nadi</label>
                    <select value={form.pulse_quality ?? ''} onChange={e => setField('pulse_quality', (e.target.value as PulseQuality) || undefined)} style={selectStyle}
                      onFocus={e => (e.target.style.borderColor = 'var(--accent2)')}
                      onBlur={e => (e.target.style.borderColor = 'var(--border)')}>
                      <option value="">Pilih...</option>
                      {PULSE_QUALITIES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Skala nyeri (1–10)</label>
                    <input type="number" min={1} max={10} value={form.pain_scale ?? ''} onChange={e => setField('pain_scale', e.target.value ? Number(e.target.value) : undefined)} placeholder="7" style={inputStyle}
                      onFocus={e => (e.target.style.borderColor = 'var(--accent2)')}
                      onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Catatan tambahan</label>
                  <textarea value={form.notes ?? ''} onChange={e => setField('notes', e.target.value || undefined)}
                    placeholder="Observasi lain, faktor pemicu, kondisi emosional..."
                    rows={3} style={{ ...inputStyle, resize: 'vertical' }}
                    onFocus={e => (e.target.style.borderColor = 'var(--accent2)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                </div>
              </div>
            </div>

            {/* Titik Akupuntur */}
            <div className="rounded-[18px] overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border2)' }}>
                <h2 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 16, color: 'var(--ink)' }}>Titik Akupuntur yang Digunakan</h2>
                <span style={{ fontSize: 12, color: 'var(--ink3)' }}>Pilih atau ketik manual</span>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label style={labelStyle}>Meridian</label>
                  <div className="grid grid-cols-6 gap-1.5">
                    {MERIDIANS.map(m => {
                      const active = selectedMeridians.includes(m.code)
                      return (
                        <button key={m.code} type="button" onClick={() => toggleMeridian(m.code)}
                          style={{
                            padding: '8px 4px', border: '1px solid', borderRadius: 8, fontSize: 11.5,
                            cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
                            fontFamily: 'var(--font-dm-sans)', lineHeight: 1.3,
                            borderColor: active ? 'var(--accent)' : 'var(--border)',
                            background: active ? 'var(--accent-light)' : 'var(--surface)',
                            color: active ? 'var(--accent)' : 'var(--ink2)',
                            fontWeight: active ? 500 : 400,
                          }}>
                          {m.code} — {m.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Titik yang digunakan (pisah dengan koma)</label>
                  <input type="text" value={pointsText} onChange={e => setPointsText(e.target.value)}
                    placeholder="Contoh: GB20, LI4, ST36" style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = 'var(--accent2)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                </div>
              </div>
            </div>

            {/* Foto Lidah */}
            <div className="rounded-[18px] overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border2)' }}>
                <h2 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 16, color: 'var(--ink)' }}>Foto Lidah</h2>
                <span style={{ fontSize: 12, color: 'var(--ink3)' }}>Dianalisis Gemini Vision</span>
              </div>
              <div className="p-6">
                <TonguePhotoUploader
                  context={form.chief_complaint || undefined}
                  onAnalysisComplete={(analysis, imgBase64) => {
                    setTongueAnalysis(analysis)
                    setTongueImageBase64(imgBase64)
                    // Auto-fill tongue fields jika masih kosong
                    if (!form.tongue_color && analysis.warna) {
                      const colorMap: Record<string, string> = {
                        'merah': 'red', 'merah muda': 'pale-red', 'pucat': 'pale',
                        'ungu': 'purple', 'merah gelap': 'dark-red',
                      }
                      const found = Object.entries(colorMap).find(([k]) =>
                        analysis.warna.toLowerCase().includes(k)
                      )
                      if (found) setField('tongue_color', found[1] as TongueColor)
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* RIGHT: AI sidebar */}
          <div className="space-y-3">

            {/* Saran AI */}
            <div className="rounded-[18px] p-4" style={{ background: 'var(--ink)' }}>
              {/* Header */}
              <div className="flex items-center gap-2 mb-3">
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4A8C60', display: 'inline-block', animation: 'pulse-dot 2s infinite' }} />
                <span style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 14, color: '#F5F0E8' }}>Saran AI</span>
                <span className="ml-auto" style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, background: 'rgba(74,140,96,0.2)', color: '#7DC49A', letterSpacing: 0.5 }}>Gemini</span>
              </div>

              {/* Loading */}
              {aiLoading && (
                <div className="flex items-center gap-2 py-2" style={{ color: 'rgba(245,240,232,0.4)', fontSize: 13 }}>
                  <div className="flex gap-1">
                    {[0,1,2].map(i => (
                      <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(245,240,232,0.4)', display: 'inline-block', animation: `blink 1.2s ${i*0.2}s infinite` }} />
                    ))}
                  </div>
                  Menganalisis data pasien...
                </div>
              )}

              {/* Error */}
              {aiError && !aiLoading && (
                <div style={{ fontSize: 12, color: '#F87171', marginBottom: 10 }}>{aiError}</div>
              )}

              {/* Result dari AI — format chip */}
              {aiResult && !aiLoading && (
                <div className="space-y-3">
                  {/* Deskripsi sindrom */}
                  <p style={{ fontSize: 13, color: 'rgba(245,240,232,0.8)', lineHeight: 1.65 }}
                    dangerouslySetInnerHTML={{ __html: aiResult.deskripsi.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#F5F0E8">$1</strong>') }} />

                  {/* Titik */}
                  {aiResult.titik_utama?.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, color: 'rgba(245,240,232,0.4)', marginBottom: 7 }}>Titik yang direkomendasikan:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {aiResult.titik_utama.map(p => (
                          <button key={p} type="button"
                            onClick={() => { if (!pointsText.includes(p)) setPointsText(prev => prev ? `${prev}, ${p}` : p) }}
                            style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, fontWeight: 500, cursor: 'pointer', border: '1px solid rgba(74,140,96,0.4)', background: 'rgba(74,140,96,0.2)', color: '#7DC49A', fontFamily: 'monospace', transition: 'all 0.15s' }}>
                            {p} ✓
                          </button>
                        ))}
                        {aiResult.titik_tambahan?.map(p => (
                          <button key={p} type="button"
                            onClick={() => { if (!pointsText.includes(p)) setPointsText(prev => prev ? `${prev}, ${p}` : p) }}
                            style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, fontWeight: 500, cursor: 'pointer', border: '1px solid rgba(245,240,232,0.15)', background: 'rgba(245,240,232,0.05)', color: 'rgba(245,240,232,0.5)', fontFamily: 'monospace', transition: 'all 0.15s' }}>
                            + {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Catatan / tip */}
                  {aiResult.catatan && (
                    <p style={{ fontSize: 11, color: 'rgba(245,240,232,0.3)', lineHeight: 1.6, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
                      {aiResult.catatan}
                    </p>
                  )}

                  {/* Reset */}
                  <button type="button" onClick={() => { setAiResult(null); setAiError('') }}
                    style={{ fontSize: 11, color: 'rgba(245,240,232,0.3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-dm-sans)' }}>
                    Generate ulang
                  </button>
                </div>
              )}

              {/* Default — belum generate */}
              {!aiResult && !aiLoading && !aiError && (
                <>
                  <p style={{ fontSize: 13, color: 'rgba(245,240,232,0.45)', lineHeight: 1.65, marginBottom: 12 }}>
                    {form.chief_complaint
                      ? 'Klik tombol di bawah untuk mendapat rekomendasi titik akupuntur berbasis data yang diisi.'
                      : 'Isi keluhan utama, warna lidah, dan kualitas nadi untuk mendapat saran AI.'}
                  </p>
                  <button type="button" onClick={generateAISuggestion}
                    disabled={!form.chief_complaint.trim()}
                    style={{ width: '100%', padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: form.chief_complaint ? 'pointer' : 'not-allowed', border: '1px solid rgba(74,140,96,0.4)', background: form.chief_complaint ? 'rgba(74,140,96,0.15)' : 'rgba(74,140,96,0.05)', color: form.chief_complaint ? '#7DC49A' : 'rgba(74,140,96,0.4)', fontFamily: 'var(--font-dm-sans)', transition: 'all 0.15s' }}>
                    ✦ Generate saran AI
                  </button>
                </>
              )}
            </div>

            {/* Riwayat sesi sebelumnya */}
            {prevSessions.length > 0 && (
              <div className="rounded-[18px] p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                  Riwayat Sesi Sebelumnya
                </div>
                {prevSessions.map((s, i) => (
                  <div key={s.id} style={{ paddingBottom: i < prevSessions.length - 1 ? 10 : 0, marginBottom: i < prevSessions.length - 1 ? 10 : 0, borderBottom: i < prevSessions.length - 1 ? '1px solid var(--border2)' : 'none' }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 3 }}>
                      Sesi ke-{prevSessions.length - i} ({new Date(s.session_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })})
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 2 }}>{s.points_used?.join(', ') ?? '—'}</div>
                    {s.notes && <div style={{ fontSize: 12, color: 'var(--ink3)' }}>Hasil: {s.notes.split('.')[0]}</div>}
                  </div>
                ))}
              </div>
            )}

            {/* Tip TCM */}
            {suggestion.tip && suggestion.primary.length > 0 && (
              <div className="rounded-[18px] p-4" style={{ background: 'var(--accent-light)', border: '1px solid rgba(45,90,61,0.15)' }}>
                <div style={{ fontSize: 11, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Tip TCM</div>
                <div style={{ fontSize: 12.5, color: 'var(--accent)', lineHeight: 1.6 }}
                  dangerouslySetInnerHTML={{ __html: suggestion.tip.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
              </div>
            )}

          </div>
        </div>
      </form>
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
