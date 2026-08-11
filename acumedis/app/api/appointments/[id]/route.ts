import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma/client'

function toPrisma(s?: string) {
  if (s === 'scheduled') return 'confirmed'
  if (s === 'completed') return 'done'
  return s
}

function fromPrisma(s: string) {
  if (s === 'confirmed') return 'scheduled'
  if (s === 'done') return 'completed'
  return s
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenantId } = await requireAuth()
  if (error) return error
  const a = await prisma.appointment.findFirst({ where: { id: (await params).id, tenantId: tenantId! }, include: { patient: { select: { id: true, name: true } } } })
  if (!a) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({
    id: a.id, patient_id: a.patientId, scheduled_at: a.scheduledAt.toISOString(),
    duration_minutes: a.durationMinutes, reason: a.reason, status: fromPrisma(a.status),
    session_id: a.sessionId, external_name: a.externalName, external_phone: a.externalPhone,
    notes: a.notes, queue_number: a.queueNumber,
    patient: a.patient ? { id: a.patient.id, name: a.patient.name } : null,
  })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenantId } = await requireAuth()
  if (error) return error
  const body = await req.json()
  const id = (await params).id
  const data: any = {}
  if (body.patient_id !== undefined) data.patientId = body.patient_id || null
  if (body.status !== undefined) data.status = toPrisma(body.status)
  if (body.scheduled_at !== undefined) data.scheduledAt = new Date(body.scheduled_at)
  if (body.duration_minutes !== undefined) data.durationMinutes = Number(body.duration_minutes)
  if (body.reason !== undefined) data.reason = body.reason || null
  if (body.notes !== undefined) data.notes = body.notes || null
  if (body.session_id !== undefined) data.sessionId = body.session_id || null
  await prisma.appointment.updateMany({ where: { id, tenantId: tenantId! }, data })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenantId } = await requireAuth()
  if (error) return error
  await prisma.appointment.deleteMany({ where: { id: (await params).id, tenantId: tenantId! } })
  return NextResponse.json({ success: true })
}
