import Link from 'next/link'
import { notFound } from 'next/navigation'
import Topbar from '@/components/layout/Topbar'
import { getPatient, getPatientSessions } from '@/lib/supabase/queries'

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm text-gray-900">{value || '—'}</span>
    </div>
  )
}

function formatDate(dateStr?: string) {
  if (!dateStr) return undefined
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatShort(dateStr?: string) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function DetailPasienPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [patient, sessions] = await Promise.all([
    getPatient(id),
    getPatientSessions(id),
  ])

  if (!patient) notFound()

  const lastSession = sessions[0]

  return (
    <>
      <Topbar
        title={patient.name}
        subtitle="Detail Pasien"
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/sesi/baru?pasien=${patient.id}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Sesi Baru
            </Link>
            <Link href="/pasien" className="text-sm text-gray-500 hover:text-gray-700">← Kembali</Link>
          </div>
        }
      />

      <div className="p-6 flex-1 space-y-5">
        {/* Data Dasar */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Data Dasar</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            <InfoRow label="Nama Lengkap" value={patient.name} />
            <InfoRow label="Jenis Kelamin" value={patient.gender === 'male' ? 'Laki-laki' : patient.gender === 'female' ? 'Perempuan' : undefined} />
            <InfoRow label="Tanggal Lahir" value={formatDate(patient.birth_date)} />
            <InfoRow label="Usia" value={patient.age ? `${patient.age} tahun` : undefined} />
            <InfoRow label="Nomor Telepon" value={patient.phone} />
            <InfoRow label="Email" value={patient.email} />
            <InfoRow label="Alamat" value={patient.address} />
            <InfoRow label="Terdaftar Sejak" value={formatDate(patient.created_at)} />
          </div>
        </div>

        {/* Statistik */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className="text-2xl font-semibold text-gray-900">{sessions.length}</p>
            <p className="text-xs text-gray-500 mt-1">Total Sesi</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className="text-sm font-semibold text-gray-900">{lastSession ? formatShort(lastSession.session_date) : '—'}</p>
            <p className="text-xs text-gray-500 mt-1">Sesi Terakhir</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className="text-sm font-semibold text-gray-900">{formatDate(patient.created_at)}</p>
            <p className="text-xs text-gray-500 mt-1">Pasien Sejak</p>
          </div>
        </div>

        {/* Riwayat Sesi */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Riwayat Sesi</h2>
            <Link href={`/sesi/baru?pasien=${patient.id}`} className="text-xs text-teal-600 hover:text-teal-700 font-medium">
              + Tambah Sesi
            </Link>
          </div>

          {sessions.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-500">Belum ada riwayat sesi.</p>
              <p className="text-xs text-gray-400 mt-1">Klik tombol di atas untuk mencatat sesi baru.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map(sesi => (
                <Link
                  key={sesi.id}
                  href={`/sesi/${sesi.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{sesi.chief_complaint}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(sesi.session_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      {sesi.pain_scale ? ` · Nyeri ${sesi.pain_scale}/10` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {sesi.points_used?.slice(0, 3).map(p => (
                      <span key={p} className="px-1.5 py-0.5 bg-teal-50 text-teal-700 text-xs rounded font-mono">{p}</span>
                    ))}
                    {(sesi.points_used?.length ?? 0) > 3 && (
                      <span className="text-xs text-gray-400">+{(sesi.points_used?.length ?? 0) - 3}</span>
                    )}
                    <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
