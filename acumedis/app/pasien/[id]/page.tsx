import { notFound } from 'next/navigation'
import { getPatient, getPatientSessions, getPatientLastTonguePhoto } from '@/lib/supabase/queries'
import { getSessionUser } from '@/lib/api-auth'
import { mockPatients, mockSessions } from '@/lib/mock-data'
import PatientDetailClient from '@/components/patients/PatientDetailClient'

export default async function DetailPasienPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sess = await getSessionUser()
  const tenantId = sess?.tenantId

  let patient = tenantId ? await getPatient(id, tenantId).catch(() => null) : null
  let sessions = tenantId ? await getPatientSessions(id, tenantId).catch(() => []) : []

  if (!patient) {
    patient = mockPatients.find(p => p.id === id) ?? null
    sessions = mockSessions.filter(s => s.patient_id === id)
  }

  if (!patient) notFound()

  const tonguePhoto = sessions[0] && tenantId
    ? await getPatientLastTonguePhoto(id, tenantId).catch(() => null)
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
