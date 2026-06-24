'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  currentUrl?: string | null
  size?: number
  // Props baru (pakai API)
  table?: 'practitioners' | 'patients'
  id?: string
  // Props lama (pakai callback)
  name?: string
  filePrefix?: string
  onUpload?: (url: string) => void
}

export function AvatarUploader({ currentUrl, size = 80, table, id, name, onUpload }: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState(currentUrl || undefined)
  const [loading, setLoading] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const dataUrl = reader.result as string
        const base64 = dataUrl.split(',')[1]
        setPreview(dataUrl)

        if (table && id) {
          // Mode baru: simpan ke API
          await fetch(`/api/${table}/${id}/avatar`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ avatarBase64: base64 }),
          })
          router.refresh()
        } else if (onUpload) {
          // Mode lama: panggil callback dengan data URL
          onUpload(dataUrl)
        }
      }
      reader.readAsDataURL(file)
    } catch {
      alert('Gagal upload foto')
    } finally {
      setLoading(false)
    }
  }

  const initials = name ? name.slice(0, 2).toUpperCase() : '?'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div onClick={() => inputRef.current?.click()}
        className="w-full h-full rounded-full overflow-hidden bg-gray-100 cursor-pointer border-2 border-dashed border-gray-300 hover:border-teal-400 flex items-center justify-center">
        {preview ? (
          <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <span className="text-gray-500 font-medium text-sm">{initials}</span>
        )}
        {loading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  )
}

export default AvatarUploader
