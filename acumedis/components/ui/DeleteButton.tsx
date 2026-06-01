'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  label?: string
  confirmLabel?: string
  table: 'patients' | 'sessions'
  id: string
  redirectTo: string
}

export default function DeleteButton({ label = 'Hapus', confirmLabel, table, id, redirectTo }: Props) {
  const router = useRouter()
  const [step, setStep] = useState<'idle' | 'confirm' | 'loading'>('idle')

  async function handleDelete() {
    setStep('loading')
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      await supabase.from(table).delete().eq('id', id)
      router.push(redirectTo)
      router.refresh()
    } catch {
      setStep('confirm')
    }
  }

  if (step === 'idle') {
    return (
      <button
        type="button"
        onClick={() => setStep('confirm')}
        style={{ padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--ink2)', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)' }}
      >
        {label}
      </button>
    )
  }

  if (step === 'confirm') {
    return (
      <div className="flex items-center gap-2">
        <span style={{ fontSize: 12, color: 'var(--ink3)' }}>
          {confirmLabel ?? 'Yakin hapus?'}
        </span>
        <button
          type="button"
          onClick={handleDelete}
          style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, border: 'none', background: 'var(--red)', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)' }}
        >
          Ya, Hapus
        </button>
        <button
          type="button"
          onClick={() => setStep('idle')}
          style={{ padding: '6px 10px', borderRadius: 8, fontSize: 12, border: '1px solid var(--border)', background: 'transparent', color: 'var(--ink3)', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)' }}
        >
          Batal
        </button>
      </div>
    )
  }

  return (
    <span style={{ fontSize: 13, color: 'var(--ink3)', fontFamily: 'var(--font-dm-sans)' }}>Menghapus...</span>
  )
}
