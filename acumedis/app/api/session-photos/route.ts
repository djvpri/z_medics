import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma/client'

export async function POST(req: NextRequest) {
  const { error, userId } = await requireAuth()
  if (error) return error
  const { sessionId, photoType, photoBase64 } = await req.json()
  const session = await prisma.session.findFirst({ where: { id: sessionId, practitionerId: userId! } })
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  const photo = await prisma.sessionPhoto.create({
    data: { sessionId, photoType: photoType || 'tongue', photoBase64 },
  })
  return NextResponse.json(photo, { status: 201 })
}
