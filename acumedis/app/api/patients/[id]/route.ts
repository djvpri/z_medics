import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma/client'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenantId } = await requireAuth()
  if (error) return error
  const patient = await prisma.patient.findFirst({ where: { id: (await params).id, tenantId: tenantId! } })
  if (!patient) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({
    id: patient.id, name: patient.name, gender: patient.gender, birth_date: patient.birthDate ? patient.birthDate.toISOString().slice(0, 10) : null,
    phone: patient.phone, email: patient.email, address: patient.address,
    avatar_url: patient.avatarBase64 ? `data:image/jpeg;base64,${patient.avatarBase64}` : null,
    created_at: patient.createdAt.toISOString(),
  })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenantId } = await requireAuth()
  if (error) return error
  const body = await req.json()
  const patient = await prisma.patient.updateMany({
    where: { id: (await params).id, tenantId: tenantId! },
    data: { name: body.name, gender: body.gender, birthDate: body.birth_date ? new Date(body.birth_date) : undefined, phone: body.phone, email: body.email, address: body.address },
  })
  if (!patient.count) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenantId } = await requireAuth()
  if (error) return error
  await prisma.patient.deleteMany({ where: { id: (await params).id, tenantId: tenantId! } })
  return NextResponse.json({ success: true })
}
