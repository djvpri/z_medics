'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { notFound } from 'next/navigation'
import Topbar from '@/components/layout/Topbar'
import { mockSessions } from '@/lib/mock-data'
import { AIRecommendation } from '@/types'
import TonguePhotoUploader from '@/components/sessions/TonguePhotoUploader'

function DeleteButtonClient({ id }: { id: string }) {
  const router = useRouter()
  const [step, setStep] = useState<'idle' | 'confirm' | 'loading'>('idle')

  async function handleDelete() {
    setStep('loading')
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.from('sessions').delete().eq('id', id)
    router.push('/sesi')
  }

  const btnBase: React.CSSProperties = { padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-dm-sans)', border: '1px solid var(--border)' }

  if (step === 'idle') return <button type="button" onClick={() => setStep('confirm')} style={{ ...btnBase, background: 'var(--surface2)', color: 'var(--ink2)' }}>Hapus</button>
  if (step === 'loading') return <span style={{ fontSize: 13, color: 'var(--ink3)' }}>Menghapus...</span>
  return (
    <div className="flex items-center gap-2">
      <span style={{ fontSize: 12, color: 'var(--ink3)' }}>Yakin hapus sesi ini?</span>
      <button type="button" onClick={handleDelete} style={{ ...btnBase, background: 'var(--red)', color: '#fff', border: 'none' }}>Ya, Hapus</button>
      <button type="button" onClick={() => setStep('idle')} style={{ ...btnBase, background: 'transparent', color: 'var(--ink3)' }}>Batal</button>
    </div>
  )
}

const tongueColorLabel: Record<string, string> = {
  'red': 'Merah', 'pale-red': 'Merah Muda', 'pale': 'Pucat',
  'purple': 'Ungu', 'dark-red': 'Merah Gelap',
}
const tongueCoatingLabel: Record<string, string> = {
  'thin-white': 'Tipis Putih', 'thick-white': 'Tebal Putih',
  'thin-yellow': 'Tipis Kuning', 'thick-yellow': 'Tebal Kuning', 'none': 'Tidak Ada',
}
const pulseLabel: Record<string, string> = {
  'wiry': 'Tegang', 'slippery': 'Licin', 'weak': 'Lemah',
  'rapid': 'Cepat', 'slow': 'Lambat', 'deep': 'Dalam', 'floating': 'Mengambang',
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm text-gray-900">{value || '—'}</span>
    </div>
  )
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

type SesiType = typeof mockSessions[0]

