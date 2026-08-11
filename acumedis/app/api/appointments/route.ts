import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma/client'

// user-space ke Prisma enum
function toPrisma(s?: string): any {
  if (s === 'scheduled') return 'confirmed'
  if (s === 'completed') return 'done'
  return s || 'confirmed'
}
function fromPrisma(s: string): string {
  if (s === 'confirmed') return 'scheduled'
  if (s === 'done') return 'completed'
  return s
}

function map(a: any) {
  return {
    id: a.id,
    patient_id: a.patientId,
    scheduled_at: a.scheduledAt.toISOString(),
    duration_minutes: a.durationMinutes,
    reason: a.reason,
    status: fromPrisma(a.status),
    session_id: a.sessionId,
    external_name: a.externalName,
    external_phone: a.externalPhone,
    patient: a.patient ? { id: a.patient.id, name: a.patient.name } : null,
  }
}

export async function GET(req: NextRequest) {
  const { error, tenantId } = await requireAuth()
  if (error) return error
  const url = new URL(req.url)
  const start = url.searchParams.get('start')
  const end = url.searchParams.get('end')
  const status = url.searchParams.get('status')
  const where: any = { tenantId: tenantId! }
  if (start || end) {
    where.scheduledAt = {}
    if (start) where.scheduledAt.gte = new Date(start)
    if (end) where.scheduledAt.lte = new Date(`${end}T23:59:59.999`)
  }
  if (status && status !== 'all') where.status = toPrisma(status)
  const rows = await prisma.appointment.findMany({
    where,
    include: { patient: { select: { id: true, name: true } } },
    orderBy: { scheduledAt: 'desc' },
  })
  return NextResponse.json(rows.map(map))
}

export async function POST(req: NextRequest) {
  const { error, userId, tenantId } = await requireAuth()
  if (error) return error
  const body = await req.json()
  const appt = await prisma.appointment.create({
    data: {
      tenantId: tenantId!,
      practitionerId: userId!,
      patientId: body.patient_id || body.patientId || undefined,
      scheduledAt: new Date(body.scheduled_at),
      durationMinutes: Number(body.duration_minutes) || 60,
      reason: body.reason || null,
      status: toPrisma(body.status),
      externalName: body.external_name || null,
      externalPhone: body.external_phone || null,
    },
  })
  return NextResponse.json(map(appt), { status: 201 })
}
