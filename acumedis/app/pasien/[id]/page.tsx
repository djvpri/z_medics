import { notFound } from 'next/navigation'
import { getPatient, getPatientSessions, getPatientLastTonguePhoto } from '@/lib/supabase/queries'
import { mockPatients, mockSessions } from '@/lib/mock-data'
import PatientDetailClient from '@/components/patients/PatientDetailClient'

export default async function DetailPasienPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let patient = await getPatient(id).catch(() => null)
  let sessions = await getPatientSessions(id).catch(() => [])

  if (!patient) {
    patient = mockPatients.find(p => p.id === id) ?? null
    sessions = mockSessions.filter(s => s.patient_id === id)
  }

  if (!patient) notFound()

  const tonguePhoto = sessions[0]
    ? await getPatientLastTonguePhoto(id).catch(() => null)
    : null

  const tongueAI = tonguePhoto?.ai_analysis
    ? (() => { try { return JSON.parse(tonguePhoto.ai_analysis) } catch { return null } })()
    : null

  const tonguePhotoUrl = tonguePhoto?.storage_path && tonguePhoto.storage_path !== 'local'
    ? tonguePhoto.storage_path
    : null

  return (
    <PatientDetailClient
      patient={patient}
      sessions={sessions}
      tongueAI={tongueAI}
      tonguePhotoUrl={tonguePhotoUrl}
    />
  )
}
