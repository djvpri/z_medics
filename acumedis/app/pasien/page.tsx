import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Topbar from '@/components/layout/Topbar'
import { mockPatients } from '@/lib/mock-data'
import { Patient } from '@/types'
import { useT } from '@/contexts/LanguageContext'

function calcAge(b?: string) {
  if (!b) return undefined
  const t = new Date(), d = new Date(b)
  let a = t.getFullYear() - d.getFullYear()
  if (t.getMonth() - d.getMonth() < 0 || (t.getMonth() === d.getMonth() && t.getDate() < d.getDate())) a--
  return a
}

const AVATAR_COLORS = [
  { bg: '#E8F2EC', text: '#2D5A3D' },
  { bg: '#F5EDD4', text: '#B8860B' },
  { bg: '#F5E8E8', text: '#8B2020' },
  { bg: '#EDE8DF', text: '#5C5449' },
  { bg: '#E8EDF5', text: '#2D3A5A' },
]

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function getColor(id: string) {
  const idx = id.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}

function formatDate(s?: string) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

// STATUS_BADGE labels are now dynamic via t.patient.active / t.patient.new

export default function PasienPage() {
  const { t } = useT()
  const [patients, setPatients] = useState<Patient[]>(mockPatients)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from('patients')
          .select('*, sessions(session_date)')
          .order('created_at', { ascending: false })
        const rows = data ?? []
        if (rows.length > 0) {
          setPatients(rows.map((p: any) => {
            const sessionDates: string[] = (p.sessions ?? []).map((s: any) => s.session_date).filter(Boolean)
            const lastDate = sessionDates.sort().reverse()[0]
            return {
              ...p,
              age: calcAge(p.birth_date),
              total_sessions: sessionDates.length,
              last_session_date: lastDate ?? undefined,
            }
          }))
        }
      } catch {
        // keep mock data
      }
    }
    load()
  }, [])

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.phone && p.phone.includes(search))
  )

  return (
    <>
      <Topbar
        title={t.patient.title}
        actions={
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder={t.patient.searchPlaceholder}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '7px 14px', border: '1px solid var(--border)', borderRadius: 8, fontFamily: 'var(--font-dm-sans)', fontSize: 13, background: 'var(--surface)', color: 'var(--ink)', outline: "none", width: "100%", maxWidth: 200 }}
            />
            <Link href="/pasien/baru" style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, background: 'var(--accent)', color: '#F5F0E8', textDecoration: 'none', whiteSpace: 'nowrap' }}>
              {t.patient.addPatient}
            </Link>
          </div>
        }
      />

      <div className="p-4 md:p-7">
        <div className="rounded-[18px] overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)', overflowX: 'auto' }}>
          {loading ? (
            <div className="py-16 text-center" style={{ color: 'var(--ink3)', fontSize: 13 }}>{t.common.loading}</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center" style={{ color: 'var(--ink3)', fontSize: 13 }}>{t.patient.noPatients}</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border2)' }}>
                  {[t.patient.name, t.patient.complaint, t.patient.sessions, t.patient.lastSession, t.patient.status].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 20px', fontSize: 11, color: 'var(--ink3)', fontWeight: 500, letterSpacing: 0.5, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const col = getColor(p.id)
                  const isNew = !p.total_sessions || p.total_sessions === 0
                  const badge = isNew
                    ? { label: t.patient.new, bg: 'var(--gold-light)', color: 'var(--gold)' }
                    : { label: t.patient.active, bg: 'var(--accent-light)', color: 'var(--accent)' }
                  return (
                    <tr
                      key={p.id}
                      style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border2)' : 'none', cursor: 'pointer', transition: 'background 0.12s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = '')}
                      onClick={() => window.location.href = `/pasien/${p.id}`}
                    >
                      <td style={{ padding: '12px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: col.bg, color: col.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 500, flexShrink: 0, overflow: 'hidden' }}>
                            {p.avatar_url
                              ? <img src={p.avatar_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : getInitials(p.name)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 500, color: 'var(--ink)' }}>{p.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--ink3)' }}>
                              {p.gender === 'female' ? 'Wanita' : p.gender === 'male' ? 'Pria' : '—'}{p.age ? ` · ${p.age}th` : ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 20px', color: 'var(--ink2)' }}>{p.address?.split(',')[0] ?? '—'}</td>
                      <td style={{ padding: '12px 20px', color: 'var(--ink)' }}>{isNew ? 'Baru' : `${p.total_sessions} sesi`}</td>
                      <td style={{ padding: '12px 20px', color: 'var(--ink3)' }}>{formatDate(p.last_session_date)}</td>
                      <td style={{ padding: '12px 20px' }}>
                        <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: badge.bg, color: badge.color }}>{badge.label}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}
