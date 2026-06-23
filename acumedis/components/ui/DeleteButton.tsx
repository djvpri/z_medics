'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  table: string
  id: string
  redirectTo?: string
  label?: string
}

export function DeleteButton({ table, id, redirectTo, label = 'Hapus' }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm('Yakin ingin menghapus data ini?')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/${table}/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Gagal menghapus')
      if (redirectTo) router.push(redirectTo)
      else router.refresh()
    } catch (err) {
      alert('Gagal menghapus data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={handleDelete} disabled={loading}
      className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50">
      {loading ? 'Menghapus...' : label}
    </button>
  )
}
export default DeleteButton
