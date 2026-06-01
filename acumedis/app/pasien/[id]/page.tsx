import Link from 'next/link'
import { notFound } from 'next/navigation'
import Topbar from '@/components/layout/Topbar'
import { getPatient, getPatientSessions, getPatientLastTonguePhoto } from '@/lib/supabase/queries'
import { mockPatients, mockSessions } from '@/lib/mock-data'
import DeleteButton from '@/components/ui/DeleteButton'

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function fmtLong(s?: string) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtShort(s?: string) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtMonthYear(s?: string) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
}

const tongueColorLabel: Record<string, string> = {
  'red': 'Merah', 'pale-red': 'Merah muda pucat', 'pale': 'Pucat', 'purple': 'Ungu', 'dark-red': 'Merah gelap',
}
const coatingLabel: Record<string, string> = {
  'thin-white': 'Putih tipis', 'thick-white': 'Putih tebal',
  'thin-yellow': 'Kuning tipis', 'thick-yellow': 'Kuning tebal', 'none': 'Tidak ada',
}
const pulseLabel: Record<string, string> = {
  'wiry': 'Wiry, sedikit lemah', 'slippery': 'Slippery (Hua)',
  'weak': 'Lemah', 'rapid': 'Cepat (Shu)', 'slow': 'Lambat', 'deep': 'Dalam', 'floating': 'Mengambang',
}

const btnStyle: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
  fontFamily: 'var(--font-dm-sans)', textDecoration: 'none', cursor: 'pointer',
}

