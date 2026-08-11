import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma/client'

export async function GET() {
  const { error, tenantId } = await requireAuth()
  if (error) return error
  const sessions = await prisma.session.findMany({
    where: { tenantId: tenantId! },
    include: { patient: { select: { id: true, name: true, gender: true } } },
    orderBy: { sessionDate: 'desc' },
  })
  return NextResponse.json(sessions.map(s => ({
    id: s.id,
    patient_id: s.patientId,
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
    fee: s.fee,
    payment_status: s.paymentStatus,
    created_at: s.createdAt.toISOString(),
    patient: s.patient ? { id: s.patient.id, name: s.patient.name, gender: s.patient.gender } : null,
  })))
}

export async function POST(req: NextRequest) {
  const { error, tenantId, userId } = await requireAuth()
  if (error) return error
  const body = await req.json()
  const session = await prisma.session.create({
    data: {
      tenantId: tenantId!,
      practitionerId: userId!,
      patientId: body.patient_id,
      sessionDate: body.session_date ? new Date(body.session_date) : new Date(),
      chiefComplaint: body.chief_complaint,
      tongueColor: body.tongue_color,
      tongueCoating: body.tongue_coating,
      pulseQuality: body.pulse_quality,
      painScale: body.pain_scale,
      pointsUsed: body.points_used || [],
      durationMinutes: body.duration_minutes,
      notes: body.notes,
      fee: body.fee,
      paymentStatus: body.payment_status || 'unpaid',
    },
  })
  return NextResponse.json(session, { status: 201 })
}
