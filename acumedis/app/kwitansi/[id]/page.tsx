'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatRp(val: number) {
  return 'Rp ' + val.toLocaleString('id-ID')
}

const payLabel: Record<string, string> = {
  paid: 'LUNAS', unpaid: 'BELUM DIBAYAR', partial: 'SEBAGIAN',
}

export default function KwitansiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [sesi, setSesi] = useState<any>(null)
  const [klinik, setKlinik] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [{ data: sesiData }, { data: { user } }] = await Promise.all([
        supabase.from('sessions').select('*, patient:patients(name, phone, gender, birth_date)').eq('id', id).single(),
        supabase.auth.getUser(),
      ])
      setSesi(sesiData)
      if (user) {
        const { data: klinikData } = await supabase
          .from('practitioners')
          .select('name, clinic_name, public_address, phone_public, city, avatar_url')
          .eq('id', sesiData?.practitioner_id ?? user.id)
          .single()
        setKlinik(klinikData)
      }
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', color: '#666' }}>
        Memuat kwitansi...
      </div>
    )
  }

  if (!sesi) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', color: '#666' }}>
        Sesi tidak ditemukan.
      </div>
    )
  }

  const nomorKwitansi = `KWT-${new Date(sesi.session_date).getFullYear()}-${id.slice(-6).toUpperCase()}`
  const isPaid = sesi.payment_status === 'paid'

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f5f5f5; font-family: 'DM Sans', sans-serif; }
        @media print {
          body { background: white; }
          .no-print { display: none !important; }
          .receipt { box-shadow: none !important; margin: 0 !important; border-radius: 0 !important; }
          @page { margin: 1cm; size: A5; }
        }
      `}</style>

      {/* Tombol aksi — tersembunyi saat print */}
      <div className="no-print" style={{ background: '#1a1a1a', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Kwitansi Pembayaran</span>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => window.history.back()}
            style={{ padding: '7px 16px', borderRadius: 8, fontSize: 13, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
            ← Kembali
          </button>
          <button onClick={() => window.print()}
            style={{ padding: '7px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: 'none', background: '#4A8C60', color: '#fff', cursor: 'pointer' }}>
            🖨 Cetak / Simpan PDF
          </button>
        </div>
      </div>

      {/* Receipt */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 16px', minHeight: 'calc(100vh - 52px)' }}>
        <div className="receipt" style={{ background: 'white', width: '100%', maxWidth: 520, borderRadius: 16, boxShadow: '0 4px 40px rgba(0,0,0,0.12)', overflow: 'hidden' }}>

          {/* Header klinik */}
          <div style={{ background: '#1C2B1F', padding: '28px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
            {klinik?.avatar_url ? (
              <img src={klinik.avatar_url} alt="logo" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.2)', flexShrink: 0 }} />
            ) : (
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#4A8C60', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#fff', flexShrink: 0 }}>
                {(klinik?.clinic_name ?? klinik?.name ?? 'K')[0]}
              </div>
            )}
            <div>
              <div style={{ fontFamily: 'serif', fontSize: 20, color: '#F5F0E8', letterSpacing: -0.3 }}>
                {klinik?.clinic_name ?? klinik?.name ?? 'Z Medics'}
              </div>
              {klinik?.name && klinik.clinic_name && (
                <div style={{ fontSize: 12, color: 'rgba(245,240,232,0.5)', marginTop: 2 }}>{klinik.name}</div>
              )}
              {(klinik?.public_address || klinik?.city) && (
                <div style={{ fontSize: 11, color: 'rgba(245,240,232,0.4)', marginTop: 3 }}>
                  {[klinik.public_address, klinik.city].filter(Boolean).join(', ')}
                </div>
              )}
            </div>
          </div>

          {/* Judul & nomor */}
          <div style={{ padding: '20px 32px 16px', borderBottom: '1px dashed #e0dbd4', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 10, color: '#9C9389', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>Kwitansi Pembayaran</div>
              <div style={{ fontFamily: 'serif', fontSize: 22, color: '#1C2B1F' }}>{nomorKwitansi}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#9C9389', marginBottom: 2 }}>Tanggal Sesi</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#3D3530' }}>{formatDate(sesi.session_date)}</div>
            </div>
          </div>

          {/* Info pasien */}
          <div style={{ padding: '16px 32px', borderBottom: '1px dashed #e0dbd4' }}>
            <div style={{ fontSize: 10, color: '#9C9389', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>Diterima dari</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#1C2B1F', marginBottom: 4 }}>{sesi.patient?.name ?? '—'}</div>
            {sesi.patient?.phone && <div style={{ fontSize: 13, color: '#6B6260' }}>{sesi.patient.phone}</div>}
          </div>

          {/* Detail layanan */}
          <div style={{ padding: '16px 32px', borderBottom: '1px dashed #e0dbd4' }}>
            <div style={{ fontSize: 10, color: '#9C9389', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>Detail Layanan</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#6B6260' }}>Keluhan</span>
                <span style={{ color: '#1C2B1F', fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{sesi.chief_complaint}</span>
              </div>
              {sesi.tcm_diagnosis && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: '#6B6260' }}>Diagnosis</span>
                  <span style={{ color: '#1C2B1F', fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{sesi.tcm_diagnosis}</span>
                </div>
              )}
              {sesi.points_used?.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: '#6B6260' }}>Titik Akupuntur</span>
                  <span style={{ color: '#1C2B1F', fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{sesi.points_used.join(', ')}</span>
                </div>
              )}
              {sesi.duration_minutes && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: '#6B6260' }}>Durasi</span>
                  <span style={{ color: '#1C2B1F', fontWeight: 500 }}>{sesi.duration_minutes} menit</span>
                </div>
              )}
            </div>
          </div>

          {/* Total & status */}
          <div style={{ padding: '20px 32px', borderBottom: '1px dashed #e0dbd4', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 11, color: '#9C9389', marginBottom: 4 }}>Total Biaya</div>
              <div style={{ fontFamily: 'serif', fontSize: 28, color: '#1C2B1F' }}>
                {sesi.fee ? formatRp(sesi.fee) : '—'}
              </div>
            </div>
            {sesi.payment_status && (
              <div style={{ padding: '8px 18px', borderRadius: 24, fontWeight: 700, fontSize: 13, letterSpacing: 0.5, background: isPaid ? '#E8F2EC' : sesi.payment_status === 'partial' ? '#FFF8E1' : '#FEECEC', color: isPaid ? '#2D5A3D' : sesi.payment_status === 'partial' ? '#B8860B' : '#8B2020' }}>
                {payLabel[sesi.payment_status] ?? sesi.payment_status}
              </div>
            )}
          </div>

          {/* Tanda tangan */}
          <div style={{ padding: '20px 32px 28px', display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#9C9389', marginBottom: 48 }}>Terapis</div>
              <div style={{ width: 140, borderTop: '1px solid #c0bab4', paddingTop: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#1C2B1F' }}>{klinik?.name ?? '—'}</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: '12px 32px', background: '#F8F5F0', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#9C9389' }}>Dokumen ini diterbitkan secara digital oleh sistem Z Medics</div>
          </div>
        </div>
      </div>
    </>
  )
}
