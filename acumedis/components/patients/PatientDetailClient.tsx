'use client'

import Link from 'next/link'
import Topbar from '@/components/layout/Topbar'
import DeleteButton from '@/components/ui/DeleteButton'
import { useT } from '@/contexts/LanguageContext'

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

const AVATAR_COLORS = [
  { bg: '#E8F2EC', text: '#2D5A3D' }, { bg: '#F5EDD4', text: '#B8860B' },
  { bg: '#F5E8E8', text: '#8B2020' }, { bg: '#EDE8DF', text: '#5C5449' },
]

interface Props {
  patient: any
  sessions: any[]
  tongueAI: any
  tonguePhotoUrl: string | null
}

export default function PatientDetailClient({ patient, sessions, tongueAI, tonguePhotoUrl }: Props) {
  const { t, lang } = useT()

  const locale = lang === 'id' ? 'id-ID' : 'en-US'

  function fmtLong(s?: string) {
    if (!s) return '—'
    return new Date(s).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
  }
  function fmtShort(s?: string) {
    if (!s) return '—'
    return new Date(s).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
  }
  function fmtMonthYear(s?: string) {
    if (!s) return '—'
    return new Date(s).toLocaleDateString(locale, { month: 'long', year: 'numeric' })
  }

  const tongueColorLabel: Record<string, string> = lang === 'id' ? {
    'red': 'Merah', 'pale-red': 'Merah muda pucat', 'pale': 'Pucat', 'purple': 'Ungu', 'dark-red': 'Merah gelap',
  } : {
    'red': 'Red', 'pale-red': 'Pale pink', 'pale': 'Pale', 'purple': 'Purple', 'dark-red': 'Dark red',
  }
  const coatingLabel: Record<string, string> = lang === 'id' ? {
    'thin-white': 'Putih tipis', 'thick-white': 'Putih tebal', 'thin-yellow': 'Kuning tipis', 'thick-yellow': 'Kuning tebal', 'none': 'Tidak ada',
  } : {
    'thin-white': 'Thin white', 'thick-white': 'Thick white', 'thin-yellow': 'Thin yellow', 'thick-yellow': 'Thick yellow', 'none': 'None',
  }
  const pulseLabel: Record<string, string> = lang === 'id' ? {
    'wiry': 'Wiry, sedikit lemah', 'slippery': 'Slippery (Hua)', 'weak': 'Lemah', 'rapid': 'Cepat', 'slow': 'Lambat', 'deep': 'Dalam', 'floating': 'Mengambang',
  } : {
    'wiry': 'Wiry', 'slippery': 'Slippery', 'weak': 'Weak', 'rapid': 'Rapid', 'slow': 'Slow', 'deep': 'Deep', 'floating': 'Floating',
  }

  const col = AVATAR_COLORS[patient.id.charCodeAt(0) % AVATAR_COLORS.length]
  const initials = getInitials(patient.name)
  const lastSession = sessions[0]
  const sessionCount = sessions.length
  const uniqueKeluhan = [...new Set(sessions.map((s: any) => s.chief_complaint.split(' ').slice(0, 2).join(' ')))].slice(0, 2)
  const btnStyle: React.CSSProperties = { padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-dm-sans)', textDecoration: 'none', cursor: 'pointer' }

  return (
    <>
      <Topbar
        title={t.patient.medicalRecord}
        back="/pasien"
        actions={
          <div className="flex items-center gap-2">
            <DeleteButton table="patients" id={patient.id} redirectTo="/pasien" confirmLabel={lang === 'id' ? 'Hapus pasien beserta semua sesinya?' : 'Delete this patient and all their sessions?'} />
            <Link href={`/pasien/${patient.id}/edit`} style={{ ...btnStyle, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--ink2)' }}>
              {t.common.edit}
            </Link>
            <Link href={`/sesi/baru?pasien=${patient.id}`} style={{ ...btnStyle, background: 'var(--accent)', color: '#F5F0E8', border: 'none' }}>
              + {lang === 'id' ? 'Sesi Baru' : 'New Session'}
            </Link>
          </div>
        }
      />

      <div className="p-7 space-y-5">
        {/* Patient header */}
        <div className="rounded-[18px] p-6 flex items-center gap-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--accent)', color: '#F5F0E8', fontFamily: 'var(--font-dm-serif)', fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {initials}
          </div>
          <div className="flex-1">
            <div style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 22, color: 'var(--ink)' }}>{patient.name}</div>
            <div style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 4 }}>
              {patient.gender === 'female' ? (lang === 'id' ? 'Wanita' : 'Female') : patient.gender === 'male' ? (lang === 'id' ? 'Pria' : 'Male') : '—'}
              {patient.age ? ` · ${patient.age} ${t.patient.age}` : ''}
              {patient.phone ? ` · ${patient.phone}` : ''}
              {patient.email ? ` · ${patient.email}` : ''}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: 'var(--accent-light)', color: 'var(--accent)' }}>{t.patient.active}</span>
              {uniqueKeluhan.map((k: any) => (
                <span key={k} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: 'var(--bg2)', color: 'var(--ink2)' }}>{k}</span>
              ))}
              {lastSession?.tcm_diagnosis && (
                <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: 'var(--bg2)', color: 'var(--ink2)' }}>
                  {lastSession.tcm_diagnosis.split(' ').slice(0, 3).join(' ')}
                </span>
              )}
              <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: 'var(--bg2)', color: 'var(--ink2)' }}>{sessionCount} {t.patient.totalSessionsCount}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 2 }}>{t.patient.patientSince}</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)', marginBottom: 10 }}>{fmtMonthYear(patient.created_at)}</div>
            {lastSession && (
              <>
                <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 2 }}>{t.patient.nextSession}</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--accent)' }}>{t.patient.notScheduled}</div>
              </>
            )}
          </div>
        </div>

        {/* 2-column */}
        <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 340px' }}>
          {/* Session history */}
          <div className="rounded-[18px] overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border2)' }}>
              <h2 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 16, color: 'var(--ink)' }}>{t.patient.sessionHistory}</h2>
              <span style={{ fontSize: 12, color: 'var(--ink3)' }}>{sessionCount} {t.patient.totalSessionsCount}</span>
            </div>
            <div className="px-5">
              {sessions.length === 0 ? (
                <div className="py-10 text-center" style={{ fontSize: 13, color: 'var(--ink3)' }}>
                  {t.patient.noHistory}{' '}
                  <Link href={`/sesi/baru?pasien=${patient.id}`} style={{ color: 'var(--accent)', textDecoration: 'none' }}>{t.patient.addFirstSession}</Link>
                </div>
              ) : (
                <>
                  {sessions.slice(0, 4).map((s: any, i: number) => (
                    <Link key={s.id} href={`/sesi/${s.id}`} className="hover-fade" style={{ display: 'block', padding: '14px 0', borderBottom: '1px solid var(--border2)', textDecoration: 'none' }}>
                      <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 4 }}>
                        {fmtShort(s.session_date)} · {lang === 'id' ? 'Sesi ke-' : 'Session '}{sessionCount - i}
                      </div>
                      <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--ink)', marginBottom: 3 }}>{s.chief_complaint}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink3)' }}>
                        {s.points_used?.join(' · ') ?? '—'}{s.duration_minutes ? ` — ${s.duration_minutes} ${lang === 'id' ? 'menit' : 'min'}` : ''}
                      </div>
                    </Link>
                  ))}
                  {sessions.length > 4 && (
                    <div style={{ padding: '14px 0', fontSize: 13, color: 'var(--ink3)', opacity: 0.5 }}>
                      {fmtShort(sessions[4].session_date)} · {lang === 'id' ? 'Sesi ke-' : 'Session '}{sessionCount - 4} · {t.patient.andBefore}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-3">
            {/* Tongue */}
            {lastSession && (
              <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                  {t.patient.tongueInspection}
                </div>
                {tonguePhotoUrl ? (
                  <a href={tonguePhotoUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', borderRadius: 8, overflow: 'hidden', marginBottom: 10, cursor: 'zoom-in' }}>
                    <img src={tonguePhotoUrl} alt="Tongue photo" style={{ width: '100%', maxHeight: 160, objectFit: 'cover', display: 'block' }} />
                  </a>
                ) : (
                  <div style={{ width: '100%', height: 90, borderRadius: 8, background: '#F8EEF0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                    <div style={{ position: 'relative', width: 80, height: 65, opacity: 0.85, background: lastSession.tongue_color === 'pale' ? '#E8B4C0' : lastSession.tongue_color === 'red' ? '#C0404A' : lastSession.tongue_color === 'purple' ? '#9B59B6' : '#D4607A', borderRadius: '40px 40px 50% 50%' }}>
                      <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', width: 50, height: 30, background: 'rgba(255,255,255,0.45)', borderRadius: 20 }} />
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    [t.patient.tongueColor, tongueAI?.warna ?? (lastSession.tongue_color ? tongueColorLabel[lastSession.tongue_color] : '—')],
                    [t.patient.tongueCoating, tongueAI?.selaput ?? (lastSession.tongue_coating ? coatingLabel[lastSession.tongue_coating] : '—')],
                    [t.patient.tongueShape, tongueAI?.bentuk ?? (lang === 'id' ? 'Normal' : 'Normal')],
                    [t.patient.tongueHumidity, tongueAI?.kelembaban ? tongueAI.kelembaban : (lastSession.pulse_quality ? pulseLabel[lastSession.pulse_quality] : '—')],
                  ].map(([label, val]) => (
                    <div key={label as string}>
                      <div style={{ fontSize: 10, color: 'var(--ink3)', marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{val}</div>
                    </div>
                  ))}
                </div>
                {tongueAI?.ringkasan && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border2)' }}>
                    <div style={{ fontSize: 10, color: 'var(--ink3)', marginBottom: 4 }}>{t.patient.aiSummary}</div>
                    <p style={{ fontSize: 12, color: 'var(--ink2)', lineHeight: 1.6 }}>{tongueAI.ringkasan}</p>
                  </div>
                )}
                {tongueAI?.indikasi?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {tongueAI.indikasi.map((s: string, i: number) => (
                      <span key={i} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'var(--accent-light)', color: 'var(--accent)' }}>{s}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* AI Rec */}
            {lastSession && (
              <div className="rounded-xl p-4" style={{ background: 'var(--ink)' }}>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4A8C60', display: 'inline-block' }} />
                  <span style={{ fontSize: 10, color: 'rgba(245,240,232,0.4)', letterSpacing: 1.5, textTransform: 'uppercase' }}>{t.patient.aiRecommendation}</span>
                  <span style={{ marginLeft: 4, fontSize: 9, padding: '2px 7px', borderRadius: 20, background: 'rgba(74,140,96,0.2)', color: '#7DC49A', letterSpacing: 0.5 }}>Gemini</span>
                </div>
                {lastSession.tcm_diagnosis ? (
                  <>
                    <div style={{ fontSize: 12.5, color: 'rgba(245,240,232,0.8)', lineHeight: 1.6, marginBottom: 10, fontStyle: 'italic' }}>
                      {lang === 'id' ? 'Berdasarkan' : 'Based on'} {sessionCount} {lang === 'id' ? 'sesi' : 'sessions'}, {lang === 'id' ? 'kondisi ini menunjukkan' : 'this condition indicates'}{' '}
                      <em style={{ color: '#F5F0E8' }}>{lastSession.tcm_diagnosis}</em>.
                    </div>
                    {lastSession.points_used?.length > 0 && (
                      <div className="grid grid-cols-3 gap-1.5 mb-3">
                        {lastSession.points_used.map((p: string) => (
                          <div key={p} style={{ textAlign: 'center', padding: '4px 0', borderRadius: 8, background: 'rgba(74,140,96,0.2)', border: '1px solid rgba(74,140,96,0.3)', color: '#7DC49A', fontSize: 12, fontFamily: 'monospace' }}>{p}</div>
                        ))}
                      </div>
                    )}
                    {lastSession.notes && (
                      <div style={{ fontSize: 11, color: 'rgba(245,240,232,0.3)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>{lastSession.notes}</div>
                    )}
                  </>
                ) : (
                  <div style={{ fontSize: 12.5, color: 'rgba(245,240,232,0.4)', paddingBottom: 4 }}>{t.patient.noTCMDiagnosis}</div>
                )}
              </div>
            )}

            {/* General condition */}
            <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>{t.patient.generalCondition}</div>
              <div className="flex flex-col gap-2.5">
                {[
                  { label: t.patient.painScale, value: lastSession?.pain_scale ? `${lastSession.pain_scale} ↓ ${lang === 'id' ? 'dari' : 'of'} 10` : '—', accent: true },
                  { label: t.patient.sleepQuality, value: t.patient.improving },
                  { label: t.patient.dailyEnergy, value: t.patient.moderate },
                  { label: t.patient.overallProgress, value: t.patient.positive, accent: true },
                ].map(({ label, value, accent }) => (
                  <div key={label} className="flex justify-between" style={{ fontSize: 13 }}>
                    <span style={{ color: 'var(--ink3)' }}>{label}</span>
                    <span style={{ fontWeight: 500, color: accent ? 'var(--accent)' : 'var(--ink)' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