export default async function DetailPasienPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let patient = await getPatient(id).catch(() => null)
  let sessions = await getPatientSessions(id).catch(() => [])

  if (!patient) {
    patient = mockPatients.find(p => p.id === id) ?? null
    sessions = mockSessions.filter(s => s.patient_id === id)
  }

  if (!patient) notFound()

  const initials = getInitials(patient.name)
  const lastSession = sessions[0]
  const sessionCount = sessions.length

  // Fetch analisis + foto lidah terbaru dari semua sesi pasien
  const tonguePhoto = await getPatientLastTonguePhoto(id).catch(() => null)
  const tongueAI = tonguePhoto?.ai_analysis
    ? (() => { try { return JSON.parse(tonguePhoto.ai_analysis) } catch { return null } })()
    : null
  const tonguePhotoUrl = tonguePhoto?.storage_path && tonguePhoto.storage_path !== 'local'
    ? tonguePhoto.storage_path
    : null

  // Keluhan utama dari sesi-sesi (untuk tags)
  const uniqueKeluhan = [...new Set(sessions.map(s => s.chief_complaint.split(' ').slice(0, 2).join(' ')))].slice(0, 2)

  return (
    <>
      <Topbar
        title="Rekam Medis Pasien"
        back="/pasien"
        actions={
          <div className="flex items-center gap-2">
            <DeleteButton table="patients" id={patient.id} redirectTo="/pasien" confirmLabel="Hapus pasien beserta semua sesinya?" />
            <Link href={`/pasien/${patient.id}/edit`} style={{ ...btnStyle, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--ink2)', textDecoration: 'none' }}>
              Edit
            </Link>
            <Link href={`/sesi/baru?pasien=${patient.id}`} style={{ ...btnStyle, background: 'var(--accent)', color: '#F5F0E8', border: 'none', textDecoration: 'none' }}>
              + Sesi Baru
            </Link>
          </div>
        }
      />

      <div className="p-7 space-y-5">
        {/* Patient header */}
        <div className="rounded-[18px] p-6 flex items-center gap-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-center rounded-full flex-shrink-0" style={{ width: 60, height: 60, background: 'var(--accent)', color: '#F5F0E8', fontFamily: 'var(--font-dm-serif)', fontSize: 22 }}>
            {initials}
          </div>
          <div className="flex-1">
            <div style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 22, color: 'var(--ink)' }}>{patient.name}</div>
            <div style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 4 }}>
              {patient.gender === 'female' ? 'Wanita' : patient.gender === 'male' ? 'Pria' : '—'}
              {patient.age ? ` · ${patient.age} tahun` : ''}
              {patient.phone ? ` · ${patient.phone}` : ''}
              {patient.email ? ` · ${patient.email}` : ''}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: 'var(--accent-light)', color: 'var(--accent)' }}>Aktif</span>
              {uniqueKeluhan.map(k => (
                <span key={k} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: 'var(--bg2)', color: 'var(--ink2)' }}>{k}</span>
              ))}
              {lastSession?.tcm_diagnosis && (
                <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: 'var(--bg2)', color: 'var(--ink2)' }}>
                  {lastSession.tcm_diagnosis.split(' ').slice(0, 3).join(' ')}
                </span>
              )}
              <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: 'var(--bg2)', color: 'var(--ink2)' }}>{sessionCount} sesi total</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 2 }}>Pasien sejak</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)', marginBottom: 10 }}>{fmtMonthYear(patient.created_at)}</div>
            {lastSession && (
              <>
                <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 2 }}>Sesi berikutnya</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--accent)' }}>Belum dijadwal</div>
              </>
            )}
          </div>
        </div>

        {/* 2-column */}
        <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 340px' }}>

          {/* Left: session history */}
          <div className="rounded-[18px] overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border2)' }}>
              <h2 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 16, color: 'var(--ink)' }}>Riwayat Sesi</h2>
              <span style={{ fontSize: 12, color: 'var(--ink3)' }}>{sessionCount} sesi</span>
            </div>
            <div className="px-5">
              {sessions.length === 0 ? (
                <div className="py-10 text-center" style={{ fontSize: 13, color: 'var(--ink3)' }}>
                  Belum ada sesi.{' '}
                  <Link href={`/sesi/baru?pasien=${patient.id}`} style={{ color: 'var(--accent)' }}>Tambah sesi pertama →</Link>
                </div>
              ) : (
                <>
                  {sessions.slice(0, 4).map((s, i) => (
                    <Link key={s.id} href={`/sesi/${s.id}`} className="hover-fade" style={{ display: 'block', padding: '14px 0', borderBottom: '1px solid var(--border2)', textDecoration: 'none' }}>
                      <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 4, letterSpacing: 0.5 }}>
                        {fmtShort(s.session_date)} · Sesi ke-{sessionCount - i}
                      </div>
                      <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--ink)', marginBottom: 3 }}>{s.chief_complaint}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink3)' }}>
                        {s.points_used?.join(' · ') ?? '—'}{s.duration_minutes ? ` — ${s.duration_minutes} menit` : ''}
                      </div>
                    </Link>
                  ))}
                  {sessions.length > 4 && (
                    <div style={{ padding: '14px 0', fontSize: 13, color: 'var(--ink3)', opacity: 0.5 }}>
                      {fmtShort(sessions[4].session_date)} · Sesi ke-{sessionCount - 4} · dan sebelumnya...
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-3">

            {/* Tongue card */}
            {lastSession && (
              <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                  Inspeksi Lidah — Sesi Terakhir
                </div>
                {tonguePhotoUrl ? (
                  <a href={tonguePhotoUrl} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'block', width: '100%', borderRadius: 8, overflow: 'hidden', marginBottom: 10, cursor: 'zoom-in' }}>
                    <img
                      src={tonguePhotoUrl}
                      alt="Foto lidah"
                      style={{ width: '100%', maxHeight: 160, objectFit: 'cover', display: 'block' }}
                    />
                  </a>
                ) : (
                  <div style={{ width: '100%', height: 90, borderRadius: 8, background: '#F8EEF0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                    <div style={{
                      position: 'relative', width: 80, height: 65, opacity: 0.85,
                      background: lastSession.tongue_color === 'pale' ? '#E8B4C0' : lastSession.tongue_color === 'red' ? '#C0404A' : lastSession.tongue_color === 'purple' ? '#9B59B6' : '#D4607A',
                      borderRadius: '40px 40px 50% 50%',
                    }}>
                      <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', width: 50, height: 30, background: 'rgba(255,255,255,0.45)', borderRadius: 20 }} />
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['Warna', tongueAI?.warna ?? (lastSession.tongue_color ? tongueColorLabel[lastSession.tongue_color] : '—')],
                    ['Selaput', tongueAI?.selaput ?? (lastSession.tongue_coating ? coatingLabel[lastSession.tongue_coating] : '—')],
                    ['Bentuk', tongueAI?.bentuk ?? 'Normal'],
                    ['Nadi', tongueAI?.kelembaban ? `${tongueAI.kelembaban}` : (lastSession.pulse_quality ? pulseLabel[lastSession.pulse_quality] : '—')],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <div style={{ fontSize: 10, color: 'var(--ink3)', marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{val}</div>
                    </div>
                  ))}
                </div>
                {tongueAI?.ringkasan && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border2)' }}>
                    <div style={{ fontSize: 10, color: 'var(--ink3)', marginBottom: 4 }}>Ringkasan AI</div>
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

            {/* AI Recommendation (dark) */}
            {lastSession && (
              <div className="rounded-xl p-4" style={{ background: 'var(--ink)' }}>
                <div className="flex items-center gap-2 mb-2.5">
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4A8C60', display: 'inline-block', animation: 'pulse-dot 2s infinite' }} />
                  <span style={{ fontSize: 10, color: 'rgba(245,240,232,0.4)', letterSpacing: 1.5, textTransform: 'uppercase' }}>Rekomendasi AI</span>
                  <span style={{ marginLeft: 4, fontSize: 9, padding: '2px 7px', borderRadius: 20, background: 'rgba(74,140,96,0.2)', color: '#7DC49A', letterSpacing: 0.5 }}>Gemini</span>
                </div>
                {lastSession.tcm_diagnosis ? (
                  <>
                    <div style={{ fontSize: 12.5, color: 'rgba(245,240,232,0.8)', lineHeight: 1.6, marginBottom: 10, fontStyle: 'italic' }}>
                      Berdasarkan {sessionCount} sesi dan pola perbaikan, kondisi ini menunjukkan{' '}
                      <em style={{ color: '#F5F0E8', fontStyle: 'italic' }}>{lastSession.tcm_diagnosis}</em>.
                      {' '}Sesi berikutnya disarankan:
                    </div>
                    {lastSession.points_used && lastSession.points_used.length > 0 && (
                      <div className="grid grid-cols-3 gap-1.5 mb-3">
                        {lastSession.points_used.map(p => (
                          <div key={p} className="text-center py-1 rounded-lg text-xs font-medium" style={{ background: 'rgba(74,140,96,0.2)', border: '1px solid rgba(74,140,96,0.3)', color: '#7DC49A', fontFamily: 'monospace' }}>
                            {p}
                          </div>
                        ))}
                      </div>
                    )}
                    {lastSession.notes && (
                      <div style={{ fontSize: 11, color: 'rgba(245,240,232,0.3)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
                        {lastSession.notes}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ fontSize: 12.5, color: 'rgba(245,240,232,0.4)', paddingBottom: 4 }}>
                    Belum ada diagnosis TCM tercatat di sesi ini.
                  </div>
                )}
              </div>
            )}

            {/* Kondisi umum */}
            <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Kondisi Umum</div>
              <div className="flex flex-col gap-2.5">
                {[
                  { label: 'Skala nyeri (1–10)', value: lastSession?.pain_scale ? `${lastSession.pain_scale} ↓ dari 10` : '—', accent: true },
                  { label: 'Kualitas tidur', value: 'Membaik' },
                  { label: 'Energi harian', value: 'Sedang' },
                  { label: 'Perkembangan overall', value: 'Positif', accent: true },
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
