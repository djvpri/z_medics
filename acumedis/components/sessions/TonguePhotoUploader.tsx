'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Props { sessionId: string }

export function TonguePhotoUploader({ sessionId }: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [analysing, setAnalysing] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function uploadPhoto(base64: string) {
    setLoading(true)
    setAnalysing(true)
    try {
      const res = await fetch('/api/session-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, photoType: 'tongue', photoBase64: base64 }),
      })
      const d = await res.json()
      if (d.aiAnalysis) setResult(d.aiAnalysis)
      router.refresh()
    } catch { alert('Gagal upload foto lidah') }
    finally { setLoading(false); setAnalysing(false) }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      setPreview(dataUrl)
      uploadPhoto(dataUrl.split(',')[1])
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-3">
      {preview && (
        <div className="relative">
          <img src={preview} alt="Foto lidah" className="w-full max-w-xs rounded-xl object-cover" />
        </div>
      )}
      {analysing && (
        <div className="flex items-center gap-2 text-sm text-teal-600">
          <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
          Menganalisis dengan AI...
        </div>
      )}
      {result && (
        <div className="bg-teal-50 border border-teal-100 rounded-xl p-3 text-sm text-gray-700 whitespace-pre-wrap">
          {result}
        </div>
      )}
      <button onClick={() => inputRef.current?.click()} disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 disabled:opacity-50">
        📷 {loading ? 'Mengupload...' : 'Foto Lidah'}
      </button>
      <canvas ref={canvasRef} className="hidden" />
      <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
    </div>
  )
}
export default TonguePhotoUploader
