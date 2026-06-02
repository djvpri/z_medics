'use client'

import Link from 'next/link'
import Topbar from '@/components/layout/Topbar'
import { useT } from '@/contexts/LanguageContext'

function PainBadge({ scale }: { scale?: number }) {
  if (!scale) return <span style={{ color: 'var(--ink3)' }}>—</span>
  const color = scale <= 3 ? 'bg-green-50 text-green-700' : scale <= 6 ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>{scale}/10</span>
}

export default function SessionListClient({ sessions }: { sessions: any[] }) {
  const { t, lang } = useT()

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  }
  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString(lang === 'id' ? 'id-ID' : 'en-US', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <>
      <Topbar
        title={t.session.title}
        subtitle={`${sessions.length} ${t.session.recorded}`}
        actions={
          <Link href="/sesi/baru" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, background: 'var(--accent)', color: '#F5F0E8', textDecoration: 'none' }}>
            {t.session.newSession}
          </Link>
        }
      />
      <div className="p-6 flex-1">
        <div className="rounded-[18px] overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          {sessions.length === 0 ? (
            <div className="py-16 text-center" style={{ fontSize: 13, color: 'var(--ink3)' }}>
              {t.common.noData}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border2)', background: 'var(--surface2)' }}>
                  {[t.session.date, t.session.patient, t.session.chiefComplaint, t.session.points, t.session.pain, t.session.duration].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 20px', fontSize: 11, color: 'var(--ink3)', fontWeight: 500, letterSpacing: 0.5, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                  <th style={{ padding: '12px 20px' }}></th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(sesi => (
                  <tr key={sesi.id} className="hover-bg" style={{ borderBottom: '1px solid var(--border2)' }}>
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ fontWeight: 500, color: 'var(--ink)' }}>{formatDate(sesi.session_date)}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 2 }}>{formatTime(sesi.session_date)}</div>
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      <Link href={`/pasien/${sesi.patient_id}`} style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
                        {(sesi.patient as any)?.name ?? '—'}
                      </Link>
                    </td>
                    <td style={{ padding: '12px 20px', color: 'var(--ink2)', maxWidth: 220 }}>
                      <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {sesi.chief_complaint}
                      </span>
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {sesi.points_used?.slice(0, 3).map((p: string) => (
                          <span key={p} style={{ padding: '1px 6px', background: 'var(--accent-light)', color: 'var(--accent)', fontSize: 11, borderRadius: 4, fontFamily: 'monospace' }}>{p}</span>
                        ))}
                        {(sesi.points_used?.length ?? 0) > 3 && (
                          <span style={{ padding: '1px 6px', background: 'var(--bg2)', color: 'var(--ink3)', fontSize: 11, borderRadius: 4 }}>+{(sesi.points_used?.length ?? 0) - 3}</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px 20px' }}><PainBadge scale={sesi.pain_scale} /></td>
                    <td style={{ padding: '12px 20px', color: 'var(--ink2)' }}>
                      {sesi.duration_minutes ? `${sesi.duration_minutes} ${lang === 'id' ? 'mnt' : 'min'}` : '—'}
                    </td>
                    <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                      <Link href={`/sesi/${sesi.id}`} style={{ color: 'var(--accent)', fontSize: 12, fontWeight: 500, textDecoration: 'none' }}>
                        {t.session.detail}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}
