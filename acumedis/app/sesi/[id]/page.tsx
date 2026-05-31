'use client'

import { useState, use } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Topbar from '@/components/layout/Topbar'
import { mockSessions } from '@/lib/mock-data'
import { AIRecommendation } from '@/types'

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

function AISection({ sesi }: { sesi: SesiType }) {
  const [result, setResult] = useState<AIRecommendation | null>(
    sesi.ai_recommendation ?? null
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function getRecommendation() {
    setLoading(true)
    setError('')
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
      if (!res.ok) throw new Error('Gagal mendapat respons AI')
      const data = await res.json()
      setResult(data)
    } catch (e) {
      setError('Gagal menghubungi AI. Pastikan API key sudah dikonfigurasi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Rekomendasi AI</h2>
          <p className="text-xs text-gray-400 mt-0.5">Didukung oleh Claude (TCM Assistant)</p>
        </div>
        {!result && (
          <button
            onClick={getRecommendation}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            {loading ? 'Meminta AI...' : 'Minta Rekomendasi'}
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {loading && (
        <div className="py-8 text-center">
          <div className="inline-block w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-gray-500">AI sedang menganalisis data sesi...</p>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded font-mono">{result.model}</span>
            <span>•</span>
            <span>{new Date(result.timestamp).toLocaleString('id-ID')}</span>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {result.result}
          </div>
          <button
            onClick={() => setResult(null)}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Minta ulang
          </button>
        </div>
      )}

      {!result && !loading && !error && (
        <div className="py-6 text-center">
          <p className="text-sm text-gray-400">
            Klik tombol di atas untuk mendapat rekomendasi titik akupuntur berbasis data sesi ini.
          </p>
        </div>
      )}
    </div>
  )
}

export default function DetailSesiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const sesi = mockSessions.find(s => s.id === id)
  if (!sesi) notFound()

  return (
    <>
      <Topbar
        title={`Sesi — ${sesi.patient?.name ?? 'Pasien'}`}
        subtitle={`${formatDate(sesi.session_date)}, ${formatTime(sesi.session_date)}`}
        actions={
          <Link href="/sesi" className="text-sm text-gray-500 hover:text-gray-700">
            ← Kembali
          </Link>
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
              {sesi.points_used.map(p => (
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

        {/* SOAP Notes */}
        <SOAPSection sesi={sesi} />

        {/* AI Recommendation */}
        <AISection sesi={sesi} />

      </div>
    </>
  )
}
