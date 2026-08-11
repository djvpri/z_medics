'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Topbar from '@/components/layout/Topbar'
import { useT } from '@/contexts/LanguageContext'

const DAYS_SHORT_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const DAYS_SHORT_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getWeekDays(baseDate: Date) {
  const start = new Date(baseDate)
  start.setDate(start.getDate() - start.getDay())
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

function getStatus(scheduledAt: string, appointmentStatus: string): 'selesai' | 'segera' | 'akan' | 'cancelled' {
  if (appointmentStatus === 'completed') return 'selesai'
  if (appointmentStatus === 'cancelled') return 'cancelled'
  const now = new Date()
  const dt = new Date(scheduledAt)
  const diff = dt.getTime() - now.getTime()
  if (diff < -30 * 60 * 1000) return 'selesai'
  if (diff < 60 * 60 * 1000) return 'segera'
  return 'akan'
}

// STATUS_CONFIG is built dynamically using t.schedule in the component

const AVATAR_COLORS = [
  { bg: '#E8F2EC', text: '#2D5A3D' }, { bg: '#F5EDD4', text: '#B8860B' },
  { bg: '#F5E8E8', text: '#8B2020' }, { bg: '#EDE8DF', text: '#5C5449' },
]

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

interface Appointment {
  id: string
  patient_id: string
  scheduled_at: string
  duration_minutes: number
  reason: string | null
  status: string
  session_id: string | null
  notes: string | null
  queue_number: number | null
  patient: { name: string } | null
}

function AppointmentCard({ appt, onStatusChange }: { appt: Appointment; onStatusChange: () => void }) {
  const { t, lang } = useT()
  const STATUS_CONFIG = {
    selesai: { label: t.schedule.completed, bg: 'var(--accent-light)', color: 'var(--accent)' },
    segera: { label: t.schedule.soon, bg: 'var(--gold-light)', color: 'var(--gold)' },
    akan: { label: t.schedule.upcoming, bg: 'var(--bg2)', color: 'var(--ink2)' },
    cancelled: { label: t.schedule.cancelled, bg: 'var(--red-light)', color: 'var(--red)' },
  }
  const router = useRouter()
  const status = getStatus(appt.scheduled_at, appt.status)
  const cfg = STATUS_CONFIG[status]
  const name = appt.patient?.name ?? (appt as any).external_name ?? (lang === 'id' ? 'Pasien Baru' : 'New Patient')
  const col = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
  const initials = getInitials(name)
  const time = new Date(appt.scheduled_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

  async function cancelAppointment() {
    if (!confirm('Batalkan jadwal ini?')) return
    await fetch(`/api/appointments/${appt.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    })
    onStatusChange()
  }

  async function markCompleted() {
    await fetch(`/api/appointments/${appt.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    })
    onStatusChange()
  }

  return (
    <div className="py-3" style={{ borderBottom: '1px solid var(--border2)' }}>
      {/* Baris 1: No. Antrian + Avatar + Info + Badge */}
      <div className="flex items-center gap-3">
        {appt.queue_number != null && (
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent)', color: '#F5F0E8', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--font-dm-serif)' }}>
            {appt.queue_number}
          </div>
        )}
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: col.bg, color: col.text, fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--ink)' }}>{name}</div>
          <div style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 2 }}>
            {time} · {appt.duration_minutes} mnt
            {appt.reason ? ` · ${appt.reason}` : ''}
            {!(appt.patient) && (appt as any).external_phone ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                {' · '}
                <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ display: 'inline', verticalAlign: 'middle' }}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                {(appt as any).external_phone}
              </span>
            ) : null}
          </div>
        </div>
        <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap', flexShrink: 0 }}>
          {cfg.label}
        </span>
      </div>

      {/* Baris 2: Tombol aksi */}
      <div className="flex items-center gap-1.5 flex-wrap mt-2" style={{ paddingLeft: appt.queue_number != null ? 88 : 52 }}>
        {(status === 'segera' || status === 'akan') && appt.status === 'scheduled' && (
          <Link
            href={`/sesi/baru?pasien=${appt.patient_id}&alasan=${encodeURIComponent(appt.reason ?? '')}&jadwal=${appt.id}`}
            style={{ padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 500, background: 'var(--accent)', color: '#F5F0E8', textDecoration: 'none', fontFamily: 'var(--font-dm-sans)', whiteSpace: 'nowrap' }}
          >
            Mulai Sesi
          </Link>
        )}
        {appt.session_id && (
          <Link href={`/sesi/${appt.session_id}`} style={{ padding: '5px 10px', borderRadius: 7, fontSize: 12, border: '1px solid var(--border)', color: 'var(--ink2)', textDecoration: 'none', fontFamily: 'var(--font-dm-sans)' }}>
            Lihat Sesi
          </Link>
        )}
        {appt.status === 'scheduled' && (
          <Link href={`/jadwal/${appt.id}/edit`} style={{ padding: '5px 10px', borderRadius: 7, fontSize: 12, border: '1px solid var(--border)', color: 'var(--ink2)', textDecoration: 'none', fontFamily: 'var(--font-dm-sans)' }}>
            Edit
          </Link>
        )}
        {appt.status === 'scheduled' && status !== 'selesai' && (
          <button
            onClick={cancelAppointment}
            style={{ padding: '5px 8px', borderRadius: 7, fontSize: 12, border: '1px solid var(--border)', background: 'transparent', color: 'var(--ink3)', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)' }}
          >
            Batal
          </button>
        )}
      </div>
    </div>
  )
}

