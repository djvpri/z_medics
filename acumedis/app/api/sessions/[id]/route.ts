import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma/client'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenantId } = await requireAuth()
  if (error) return error
  const session = await prisma.session.findFirst({ where: { id: (await params).id, tenantId: tenantId! }, include: { patient: true, photos: true } })
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({
    id: session.id, patient_id: session.patientId, session_date: session.sessionDate.toISOString().slice(0, 10),
    chief_complaint: session.chiefComplaint, tongue_color: session.tongueColor, tongue_coating: session.tongueCoating,
    pulse_quality: session.pulseQuality, pain_scale: session.painScale, tcm_diagnosis: session.tcmDiagnosis,
    points_used: session.pointsUsed, duration_minutes: session.durationMinutes, notes: session.notes,
    ai_recommendation: session.aiRecommendation, fee: session.fee, payment_status: session.paymentStatus,
    created_at: session.createdAt.toISOString(),
    patient: session.patient ? { name: session.patient.name, phone: session.patient.phone, gender: session.patient.gender, birth_date: session.patient.birthDate ? session.patient.birthDate.toISOString().slice(0, 10) : null } : null,
  })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenantId } = await requireAuth()
  if (error) return error
  const body = await req.json()
  const s = await prisma.session.updateMany({
    where: { id: (await params).id, tenantId: tenantId! },
    data: {
      patientId: body.patient_id || undefined,
      chiefComplaint: body.chief_complaint,
      tongueColor: body.tongue_color,
      tongueCoating: body.tongue_coating,
      pulseQuality: body.pulse_quality,
      painScale: body.pain_scale !== undefined && body.pain_scale !== null && body.pain_scale !== '' ? Number(body.pain_scale) : null,
      tcmDiagnosis: body.tcm_diagnosis,
      pointsUsed: body.points_used,
      durationMinutes: body.duration_minutes !== undefined ? (body.duration_minutes === null || body.duration_minutes === '' ? null : Number(body.duration_minutes)) : undefined,
      notes: body.notes,
      aiRecommendation: body.ai_recommendation,
      fee: body.fee !== undefined ? (body.fee === null || body.fee === '' ? null : Number(body.fee)) : undefined,
      paymentStatus: body.payment_status,
    },
  })
  if (!s.count) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenantId } = await requireAuth()
  if (error) return error
  await prisma.session.deleteMany({ where: { id: (await params).id, tenantId: tenantId! } })
  return NextResponse.json({ success: true })
}
