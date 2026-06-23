'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  currentUrl?: string
  table: 'practitioners' | 'patients'
  id: string
  size?: number
}

export function AvatarUploader({ currentUrl, table, id, size = 80 }: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState(currentUrl)
  const [loading, setLoading] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1]
        setPreview(reader.result as string)
        const res = await fetch(`/api/${table}/${id}/avatar`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatarBase64: base64 }),
        })
        if (!res.ok) throw new Error('Gagal upload avatar')
        router.refresh()
      }
      reader.readAsDataURL(file)
    } catch {
      alert('Gagal upload foto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div onClick={() => inputRef.current?.click()}
        className="w-full h-full rounded-full overflow-hidden bg-gray-100 cursor-pointer border-2 border-dashed border-gray-300 hover:border-teal-400 flex items-center justify-center">
        {preview ? (
          <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <span className="text-gray-400 text-2xl">+</span>
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
