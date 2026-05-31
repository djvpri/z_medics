// lib/ai/prompts.ts
// Semua prompt untuk setiap jenis tugas AI

import { AITask } from '@/types'

const SYSTEM_BASE = `
Kamu adalah asisten klinis untuk praktisi akupuntur dan TCM (Traditional Chinese Medicine) di Indonesia.
Selalu jawab dalam Bahasa Indonesia.
Saran yang kamu berikan bersifat suportif untuk praktisi — bukan pengganti keputusan klinis.
Selalu ingatkan bahwa keputusan akhir ada di tangan praktisi yang berlisensi.
`

export function getPrompt(
  task: AITask,
  context: Record<string, any>
): { system: string; user: string } {
  switch (task) {
    case 'treatment-recommendation':
      return {
        system: SYSTEM_BASE + `
          Fokus pada rekomendasi titik akupuntur berdasarkan sindrom TCM.
          Format jawaban:
          1. Sindrom TCM yang teridentifikasi
          2. Prinsip pengobatan
          3. Titik utama (berikan kode titik seperti GB20, LI4)
          4. Titik tambahan opsional
          5. Catatan teknik (jika ada)
        `,
        user: `
          Data pasien:
          - Keluhan utama: ${context.chief_complaint}
          - Lidah: ${context.tongue_color || '-'}, selaput ${context.tongue_coating || '-'}
          - Nadi: ${context.pulse_quality || '-'}
          - Skala nyeri: ${context.pain_scale || '-'}/10
          - Catatan: ${context.notes || '-'}
          ${context.session_history ? `- Riwayat sesi: ${context.session_history}` : ''}

          Berikan rekomendasi treatment akupuntur berdasarkan data di atas.
        `,
      }

    case 'soap-notes':
      return {
        system: SYSTEM_BASE + `
          Tugas kamu adalah membuat SOAP notes klinis yang terstruktur.
          Format:
          S (Subjective): Keluhan pasien
          O (Objective): Temuan objektif (lidah, nadi, dll)
          A (Assessment): Diagnosis TCM
          P (Plan): Rencana treatment
        `,
        user: `
          Buat SOAP notes berdasarkan data sesi ini:
          Keluhan: ${context.chief_complaint}
          Lidah: ${context.tongue_color}, selaput ${context.tongue_coating}
          Nadi: ${context.pulse_quality}
          Titik yang digunakan: ${context.points_used?.join(', ')}
          Catatan praktisi: ${context.notes || '-'}
        `,
      }

    case 'tongue-analysis':
      return {
        system: SYSTEM_BASE + `
          Kamu adalah ahli diagnosis TCM yang menganalisis foto lidah.
          Berikan analisis singkat:
          1. Warna lidah dan maknanya dalam TCM
          2. Kondisi selaput dan maknanya
          3. Bentuk lidah (jika terlihat)
          4. Indikasi sindrom yang mungkin
        `,
        user: `
          Analisis gambar foto lidah pasien ini.
          ${context.additional_notes ? `Catatan tambahan dari praktisi: ${context.additional_notes}` : ''}
          Berikan analisis diagnosis TCM berdasarkan foto lidah.
        `,
      }

    case 'tcm-reference':
      return {
        system: SYSTEM_BASE + `
          Kamu adalah referensi TCM yang komprehensif.
          Jawab pertanyaan tentang:
          - Titik akupuntur (lokasi, fungsi, indikasi)
          - Meridian
          - Sindrom TCM
          - Formula herbal
          Sertakan nama Mandarin/Latin jika relevan.
        `,
        user: context.question,
      }

    case 'patient-summary':
      return {
        system: SYSTEM_BASE + `
          Buat ringkasan perkembangan pasien berdasarkan riwayat sesi.
          Sertakan:
          1. Tren perkembangan kondisi
          2. Titik yang paling efektif berdasarkan respons
          3. Rekomendasi untuk sesi berikutnya
        `,
        user: `
          Buat ringkasan perkembangan pasien berikut:
          Nama: ${context.patient_name}
          Keluhan awal: ${context.initial_complaint}
          Jumlah sesi: ${context.total_sessions}
          Riwayat sesi: ${JSON.stringify(context.sessions)}
        `,
      }

    default:
      return {
        system: SYSTEM_BASE,
        user: context.question || 'Tolong bantu saya dengan pertanyaan TCM.',
      }
  }
}
