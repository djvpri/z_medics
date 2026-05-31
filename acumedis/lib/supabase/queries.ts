import { createServerSupabaseClient } from './server'
import { Patient, Session } from '@/types'

function calcAge(birthDate?: string): number | undefined {
  if (!birthDate) return undefined
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

// ── Patients ──────────────────────────────────────────────────

export async function getPatients(): Promise<Patient[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('patients')
    .select('*, sessions(count)')
    .order('created_at', { ascending: false })

  if (error) { console.error(error); return [] }

  return (data ?? []).map((p: any) => ({
    ...p,
    age: calcAge(p.birth_date),
    total_sessions: p.sessions?.[0]?.count ?? 0,
  }))
}

export async function getPatient(id: string): Promise<Patient | null> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return { ...data, age: calcAge(data.birth_date) }
}

export async function getPatientSessions(patientId: string): Promise<Session[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('patient_id', patientId)
    .order('session_date', { ascending: false })

  if (error) { console.error(error); return [] }
  return data ?? []
}

// ── Sessions ──────────────────────────────────────────────────

export async function getSessions(): Promise<Session[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('sessions')
    .select('*, patient:patients(id, name, gender)')
    .order('session_date', { ascending: false })

  if (error) { console.error(error); return [] }
  return data ?? []
}

export async function getSession(id: string): Promise<Session | null> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('sessions')
    .select('*, patient:patients(*)')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

// ── Dashboard stats ───────────────────────────────────────────

export async function getDashboardStats() {
  const supabase = await createServerSupabaseClient()

  const [{ count: totalPatients }, { count: totalSessions }, { count: todaySessions }, { count: newPatients }] =
    await Promise.all([
      supabase.from('patients').select('*', { count: 'exact', head: true }),
      supabase.from('sessions').select('*', { count: 'exact', head: true }),
      supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .gte('session_date', new Date().toISOString().slice(0, 10)),
      supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(new Date().setDate(1)).toISOString()),
    ])

  return {
    totalPatients: totalPatients ?? 0,
    totalSessions: totalSessions ?? 0,
    todaySessions: todaySessions ?? 0,
    newPatients: newPatients ?? 0,
  }
}
