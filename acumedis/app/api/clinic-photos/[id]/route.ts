import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma/client'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, userId } = await requireAuth()
  if (error) return error
  await prisma.clinicPhoto.deleteMany({ where: { id: (await params).id, practitionerId: userId! } })
  return NextResponse.json({ success: true })
}
