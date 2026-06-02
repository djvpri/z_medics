'use client'

import { useState, useRef, useEffect } from 'react'
import { useT } from '@/contexts/LanguageContext'

interface TongueAnalysis {
  warna: string
  selaput: string
  bentuk: string
  kelembaban: string
  indikasi: string[]
  ringkasan: string
  rekomendasi: string
}

interface Props {
  onAnalysisComplete?: (analysis: TongueAnalysis, imageBase64: string) => void
  context?: string
  sessionId?: string  // jika ada, simpan analisis ke session_photos
}

// Kompres gambar ke max 800px dan JPEG 80%
function compressImage(dataUrl: string): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const MAX = 800
      const ratio = Math.min(MAX / img.width, MAX / img.height, 1)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * ratio)
      canvas.height = Math.round(img.height * ratio)
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const compressed = canvas.toDataURL('image/jpeg', 0.8)
      resolve({ base64: compressed.split(',')[1], mimeType: 'image/jpeg' })
    }
    img.onerror = () => {
      // fallback: pakai data asli
      const base64 = dataUrl.split(',')[1]
      resolve({ base64, mimeType: 'image/jpeg' })
    }
    img.src = dataUrl
  })
}

export default function TonguePhotoUploader({ onAnalysisComplete, context, sessionId }: Props) {
  const { t } = useT()
  const [preview, setPreview] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TongueAnalysis | null>(null)
  const [error, setError] = useState('')
  const [sizeKb, setSizeKb] = useState(0)
  const [savedPhotoUrl, setSavedPhotoUrl] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load analisis + foto yang sudah tersimpan
  useEffect(() => {
    if (!sessionId) return
    async function loadSaved() {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data } = await supabase
        .from('session_photos')
        .select('ai_analysis, storage_path')
        .eq('session_id', sessionId)
        .eq('photo_type', 'tongue')
        .order('created_at', { ascending: false })
        .limit(1)
      if (data?.[0]) {
        if (data[0].storage_path && data[0].storage_path !== 'local') {
          setSavedPhotoUrl(data[0].storage_path)
        }
        if (data[0].ai_analysis) {
          try {
            setResult(JSON.parse(data[0].ai_analysis))
          } catch {}
        }
      }
    }
    loadSaved()
  }, [sessionId])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setResult(null)
    setError('')

    const reader = new FileReader()
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string
      setPreview(dataUrl)

      // Kompres sebelum simpan
      const { base64 } = await compressImage(dataUrl)
      setImageBase64(base64)
      setSizeKb(Math.round(base64.length * 0.75 / 1024))
    }
    reader.readAsDataURL(file)
  }

  async function analyze() {
    if (!imageBase64) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/analyze-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageBase64,
          mimeType: 'image/jpeg',
          context,
        }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setError(data.error ?? `Error ${res.status}`)
        return
      }

      if (!data.result) {
        setError('Tidak ada hasil dari AI. Coba lagi.')
        return
      }

      setResult(data.result)
      onAnalysisComplete?.(data.result, imageBase64)

      // Upload foto ke Supabase Storage + simpan analisis
      if (sessionId) {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()

        let storage_path = 'local'

        try {
          // Konversi base64 ke Blob
          const byteArr = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0))
          const blob = new Blob([byteArr], { type: 'image/jpeg' })
          const filename = `${sessionId}-${Date.now()}.jpg`

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('tongue-photos')
            .upload(filename, blob, { contentType: 'image/jpeg', upsert: true })

          if (!uploadError && uploadData) {
            const { data: { publicUrl } } = supabase.storage
              .from('tongue-photos')
              .getPublicUrl(uploadData.path)
            storage_path = publicUrl
            setSavedPhotoUrl(publicUrl)
          }
        } catch {}

        // Hapus foto lama untuk sesi ini jika ada, lalu insert baru
        await supabase.from('session_photos')
          .delete()
          .eq('session_id', sessionId)
          .eq('photo_type', 'tongue')

        await supabase.from('session_photos').insert({
          session_id: sessionId,
          photo_type: 'tongue',
          storage_path,
          ai_analysis: JSON.stringify(data.result),
        })
      }
    } catch (e: any) {
      setError(e?.message ?? 'Gagal menghubungi server.')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setPreview(null)
    setImageBase64(null)
    setResult(null)
    setError('')
    setSizeKb(0)
    setSavedPhotoUrl(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-3">

      {/* Drop zone — hanya tampil jika belum ada preview DAN belum ada result */}
      {!preview && !result && (
        <div
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 cursor-pointer rounded-xl"
          style={{ border: '2px dashed var(--border)', background: 'var(--surface2)', padding: '28px 16px', minHeight: 120, transition: 'border-color 0.15s' }}
          onDragOver={e => { e.preventDefault(); (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent2)' }}
          onDragLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
          onDrop={e => {
            e.preventDefault()
            ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
            const file = e.dataTransfer.files[0]
            if (file && file.type.startsWith('image/')) {
              handleFileChange({ target: { files: [file] } } as any)
            }
          }}
        >
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: 'var(--ink3)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
          </svg>
          <p style={{ fontSize: 13, color: 'var(--ink3)' }}>{t.tongue.dropzone}</p>
          <p style={{ fontSize: 11, color: 'var(--ink3)', opacity: 0.6 }}>{t.tongue.dropzoneHint}</p>
        </div>
      )}

      {/* Preview foto yang baru diupload — hanya tampil jika ada preview */}
      {preview && (
        <div className="relative rounded-xl overflow-hidden" style={{ background: '#F8EEF0' }}>
          <img src={preview} alt="Foto lidah" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }} />
          <div className="absolute bottom-2 left-2 rounded-md px-2 py-0.5" style={{ background: 'rgba(28,24,19,0.55)', fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>
            {sizeKb} KB setelah kompres
          </div>
          <button type="button" onClick={reset} className="absolute top-2 right-2 rounded-full flex items-center justify-center"
            style={{ width: 28, height: 28, background: 'rgba(28,24,19,0.6)', border: 'none', cursor: 'pointer' }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} style={{ display: 'none' }} />

      {/* Tombol analisis / loading */}
      {preview && !result && (
        <button type="button" onClick={analyze} disabled={loading}
          className="w-full rounded-lg flex items-center justify-center gap-2"
          style={{
            padding: '9px 16px', fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-dm-sans)',
            border: 'none', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
            background: loading ? 'var(--bg2)' : 'var(--accent)',
            color: loading ? 'var(--ink2)' : '#F5F0E8',
          }}>
          {loading ? (
            <>
              <span style={{ width: 14, height: 14, border: '2px solid var(--ink3)', borderTopColor: 'var(--accent)', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
              {t.tongue.analyzing}
            </>
          ) : (
            <>
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              {t.tongue.analyzeBtn}
            </>
          )}
        </button>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg p-3 flex items-start gap-2" style={{ background: 'var(--red-light)', fontSize: 12, color: 'var(--red)' }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && savedPhotoUrl && (
        <div
          onClick={() => setLightbox(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}
        >
          <img
            src={savedPhotoUrl}
            alt="Foto lidah"
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 12 }}
          />
          <button
            onClick={() => setLightbox(false)}
            style={{ position: 'absolute', top: 20, right: 24, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', color: '#fff', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            ✕
          </button>
        </div>
      )}

    {/* Foto tersimpan dari Supabase Storage */}
      {savedPhotoUrl && !preview && (
        <div
          className="relative rounded-xl overflow-hidden"
          style={{ background: '#F8EEF0', cursor: 'zoom-in' }}
          onClick={() => setLightbox(true)}
          title="Klik untuk memperbesar"
        >
          <img src={savedPhotoUrl} alt="Foto lidah tersimpan" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }} />
          <div className="absolute bottom-2 left-2 rounded-md px-2 py-0.5" style={{ background: 'rgba(28,24,19,0.55)', fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>
            {t.tongue.savedLabel}
          </div>
          <div className="absolute top-2 right-2 rounded-md px-2 py-0.5 flex items-center gap-1" style={{ background: 'rgba(28,24,19,0.55)', fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
            </svg>
          </div>
        </div>
      )}

    {/* Hasil */}
      {result && (
        <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--ink)' }}>
          <div className="flex items-center gap-2">
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4A8C60', display: 'inline-block' }} />
            <span style={{ fontSize: 11, color: 'rgba(245,240,232,0.45)', letterSpacing: 1, textTransform: 'uppercase' }}>{t.tongue.resultTitle}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              ['Warna', result.warna],
              ['Selaput', result.selaput],
              ['Bentuk', result.bentuk],
              ['Kelembaban', result.kelembaban],
            ].map(([label, val]) => (
              <div key={label} className="rounded-lg p-2.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 10, color: 'rgba(245,240,232,0.3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 12.5, fontWeight: 500, color: 'rgba(245,240,232,0.9)' }}>{val}</div>
              </div>
            ))}
          </div>

          {result.indikasi?.length > 0 && (
            <div>
              <div style={{ fontSize: 10, color: 'rgba(245,240,232,0.3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Indikasi Sindrom</div>
              <div className="flex flex-wrap gap-1.5">
                {result.indikasi.map((s, i) => (
                  <span key={i} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: 'rgba(74,140,96,0.2)', border: '1px solid rgba(74,140,96,0.3)', color: '#7DC49A' }}>{s}</span>
                ))}
              </div>
            </div>
          )}

          <p style={{ fontSize: 12.5, color: 'rgba(245,240,232,0.75)', lineHeight: 1.6 }}>{result.ringkasan}</p>

          {result.rekomendasi && (
            <p style={{ fontSize: 11, color: 'rgba(245,240,232,0.3)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10, lineHeight: 1.6 }}>
              {result.rekomendasi}
            </p>
          )}

          <button type="button" onClick={() => { reset(); setTimeout(() => inputRef.current?.click(), 100) }}
            style={{ fontSize: 11, color: 'rgba(74,140,96,0.7)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-dm-sans)' }}>
            {savedPhotoUrl ? t.tongue.uploadReplace : t.tongue.uploadNew}
          </button>
        </div>
      )}


      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
