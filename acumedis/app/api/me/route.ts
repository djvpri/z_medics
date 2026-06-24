import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma/client'

export async function GET() {
  const { error, userId } = await requireAuth()
  if (error) return error
  const user = await prisma.practitioner.findUnique({
    where: { id: userId! },
    select: { id: true, name: true, email: true, phone: true, avatarBase64: true, currency: true, tenantId: true, role: true },
  })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({
    ...user,
    avatar_url: user.avatarBase64 ? `data:image/jpeg;base64,${user.avatarBase64}` : null,
    avatarBase64: undefined,
  })
}

export async function PATCH(req: Request) {
  const { error, userId } = await requireAuth()
  if (error) return error
  const body = await req.json()
  const user = await prisma.practitioner.update({
    where: { id: userId! },
    data: { name: body.name, phone: body.phone, currency: body.currency },
  })
  return NextResponse.json({ success: true, name: user.name })
}
