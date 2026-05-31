import Link from 'next/link'
import Topbar from '@/components/layout/Topbar'
import { getSessions } from '@/lib/supabase/queries'

function PainBadge({ scale }: { scale?: number }) {
  if (!scale) return <span className="text-gray-400">—</span>
  const color = scale <= 3 ? 'bg-green-50 text-green-700' : scale <= 6 ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>{scale}/10</span>
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

export default async function SesiPage() {
  const sessions = await getSessions().catch(() => [])

  return (
    <>
      <Topbar
        title="Sesi"
        subtitle={`${sessions.length} sesi tercatat`}
        actions={
          <Link href="/sesi/baru" className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Sesi Baru
          </Link>
        }
      />

      <div className="p-6 flex-1">
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {sessions.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-gray-500">Belum ada sesi. Tambahkan sesi baru untuk mulai mencatat.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Tanggal</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Pasien</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Keluhan Utama</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Titik</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Nyeri</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Durasi</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sessions.map(sesi => (
                  <tr key={sesi.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-gray-900">{formatDate(sesi.session_date)}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{formatTime(sesi.session_date)}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Link href={`/pasien/${sesi.patient_id}`} className="text-teal-600 hover:underline font-medium">
                        {(sesi.patient as any)?.name ?? '—'}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 max-w-[220px]">
                      <span className="line-clamp-2">{sesi.chief_complaint}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {sesi.points_used?.slice(0, 3).map(p => (
                          <span key={p} className="px-1.5 py-0.5 bg-teal-50 text-teal-700 text-xs rounded font-mono">{p}</span>
                        ))}
                        {(sesi.points_used?.length ?? 0) > 3 && (
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-xs rounded">+{(sesi.points_used?.length ?? 0) - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><PainBadge scale={sesi.pain_scale} /></td>
                    <td className="px-5 py-3.5 text-gray-600">{sesi.duration_minutes ? `${sesi.duration_minutes} mnt` : '—'}</td>
                    <td className="px-5 py-3.5 text-right">
                      <Link href={`/sesi/${sesi.id}`} className="text-teal-600 hover:text-teal-700 text-xs font-medium">Detail →</Link>
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
