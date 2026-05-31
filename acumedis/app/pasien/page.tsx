'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Topbar from '@/components/layout/Topbar'
import { createClient } from '@/lib/supabase/client'
import { Patient } from '@/types'

function calcAge(birthDate?: string) {
  if (!birthDate) return undefined
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  if (today.getMonth() - birth.getMonth() < 0 || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--
  return age
}

function GenderBadge({ gender }: { gender?: string }) {
  if (!gender) return <span className="text-gray-400">—</span>
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
      gender === 'female' ? 'bg-pink-50 text-pink-700' : 'bg-blue-50 text-blue-700'
    }`}>
      {gender === 'female' ? 'Perempuan' : 'Laki-laki'}
    </span>
  )
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function PasienPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPatients() {
      const supabase = createClient()
      const { data } = await supabase
        .from('patients')
        .select('*, sessions(count)')
        .order('created_at', { ascending: false })

      setPatients(
        (data ?? []).map((p: any) => ({
          ...p,
          age: calcAge(p.birth_date),
          total_sessions: p.sessions?.[0]?.count ?? 0,
        }))
      )
      setLoading(false)
    }
    fetchPatients()
  }, [])

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.phone && p.phone.includes(search))
  )

  return (
    <>
      <Topbar
        title="Pasien"
        subtitle={loading ? 'Memuat...' : `${patients.length} pasien terdaftar`}
        actions={
          <Link href="/pasien/baru" className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Tambah Pasien
          </Link>
        }
      />

      <div className="p-6 flex-1 space-y-4">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Cari nama atau nomor telepon..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-sm pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="py-16 text-center">
              <div className="inline-block w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm text-gray-400">Memuat data pasien...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-gray-500">
                {patients.length === 0 ? 'Belum ada pasien. Tambahkan pasien pertama Anda.' : 'Tidak ada pasien ditemukan.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Nama</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Usia</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Gender</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Telepon</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Total Sesi</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Sesi Terakhir</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(patient => (
                  <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-gray-900">{patient.name}</div>
                      {patient.email && <div className="text-xs text-gray-400 mt-0.5">{patient.email}</div>}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{patient.age ? `${patient.age} th` : '—'}</td>
                    <td className="px-5 py-3.5"><GenderBadge gender={patient.gender} /></td>
                    <td className="px-5 py-3.5 text-gray-600">{patient.phone || '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className="font-medium text-gray-900">{patient.total_sessions ?? 0}</span>
                      <span className="text-gray-400 text-xs ml-1">sesi</span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{formatDate(patient.last_session_date)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <Link href={`/pasien/${patient.id}`} className="text-teal-600 hover:text-teal-700 text-xs font-medium">
                        Lihat Detail →
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
