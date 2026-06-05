'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  currentUrl?: string | null
  name: string
  size?: number
  onUpload: (url: string) => void
  filePrefix?: string
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

async function compressImage(dataUrl: string, maxSizeKb = 400): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const MAX = 400
      let { width, height } = img
      if (width > height && width > MAX) { height = (height * MAX) / width; width = MAX }
      else if (height > width && height > MAX) { width = (width * MAX) / height; height = MAX }
      else if (width > MAX) { width = height = MAX }
      canvas.width = width; canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      let quality = 0.85
      let result = canvas.toDataURL('image/jpeg', quality)
      while (result.length * 0.75 / 1024 > maxSizeKb && quality > 0.3) {
        quality -= 0.1
        result = canvas.toDataURL('image/jpeg', quality)
      }
      resolve(result)
    }
    img.src = dataUrl
  })
}

export default function AvatarUploader({ currentUrl, name, size = 80, onUpload, filePrefix }: Props) {
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validasi ukuran (2 MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file maksimal 2 MB')
      return
    }

    setUploading(true)
    try {
      const reader = new FileReader()
      reader.onload = async (ev) => {
        const dataUrl = ev.target?.result as string
        const compressed = await compressImage(dataUrl)
        setPreview(compressed)

        // Upload ke Supabase Storage
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const byteArr = Uint8Array.from(atob(compressed.split(',')[1]), c => c.charCodeAt(0))
        const blob = new Blob([byteArr], { type: 'image/jpeg' })
        const prefix = filePrefix ?? user.id
        const filename = `${prefix}-${Date.now()}.jpg`

        const { data: uploadData, error } = await supabase.storage
          .from('avatars')
          .upload(filename, blob, { contentType: 'image/jpeg', upsert: true })

        if (error) { alert('Gagal upload: ' + error.message); setUploading(false); return }

        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(uploadData.path)

        onUpload(publicUrl)
        setUploading(false)
      }
      reader.readAsDataURL(file)
    } catch {
      setUploading(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      {/* Avatar display */}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', cursor: uploading ? 'wait' : 'pointer', position: 'relative', flexShrink: 0, border: '2px solid var(--border)', background: 'var(--accent)' }}
        title="Klik untuk ganti foto"
      >
        {preview ? (
          <img src={preview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-dm-serif)', fontSize: size * 0.35, color: '#F5F0E8' }}>
            {getInitials(name || '?')}
          </div>
        )}
        {/* Hover overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: uploading ? 1 : 0, transition: 'opacity 0.15s' }}
          onMouseEnter={e => { if (!uploading) (e.currentTarget as HTMLDivElement).style.opacity = '1' }}
          onMouseLeave={e => { if (!uploading) (e.currentTarget as HTMLDivElement).style.opacity = '0' }}>
          {uploading ? (
            <div style={{ width: 20, height: 20, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          ) : (
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
          )}
        </div>
      </div>

      <div>
        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 3 }}>Foto Profil</p>
        <p style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 8 }}>JPG, PNG, WEBP · Maks 2 MB</p>
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          style={{ padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 500, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--ink2)', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)' }}>
          {uploading ? 'Mengupload...' : 'Ganti Foto'}
        </button>
      </div>

      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} style={{ display: 'none' }} />

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
