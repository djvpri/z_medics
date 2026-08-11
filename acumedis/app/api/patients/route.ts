import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma/client'

export async function GET() {
  const { error, tenantId } = await requireAuth()
  if (error) return error
  const patients = await prisma.patient.findMany({
    where: { tenantId: tenantId! },
    include: {
      _count: { select: { sessions: true } },
      sessions: { orderBy: { sessionDate: 'desc' }, take: 1, select: { sessionDate: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(patients.map(p => ({
    ...p,
    avatar_url: p.avatarBase64 ? `data:image/jpeg;base64,${p.avatarBase64}` : null,
    avatarBase64: undefined,
    birth_date: p.birthDate?.toISOString().slice(0, 10),
    total_sessions: p._count.sessions,
    last_session_date: p.sessions[0]?.sessionDate.toISOString() ?? null,
  })))
}

export async function POST(req: NextRequest) {
  const { error, tenantId } = await requireAuth()
  if (error) return error
  try {
    const body = await req.json()
    const patient = await prisma.patient.create({
      data: {
        tenantId: tenantId!,
        name: body.name,
        gender: body.gender,
        birthDate: body.birth_date ? new Date(body.birth_date) : undefined,
        phone: body.phone,
        email: body.email,
        address: body.address,
      },
    })
    return NextResponse.json(patient, { status: 201 })
  } catch (err) {
    console.error('[api/patients] POST create failed:', err)
    return NextResponse.json(
      { error: (err as Error).message || 'Gagal menyimpan pasien' },
      { status: 500 }
    )
  }
}
