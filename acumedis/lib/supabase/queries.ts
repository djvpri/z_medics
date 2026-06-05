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

  if (error) return []

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

  if (error) return []
  return data ?? []
}

// ── Sessions ──────────────────────────────────────────────────

export async function getSessions(): Promise<Session[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('sessions')
    .select('*, patient:patients(id, name, gender)')
    .order('session_date', { ascending: false })

  if (error) return []
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

// ── Appointment requests ──────────────────────────────────────

export async function getPendingRequests() {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('appointment_requests')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(5)
  return data ?? []
}

// ── Session photos ────────────────────────────────────────────

export async function getLastTonguePhoto(sessionId: string) {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('session_photos')
    .select('id, ai_analysis, created_at')
    .eq('session_id', sessionId)
    .eq('photo_type', 'tongue')
    .order('created_at', { ascending: false })
    .limit(1)
  return data?.[0] ?? null
}

// Cari foto lidah terbaru dari semua sesi pasien
export async function getPatientLastTonguePhoto(patientId: string) {
  const supabase = await createServerSupabaseClient()

  // Ambil semua session ID milik pasien ini
  const { data: sessions } = await supabase
    .from('sessions')
    .select('id')
    .eq('patient_id', patientId)

  if (!sessions || sessions.length === 0) return null

  const sessionIds = sessions.map(s => s.id)

  const { data } = await supabase
    .from('session_photos')
    .select('id, ai_analysis, storage_path, session_id, created_at')
    .eq('photo_type', 'tongue')
    .in('session_id', sessionIds)
    .not('ai_analysis', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)

  return data?.[0] ?? null
}

// ── Today's appointments ──────────────────────────────────────

export async function getWeekAppointments() {
  const supabase = await createServerSupabaseClient()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const end = new Date(today)
  end.setDate(end.getDate() + 7)
  end.setHours(23, 59, 59, 999)

  const { data } = await supabase
    .from('appointments')
    .select('id, scheduled_at, duration_minutes, reason, status, session_id, external_name, external_phone, patient:patients(id, name)')
    .gte('scheduled_at', today.toISOString())
    .lte('scheduled_at', end.toISOString())
    .neq('status', 'cancelled')
    .order('scheduled_at')

  return data ?? []
}

// ── Dashboard stats ───────────────────────────────────────────

export async function getDashboardStats() {
  const supabase = await createServerSupabaseClient()

  const now = new Date()
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  const [
    { count: totalPatients },
    { count: totalSessions },
    { count: todaySessions },
    { count: newPatients },
    { data: paidSessions },
  ] = await Promise.all([
    supabase.from('patients').select('*', { count: 'exact', head: true }),
    supabase.from('sessions').select('*', { count: 'exact', head: true }),
    supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .gte('session_date', now.toISOString().slice(0, 10)),
    supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(new Date().setDate(1)).toISOString()),
    supabase
      .from('sessions')
      .select('fee')
      .eq('payment_status', 'paid')
      .gte('session_date', monthStart),
  ])

  const monthIncome = (paidSessions ?? []).reduce((sum, s: any) => sum + (s.fee ?? 0), 0)

  return {
    totalPatients: totalPatients ?? 0,
    totalSessions: totalSessions ?? 0,
    todaySessions: todaySessions ?? 0,
    newPatients: newPatients ?? 0,
    monthIncome,
  }
}
