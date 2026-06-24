import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma/client'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, userId } = await requireAuth()
  if (error) return error
  const { avatarBase64 } = await req.json()
  await prisma.patient.updateMany({ where: { id: (await params).id, practitionerId: userId! }, data: { avatarBase64 } })
  return NextResponse.json({ success: true })
}