function SOAPSection({ sesi }: { sesi: SesiType }) {
  const [result, setResult] = useState<{ text: string; model: string; timestamp: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  async function generateSOAP() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'soap-notes',
          context: {
            chief_complaint: sesi.chief_complaint,
            tongue_color: sesi.tongue_color,
            tongue_coating: sesi.tongue_coating,
            pulse_quality: sesi.pulse_quality,
            points_used: sesi.points_used,
            notes: sesi.notes,
          },
        }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setResult({ text: data.result, model: data.model, timestamp: data.timestamp })
    } catch {
      setError('Gagal menghubungi AI. Pastikan API key sudah dikonfigurasi.')
    } finally {
      setLoading(false)
    }
  }

  async function copyToClipboard() {
    if (!result) return
    await navigator.clipboard.writeText(result.text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">SOAP Notes</h2>
          <p className="text-xs text-gray-400 mt-0.5">Generate catatan klinis terstruktur otomatis</p>
        </div>
        <div className="flex items-center gap-2">
          {result && (
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors"
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Tersalin
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                  </svg>
                  Salin
                </>
              )}
            </button>
          )}
          {!result && (
            <button
              onClick={generateSOAP}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-900 disabled:opacity-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              {loading ? 'Generating...' : 'Generate SOAP Notes'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {loading && (
        <div className="py-8 text-center">
          <div className="inline-block w-5 h-5 border-2 border-gray-800 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-gray-500">Menyusun SOAP notes...</p>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded font-mono">{result.model}</span>
            <span>•</span>
            <span>{new Date(result.timestamp).toLocaleString('id-ID')}</span>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-mono text-xs">
            {result.text}
          </div>
          <button onClick={() => setResult(null)} className="text-xs text-gray-400 hover:text-gray-600">
            Generate ulang
          </button>
        </div>
      )}

      {!result && !loading && !error && (
        <div className="py-6 text-center">
          <p className="text-sm text-gray-400">
            Klik tombol di atas untuk generate SOAP notes otomatis dari data sesi ini.
          </p>
        </div>
      )}
    </div>
  )
}

interface ParsedRec {
  sindrom: string
  deskripsi: string
  titik_utama: string[]
  titik_tambahan: string[]
  catatan: string
  model: string
  timestamp: string
}

function AISection({ sesi }: { sesi: SesiType }) {
  const [result, setResult] = useState<ParsedRec | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function getRecommendation() {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'treatment-recommendation',
          context: {
            chief_complaint: sesi.chief_complaint,
            tongue_color: sesi.tongue_color,
            tongue_coating: sesi.tongue_coating,
            pulse_quality: sesi.pulse_quality,
            pain_scale: sesi.pain_scale,
            notes: sesi.notes,
          },
        }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); return }

      // Ekstrak JSON dari respons (mungkin dibungkus ```json ... ```)
      const raw = data.result ?? ''
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0])
          setResult({ ...parsed, model: data.model, timestamp: data.timestamp })
        } catch {
          setError('Format respons tidak valid.')
        }
      } else {
        setError('Gagal memparse respons AI.')
      }
    } catch {
      setError('Gagal menghubungi AI.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl p-5" style={{ background: 'var(--ink)' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4A8C60', display: 'inline-block', animation: 'pulse-dot 2s infinite' }} />
            <h2 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 15, color: '#F5F0E8' }}>Rekomendasi AI</h2>
            <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, background: 'rgba(74,140,96,0.2)', color: '#7DC49A', letterSpacing: 0.5 }}>Gemini</span>
          </div>
          <p style={{ fontSize: 11, color: 'rgba(245,240,232,0.35)', marginTop: 2 }}>Rekomendasi titik akupuntur berbasis data sesi</p>
        </div>
        {!result && !loading && (
          <button onClick={getRecommendation} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, border: '1px solid rgba(74,140,96,0.4)', background: 'rgba(74,140,96,0.15)', color: '#7DC49A', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)' }}>
            ✦ Minta Rekomendasi
          </button>
        )}
      </div>

      {error && <div style={{ fontSize: 12, color: '#F87171', marginBottom: 8 }}>{error}</div>}

      {loading && (
        <div className="flex items-center gap-2 py-4" style={{ color: 'rgba(245,240,232,0.4)', fontSize: 13 }}>
          <div className="flex gap-1">
            {[0,1,2].map(i => <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(245,240,232,0.4)', display: 'inline-block', animation: `blink 1.2s ${i*0.2}s infinite` }} />)}
          </div>
          Menganalisis data sesi...
        </div>
      )}

      {result && !loading && (
        <div className="space-y-3">
          <p style={{ fontSize: 13, color: 'rgba(245,240,232,0.8)', lineHeight: 1.65 }}
            dangerouslySetInnerHTML={{ __html: result.deskripsi.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#F5F0E8">$1</strong>') }} />

          {result.titik_utama?.length > 0 && (
            <div>
              <p style={{ fontSize: 10, color: 'rgba(245,240,232,0.35)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 7 }}>Titik yang direkomendasikan:</p>
              <div className="flex flex-wrap gap-1.5">
                {result.titik_utama.map(p => (
                  <span key={p} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, fontWeight: 500, border: '1px solid rgba(74,140,96,0.4)', background: 'rgba(74,140,96,0.2)', color: '#7DC49A', fontFamily: 'monospace' }}>{p} ✓</span>
                ))}
                {result.titik_tambahan?.map(p => (
                  <span key={p} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, fontWeight: 500, border: '1px solid rgba(245,240,232,0.15)', background: 'rgba(245,240,232,0.05)', color: 'rgba(245,240,232,0.5)', fontFamily: 'monospace' }}>+ {p}</span>
                ))}
              </div>
            </div>
          )}

          {result.catatan && (
            <p style={{ fontSize: 11, color: 'rgba(245,240,232,0.3)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10, lineHeight: 1.6 }}>
              {result.catatan}
            </p>
          )}

          <div className="flex items-center gap-3">
            <span style={{ fontSize: 10, color: 'rgba(245,240,232,0.25)', fontFamily: 'monospace' }}>{result.model} · {new Date(result.timestamp).toLocaleTimeString('id-ID')}</span>
            <button onClick={() => setResult(null)} style={{ fontSize: 11, color: 'rgba(245,240,232,0.25)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Generate ulang</button>
          </div>
        </div>
      )}

      {!result && !loading && !error && (
        <p style={{ fontSize: 13, color: 'rgba(245,240,232,0.35)', paddingBottom: 4 }}>
          Klik tombol di atas untuk mendapat rekomendasi titik akupuntur berbasis data sesi ini.
        </p>
      )}
    </div>
  )
}

export default function DetailSesiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [sesi, setSesi] = useState<any>(mockSessions.find(s => s.id === id) ?? null)
  const [fetching, setFetching] = useState(!mockSessions.find(s => s.id === id))

  useEffect(() => {
    if (sesi) return // sudah ketemu di mock
    async function load() {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data } = await supabase
        .from('sessions')
        .select('*, patient:patients(id, name, gender)')
        .eq('id', id)
        .single()
      setSesi(data ?? null)
      setFetching(false)
    }
    load()
  }, [id])

  if (fetching) {
    return (
      <>
        <Topbar title="Detail Sesi" back="/sesi" />
        <div className="p-7 text-center" style={{ fontSize: 13, color: 'var(--ink3)' }}>Memuat data sesi...</div>
      </>
    )
  }

  if (!sesi) return notFound()

  return (
    <>
      <Topbar
        title={`Sesi — ${sesi.patient?.name ?? 'Pasien'}`}
        subtitle={`${formatDate(sesi.session_date)}, ${formatTime(sesi.session_date)}`}
        back="/sesi"
        actions={
          <div className="flex items-center gap-2">
            <DeleteButtonClient id={sesi.id} />
            <Link href={`/sesi/${sesi.id}/edit`} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--ink2)', textDecoration: 'none', fontFamily: 'var(--font-dm-serif)' }}>
              Edit
            </Link>
          </div>
        }
      />

      <div className="p-6 flex-1 space-y-4">

        {/* Info Umum */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Informasi Sesi</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            <InfoRow label="Pasien" value={sesi.patient?.name} />
            <InfoRow label="Tanggal" value={`${formatDate(sesi.session_date)}, ${formatTime(sesi.session_date)}`} />
            <InfoRow label="Durasi" value={sesi.duration_minutes ? `${sesi.duration_minutes} menit` : undefined} />
            <div className="col-span-2 md:col-span-3">
              <span className="text-xs text-gray-500">Keluhan Utama</span>
              <p className="text-sm text-gray-900 mt-0.5">{sesi.chief_complaint}</p>
            </div>
          </div>
        </div>

        {/* Diagnosis TCM */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Temuan Klinis TCM</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <InfoRow
              label="Warna Lidah"
              value={sesi.tongue_color ? tongueColorLabel[sesi.tongue_color] : undefined}
            />
            <InfoRow
              label="Selaput Lidah"
              value={sesi.tongue_coating ? tongueCoatingLabel[sesi.tongue_coating] : undefined}
            />
            <InfoRow
              label="Kualitas Nadi"
              value={sesi.pulse_quality ? pulseLabel[sesi.pulse_quality] : undefined}
            />
            <InfoRow
              label="Skala Nyeri"
              value={sesi.pain_scale ? `${sesi.pain_scale}/10` : undefined}
            />
            {sesi.tcm_diagnosis && (
              <div className="col-span-2 md:col-span-4">
                <span className="text-xs text-gray-500">Diagnosis TCM</span>
                <p className="text-sm text-gray-900 mt-0.5">{sesi.tcm_diagnosis}</p>
              </div>
            )}
          </div>
        </div>

        {/* Titik Akupuntur */}
        {sesi.points_used && sesi.points_used.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Titik yang Digunakan</h2>
            <div className="flex flex-wrap gap-2">
              {sesi.points_used.map((p: string) => (
                <span key={p} className="px-3 py-1 bg-teal-50 text-teal-700 text-sm font-mono rounded-lg border border-teal-100">
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Catatan */}
        {sesi.notes && (
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Catatan Klinis</h2>
            <p className="text-sm text-gray-700 leading-relaxed">{sesi.notes}</p>
          </div>
        )}

        {/* Foto Lidah */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border2)' }}>
            <h2 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 16, color: 'var(--ink)' }}>Foto Lidah</h2>
            <span style={{ fontSize: 12, color: 'var(--ink3)' }}>Analisis Gemini Vision</span>
          </div>
          <div className="p-5">
            <TonguePhotoUploader context={sesi.chief_complaint} sessionId={sesi.id} />
          </div>
        </div>

        {/* SOAP Notes */}
        <SOAPSection sesi={sesi} />

        {/* AI Recommendation */}
        <AISection sesi={sesi} />

      </div>
    </>
  )
}
