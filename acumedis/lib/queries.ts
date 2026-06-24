import { prisma } from './prisma/client'
import { Patient, Session } from '@/types'

function calcAge(birthDate?: Date | null): number | undefined {
  if (!birthDate) return undefined
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
  return age
}

function mapPatient(p: any): Patient {
  return {
    id: p.id,
    practitioner_id: p.tenantId, // backward compat
    name: p.name,
    gender: p.gender,
    birth_date: p.birthDate?.toISOString().slice(0, 10),
    phone: p.phone,
    email: p.email,
    address: p.address,
    avatar_url: p.avatarBase64 ? `data:image/jpeg;base64,${p.avatarBase64}` : undefined,
    created_at: p.createdAt.toISOString(),
    age: calcAge(p.birthDate),
    total_sessions: p._count?.sessions ?? 0,
  }
}

function mapSession(s: any): Session {
  return {
    id: s.id,
    patient_id: s.patientId,
    practitioner_id: s.practitionerId ?? s.tenantId,
    session_date: s.sessionDate.toISOString(),
    chief_complaint: s.chiefComplaint,
    tongue_color: s.tongueColor,
    tongue_coating: s.tongueCoating,
    pulse_quality: s.pulseQuality,
    pain_scale: s.painScale,
    tcm_diagnosis: s.tcmDiagnosis,
    points_used: s.pointsUsed,
    duration_minutes: s.durationMinutes,
    notes: s.notes,
    ai_recommendation: s.aiRecommendation,
    fee: s.fee,
    payment_status: s.paymentStatus,
    created_at: s.createdAt.toISOString(),
    patient: s.patient ? mapPatient(s.patient) : undefined,
  }
}

// ── Patients ──────────────────────────────────────────────────

export async function getPatients(tenantId: string): Promise<Patient[]> {
  const data = await prisma.patient.findMany({
    where: { tenantId },
    include: { _count: { select: { sessions: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return data.map(mapPatient)
}

export async function getPatient(id: string, tenantId: string): Promise<Patient | null> {
  const data = await prisma.patient.findFirst({ where: { id, tenantId } })
  if (!data) return null
  return mapPatient(data)
}

export async function getPatientSessions(patientId: string, tenantId: string): Promise<Session[]> {
  const data = await prisma.session.findMany({
    where: { patientId, tenantId },
    orderBy: { sessionDate: 'desc' },
  })
  return data.map(mapSession)
}

// ── Sessions ──────────────────────────────────────────────────

export async function getSessions(tenantId: string): Promise<Session[]> {
  const data = await prisma.session.findMany({
    where: { tenantId },
    include: { patient: { select: { id: true, name: true, gender: true } } },
    orderBy: { sessionDate: 'desc' },
  })
  return data.map(mapSession)
}

export async function getSession(id: string, tenantId: string): Promise<Session | null> {
  const data = await prisma.session.findFirst({
    where: { id, tenantId },
    include: { patient: true },
  })
  if (!data) return null
  return mapSession(data)
}

// ── Appointment requests ──────────────────────────────────────

export async function getPendingRequests(tenantId: string) {
  return prisma.appointmentRequest.findMany({
    where: { tenantId, status: 'pending' },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })
}

// ── Session photos ────────────────────────────────────────────

export async function getLastTonguePhoto(sessionId: string) {
  return prisma.sessionPhoto.findFirst({
    where: { sessionId, photoType: 'tongue' },
    select: { id: true, aiAnalysis: true, createdAt: true, photoBase64: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getPatientLastTonguePhoto(patientId: string, tenantId: string) {
  const sessions = await prisma.session.findMany({
    where: { patientId, tenantId },
    select: { id: true },
  })
  if (!sessions.length) return null
  const sessionIds = sessions.map(s => s.id)
  const photo = await prisma.sessionPhoto.findFirst({
    where: { sessionId: { in: sessionIds }, photoType: 'tongue', aiAnalysis: { not: null } },
    select: { id: true, aiAnalysis: true, photoBase64: true, sessionId: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })
  if (!photo) return null
  return {
    ...photo,
    storage_path: photo.photoBase64 ? `data:image/jpeg;base64,${photo.photoBase64}` : '',
  }
}

// ── Low stock items ───────────────────────────────────────────

export async function getLowStockItems(tenantId: string) {
  const items = await prisma.stockItem.findMany({
    where: { tenantId },
    select: { id: true, name: true, category: true, quantity: true, minQuantity: true, unit: true },
    orderBy: { quantity: 'asc' },
  })
  return items.filter(i => i.quantity <= i.minQuantity)
}

// ── Follow-up reminders ───────────────────────────────────────

export async function getFollowUpPatients(tenantId: string, daysThreshold = 30) {
  const sessions = await prisma.session.findMany({
    where: { tenantId },
    include: { patient: { select: { id: true, name: true, phone: true } } },
    orderBy: { sessionDate: 'desc' },
    take: 500,
  })
  const lastSeen: Record<string, { id: string; name: string; phone: string | null; lastDate: string }> = {}
  for (const s of sessions) {
    if (!lastSeen[s.patientId]) {
      lastSeen[s.patientId] = {
        id: s.patient.id, name: s.patient.name, phone: s.patient.phone,
        lastDate: s.sessionDate.toISOString(),
      }
    }
  }
  const threshold = new Date()
  threshold.setDate(threshold.getDate() - daysThreshold)
  return Object.values(lastSeen)
    .filter(p => new Date(p.lastDate) < threshold)
    .sort((a, b) => new Date(a.lastDate).getTime() - new Date(b.lastDate).getTime())
    .slice(0, 10)
}

// ── Week appointments ─────────────────────────────────────────

export async function getWeekAppointments(tenantId: string) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const end = new Date(today); end.setDate(end.getDate() + 7); end.setHours(23, 59, 59, 999)
  const data = await prisma.appointment.findMany({
    where: { tenantId, scheduledAt: { gte: today, lte: end }, status: { not: 'cancelled' } },
    include: { patient: { select: { id: true, name: true } } },
    orderBy: { scheduledAt: 'asc' },
  })
  return data.map(a => ({
    id: a.id, scheduled_at: a.scheduledAt.toISOString(),
    duration_minutes: a.durationMinutes, reason: a.reason, status: a.status,
    session_id: a.sessionId, external_name: a.externalName, external_phone: a.externalPhone,
    patient: a.patient ? { id: a.patient.id, name: a.patient.name } : null,
  }))
}

// ── Dashboard stats ───────────────────────────────────────────

export async function getDashboardStats(tenantId: string) {
  const now = new Date()
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const [totalPatients, totalSessions, todaySessions, newPatients, paidSessions] = await Promise.all([
    prisma.patient.count({ where: { tenantId } }),
    prisma.session.count({ where: { tenantId } }),
    prisma.session.count({ where: { tenantId, sessionDate: { gte: todayStart } } }),
    prisma.patient.count({ where: { tenantId, createdAt: { gte: monthStart } } }),
    prisma.session.findMany({ where: { tenantId, paymentStatus: 'paid', sessionDate: { gte: monthStart } }, select: { fee: true } }),
  ])
  const monthIncome = paidSessions.reduce((sum, s) => sum + (s.fee ?? 0), 0)
  return { totalPatients, totalSessions, todaySessions, newPatients, monthIncome }
}
