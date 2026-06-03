'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Topbar from '@/components/layout/Topbar'
import { createClient } from '@/lib/supabase/client'
import { useT } from '@/contexts/LanguageContext'

interface Request {
  id: string
  patient_name: string
  patient_phone: string
  patient_email: string | null
  preferred_date: string | null
  preferred_time: string | null
  reason: string | null
  status: 'pending' | 'confirmed' | 'declined'
  notes: string | null
  created_at: string
}

const STATUS = {
  pending: { label: 'Menunggu', en: 'Pending', bg: 'var(--gold-light)', color: 'var(--gold)' },
  confirmed: { label: 'Dikonfirmasi', en: 'Confirmed', bg: 'var(--accent-light)', color: 'var(--accent)' },
  declined: { label: 'Ditolak', en: 'Declined', bg: 'var(--red-light)', color: 'var(--red)' },
}

export default function PermintaanPage() {
  const { lang } = useT()
  const id = lang === 'id'
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'declined'>('pending')
  const [actionId, setActionId] = useState<string | null>(null)

  async function load() {
    const supabase = createClient()
    const query = supabase
      .from('appointment_requests')
      .select('*')
      .order('created_at', { ascending: false })
    const { data } = filter === 'all' ? await query : await query.eq('status', filter)
    setRequests(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [filter])

  async function updateStatus(reqId: string, status: 'confirmed' | 'declined') {
    setActionId(reqId)
    const supabase = createClient()
    await supabase.from('appointment_requests').update({ status }).eq('id', reqId)
    await load()
    setActionId(null)
  }

  async function confirmAndCreateAppointment(req: Request) {
    setActionId(req.id)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Cari patient_id berdasarkan nomor telepon
    const { data: patient } = await supabase
      .from('patients')
      .select('id')
      .ilike('phone', `%${req.patient_phone}%`)
      .limit(1)
      .single()

    // Buat appointment di jadwal
    if (patient?.id) {
      const scheduledAt = req.preferred_date && req.preferred_time
        ? new Date(`${req.preferred_date}T${req.preferred_time}`).toISOString()
        : new Date().toISOString()

      await supabase.from('appointments').insert({
        practitioner_id: user.id,
        patient_id: patient.id,
        scheduled_at: scheduledAt,
        reason: req.reason,
        status: 'scheduled',
        duration_minutes: 45,
      })
    }

    // Update status request
    await supabase.from('appointment_requests').update({ status: 'confirmed' }).eq('id', req.id)
    await load()
    setActionId(null)
  }

  const filtered = requests.filter(r => filter === 'all' || r.status === filter)
  const pendingCount = requests.filter(r => r.status === 'pending').length

  function fmtDate(s: string) {
    return new Date(s).toLocaleDateString(id ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <>
      <Topbar
        title={id ? 'Permintaan Jadwal' : 'Appointment Requests'}
        subtitle={pendingCount > 0 ? `${pendingCount} ${id ? 'menunggu konfirmasi' : 'awaiting confirmation'}` : undefined}
        back="/jadwal"
      />

      <div className="p-4 md:p-7 space-y-4">
        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(['pending', 'confirmed', 'declined', 'all'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-dm-sans)', transition: 'all 0.15s',
                background: filter === f ? 'var(--accent)' : 'var(--surface)',
                color: filter === f ? '#F5F0E8' : 'var(--ink2)',
                boxShadow: filter === f ? 'none' : '0 1px 3px rgba(0,0,0,0.06)',
              }}>
              {f === 'all' ? (id ? 'Semua' : 'All') :
               f === 'pending' ? (id ? `Menunggu (${requests.filter(r => r.status === 'pending').length})` : `Pending (${requests.filter(r => r.status === 'pending').length})`) :
               f === 'confirmed' ? (id ? 'Dikonfirmasi' : 'Confirmed') : (id ? 'Ditolak' : 'Declined')}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--ink3)', fontSize: 13 }}>
            {id ? 'Memuat...' : 'Loading...'}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontSize: 14, color: 'var(--ink3)' }}>
              {id ? 'Tidak ada permintaan.' : 'No requests found.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(req => {
              const st = STATUS[req.status]
              const isLoading = actionId === req.id
              return (
                <div key={req.id} className="rounded-[18px] p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      {/* Nama + status */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <span style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 17, color: 'var(--ink)' }}>{req.patient_name}</span>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: st.bg, color: st.color }}>
                          {id ? st.label : st.en}
                        </span>
                      </div>

                      {/* Detail */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', fontSize: 13, color: 'var(--ink3)' }}>
                        <span>📞 {req.patient_phone}</span>
                        {req.patient_email && <span>✉️ {req.patient_email}</span>}
                        {req.preferred_date && <span>📅 {fmtDate(req.preferred_date)}{req.preferred_time ? ` ${req.preferred_time}` : ''}</span>}
                      </div>

                      {req.reason && (
                        <p style={{ marginTop: 8, fontSize: 13.5, color: 'var(--ink2)', lineHeight: 1.5 }}>
                          💬 {req.reason}
                        </p>
                      )}

                      <p style={{ marginTop: 6, fontSize: 11, color: 'var(--ink3)' }}>
                        {id ? 'Diterima' : 'Received'} {fmtDate(req.created_at)}
                      </p>
                    </div>

                    {/* Actions — hanya untuk pending */}
                    {req.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                        <button
                          onClick={() => confirmAndCreateAppointment(req)}
                          disabled={isLoading}
                          style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)', background: 'var(--accent)', color: '#F5F0E8', opacity: isLoading ? 0.6 : 1 }}>
                          {isLoading ? '...' : (id ? '✓ Konfirmasi & Jadwalkan' : '✓ Confirm & Schedule')}
                        </button>
                        <button
                          onClick={() => updateStatus(req.id, 'declined')}
                          disabled={isLoading}
                          style={{ padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)', background: 'transparent', color: 'var(--red)', opacity: isLoading ? 0.6 : 1 }}>
                          {id ? 'Tolak' : 'Decline'}
                        </button>
                      </div>
                    )}

                    {/* Jika confirmed — link ke jadwal */}
                    {req.status === 'confirmed' && (
                      <Link href="/jadwal" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', fontWeight: 500, flexShrink: 0 }}>
                        {id ? 'Lihat jadwal →' : 'View schedule →'}
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
