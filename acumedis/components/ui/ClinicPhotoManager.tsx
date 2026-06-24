'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface ClinicPhoto { id: string; photoBase64: string; caption?: string | null; createdAt: string }
interface Props { 
  photos?: ClinicPhoto[]
  practitionerId?: string  // props lama — fetch sendiri
}

export function ClinicPhotoManager({ photos: initialPhotos, practitionerId }: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [photos, setPhotos] = useState<ClinicPhoto[]>(initialPhotos || [])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (practitionerId && !initialPhotos) {
      fetch('/api/clinic-photos').then(r => r.json()).then(setPhotos).catch(() => {})
    }
  }, [practitionerId, initialPhotos])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1]
        const res = await fetch('/api/clinic-photos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photoBase64: base64 }),
        })
        if (!res.ok) throw new Error('Gagal upload')
        const photo = await res.json()
        setPhotos(p => [...p, photo])
        router.refresh()
      }
      reader.readAsDataURL(file)
    } catch { alert('Gagal upload foto') }
    finally { setLoading(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus foto ini?')) return
    await fetch(`/api/clinic-photos/${id}`, { method: 'DELETE' })
    setPhotos(p => p.filter(ph => ph.id !== id))
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {photos.map(p => (
          <div key={p.id} className="relative group rounded-xl overflow-hidden aspect-square bg-gray-100">
            <img src={`data:image/jpeg;base64,${p.photoBase64}`} alt={p.caption || ''} className="w-full h-full object-cover" />
            <button onClick={() => handleDelete(p.id)}
              className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              ×
            </button>
          </div>
        ))}
        <button onClick={() => inputRef.current?.click()} disabled={loading}
          className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-teal-400 flex items-center justify-center text-gray-400 text-2xl">
          {loading ? '...' : '+'}
        </button>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
    </div>
  )
}

export default ClinicPhotoManager