export default function JadwalPage() {
  const { t, lang } = useT()
  const DAYS_SHORT = lang === 'id' ? DAYS_SHORT_ID : DAYS_SHORT_EN
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(new Date())

  const weekDays = getWeekDays(currentWeek)
  const today = new Date()

  async function loadAppointments() {
    setLoading(true)
    try {
      const weekStart = new Date(weekDays[0])
      weekStart.setHours(0, 0, 0, 0)
      const weekEnd = new Date(weekDays[6])
      weekEnd.setHours(23, 59, 59, 999)

      const qs = `start=${weekStart.toISOString()}&end=${weekEnd.toISOString()}`
      const res = await fetch(`/api/appointments?${qs}`)
      const data = await res.json()
      setAppointments((Array.isArray(data) ? data : []) as Appointment[])
    } catch {
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAppointments() }, [currentWeek])

  const selectedStr = selectedDay.toDateString()
  const dayAppointments = appointments
    .filter(a => new Date(a.scheduled_at).toDateString() === selectedStr)
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())

  const monthYear = currentWeek.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

  function prevWeek() { const d = new Date(currentWeek); d.setDate(d.getDate() - 7); setCurrentWeek(d) }
  function nextWeek() { const d = new Date(currentWeek); d.setDate(d.getDate() + 7); setCurrentWeek(d) }
  function goToday() { setCurrentWeek(new Date()); setSelectedDay(new Date()) }

  const scheduledCount = dayAppointments.filter(a => a.status === 'scheduled').length

  return (
    <>
      <Topbar
        title={t.schedule.title}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={goToday} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--ink2)', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)' }}>
              {t.schedule.goToday}
            </button>
            <Link href="/jadwal/baru" style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, background: 'var(--accent)', color: '#F5F0E8', textDecoration: 'none', fontFamily: 'var(--font-dm-sans)' }}>
              {t.schedule.newSchedule}
            </Link>
          </div>
        }
      />

      <div className="p-4 md:p-7 space-y-5">
        {/* Week navigator */}
        <div className="rounded-[18px] overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid var(--border2)' }}>
            <button onClick={prevWeek} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 13, color: 'var(--ink2)', fontFamily: 'var(--font-dm-sans)' }}>←</button>
            <span style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 16, color: 'var(--ink)' }}>{monthYear}</span>
            <button onClick={nextWeek} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 13, color: 'var(--ink2)', fontFamily: 'var(--font-dm-sans)' }}>→</button>
          </div>

          <div className="grid grid-cols-7 p-2 md:p-3 gap-1 md:gap-1.5">
            {weekDays.map((day, i) => {
              const isToday = day.toDateString() === today.toDateString()
              const isSelected = day.toDateString() === selectedStr
              const count = appointments.filter(a => new Date(a.scheduled_at).toDateString() === day.toDateString() && a.status !== 'cancelled').length

              return (
                <button key={i} onClick={() => setSelectedDay(day)} className="flex flex-col items-center gap-1.5 py-3 rounded-xl"
                  style={{ background: isSelected ? 'var(--accent)' : isToday ? 'var(--accent-light)' : 'transparent', border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}>
                  <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: 0.5, color: isSelected ? 'rgba(245,240,232,0.7)' : 'var(--ink3)', textTransform: 'uppercase' }}>
                    {DAYS_SHORT[i]}
                  </span>
                  <span style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 20, color: isSelected ? '#F5F0E8' : isToday ? 'var(--accent)' : 'var(--ink)', lineHeight: 1 }}>
                    {day.getDate()}
                  </span>
                  {count > 0 && (
                    <div className="flex gap-0.5">
                      {Array.from({ length: Math.min(count, 3) }).map((_, j) => (
                        <div key={j} style={{ width: 4, height: 4, borderRadius: '50%', background: isSelected ? 'rgba(245,240,232,0.6)' : 'var(--accent)' }} />
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Daftar jadwal hari dipilih */}
        <div className="rounded-[18px] overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border2)' }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 16, color: 'var(--ink)' }}>
                {selectedDay.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h2>
              {scheduledCount > 0 && (
                <p style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 2 }}>{scheduledCount} {t.schedule.sessions} {lang === 'id' ? 'terjadwal' : 'scheduled'}</p>
              )}
            </div>
            <Link href={`/jadwal/baru`} style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
              + {lang === 'id' ? 'Tambah' : 'Add'}
            </Link>
          </div>

          <div className="px-5">
            {loading ? (
              <div className="py-12 text-center" style={{ fontSize: 13, color: 'var(--ink3)' }}>{t.common.loading}</div>
            ) : dayAppointments.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <div style={{ fontSize: 13, color: 'var(--ink3)' }}>{t.schedule.noSchedule}</div>
                <Link href="/jadwal/baru" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none' }}>+ {t.schedule.addSchedule}</Link>
              </div>
            ) : (
              dayAppointments.map(appt => (
                <AppointmentCard key={appt.id} appt={appt} onStatusChange={loadAppointments} />
              ))
            )}
          </div>
        </div>
      </div>
    </>
  )
}
