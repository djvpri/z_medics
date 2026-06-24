import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma/client'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, userId } = await requireAuth()
  if (error) return error
  const session = await prisma.session.findFirst({ where: { id: (await params).id, practitionerId: userId! }, include: { patient: true, photos: true } })
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(session)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, userId } = await requireAuth()
  if (error) return error
  const body = await req.json()
  await prisma.session.updateMany({
    where: { id: (await params).id, practitionerId: userId! },
    data: {
      chiefComplaint: body.chief_complaint,
      tongueColor: body.tongue_color,
      tongueCoating: body.tongue_coating,
      pulseQuality: body.pulse_quality,
      painScale: body.pain_scale,
      tcmDiagnosis: body.tcm_diagnosis,
      pointsUsed: body.points_used,
      durationMinutes: body.duration_minutes,
      notes: body.notes,
      aiRecommendation: body.ai_recommendation,
      fee: body.fee,
      paymentStatus: body.payment_status,
    },
  })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, userId } = await requireAuth()
  if (error) return error
  await prisma.session.deleteMany({ where: { id: (await params).id, practitionerId: userId! } })
  return NextResponse.json({ success: true })
}
