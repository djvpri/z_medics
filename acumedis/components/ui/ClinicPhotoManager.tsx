'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

const MAX_PHOTOS = 5

interface Photo {
  id: string
  url: string
}

async function compressImage(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const MAX = 1200
      let { width, height } = img
      if (width > MAX || height > MAX) {
        if (width > height) { height = (height * MAX) / width; width = MAX }
        else { width = (width * MAX) / height; height = MAX }
      }
      canvas.width = width; canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }
    img.src = dataUrl
  })
}

export default function ClinicPhotoManager({ practitionerId }: { practitionerId: string }) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!practitionerId) return
    createClient()
      .from('clinic_photos')
      .select('id, url')
      .eq('practitioner_id', practitionerId)
      .order('created_at')
      .then(({ data }) => setPhotos(data ?? []))
  }, [practitionerId])

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || photos.length >= MAX_PHOTOS) return
    if (file.size > 5 * 1024 * 1024) { alert('Ukuran file maksimal 5 MB'); return }

    setUploading(true)
    try {
      const reader = new FileReader()
      reader.onload = async (ev) => {
        const compressed = await compressImage(ev.target?.result as string)
        const supabase = createClient()
        const byteArr = Uint8Array.from(atob(compressed.split(',')[1]), c => c.charCodeAt(0))
        const blob = new Blob([byteArr], { type: 'image/jpeg' })
        const filename = `clinic-photo-${practitionerId}-${Date.now()}.jpg`

        const { data: uploadData, error } = await supabase.storage
          .from('avatars')
          .upload(filename, blob, { contentType: 'image/jpeg', upsert: true })

        if (error) { alert('Gagal upload: ' + error.message); setUploading(false); return }

        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(uploadData.path)

        const { data: inserted } = await supabase
          .from('clinic_photos')
          .insert({ practitioner_id: practitionerId, url: publicUrl })
          .select('id, url')
          .single()

        if (inserted) setPhotos(prev => [...prev, inserted])
        setUploading(false)
      }
      reader.readAsDataURL(file)
    } catch {
      setUploading(false)
    }
    e.target.value = ''
  }

  async function deletePhoto(photo: Photo) {
    if (!confirm('Hapus foto ini?')) return
    await createClient().from('clinic_photos').delete().eq('id', photo.id)
    setPhotos(prev => prev.filter(p => p.id !== photo.id))
  }

  return (
    <div>
      <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink2)', marginBottom: 4 }}>
        Foto Klinik{' '}
        <span style={{ color: 'var(--ink3)', fontWeight: 400 }}>({photos.length}/{MAX_PHOTOS})</span>
      </p>
      <p style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 12 }}>
        JPG, PNG · Maks 5 MB per foto · Foto pertama jadi cover di direktori
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {photos.map(photo => (
          <div key={photo.id} style={{ position: 'relative', width: 100, height: 80, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
            <img src={photo.url} alt="Foto klinik" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <button
              type="button"
              onClick={() => deletePhoto(photo)}
              style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.65)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, lineHeight: 1 }}
            >
              ×
            </button>
          </div>
        ))}

        {photos.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            style={{ width: 100, height: 80, borderRadius: 10, border: '1.5px dashed var(--border)', background: 'var(--bg)', cursor: uploading ? 'wait' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, color: 'var(--ink3)', fontSize: 11, transition: 'border-color 0.15s' }}
          >
            {uploading
              ? <div style={{ width: 16, height: 16, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              : (
                <>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Tambah Foto
                </>
              )}
          </button>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} style={{ display: 'none' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
