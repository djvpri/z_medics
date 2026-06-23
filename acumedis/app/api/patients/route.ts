import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma/client'

export async function GET() {
  const { error, userId } = await requireAuth()
  if (error) return error

  const patients = await prisma.patient.findMany({
    where: { practitionerId: userId! },
    include: { _count: { select: { sessions: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(patients.map((p: any) => ({
    ...p,
    avatar_url: p.avatarBase64 ? `data:image/jpeg;base64,${p.avatarBase64}` : null,
    avatarBase64: undefined,
    birth_date: p.birthDate?.toISOString().slice(0, 10),
    total_sessions: p._count.sessions,
  })))
}

export async function POST(req: NextRequest) {
  const { error, userId } = await requireAuth()
  if (error) return error

  const body = await req.json()
  const patient = await prisma.patient.create({
    data: {
      practitionerId: userId!,
      name: body.name,
      gender: body.gender,
      birthDate: body.birth_date ? new Date(body.birth_date) : undefined,
      phone: body.phone,
      email: body.email,
      address: body.address,
    },
  })
  return NextResponse.json(patient, { status: 201 })
}
