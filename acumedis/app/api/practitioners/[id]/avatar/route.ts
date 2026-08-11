import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma/client'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, userId, tenantId } = await requireAuth()
  if (error) return error
  const body = await req.json()
  const target = (await params).id
  // Hanya boleh mengubah diri sendiri (atau rekan satu tenant)
  await prisma.practitioner.updateMany({
    where: { id: target, tenantId: tenantId!, OR: [{ id: userId! }] },
    data: { avatarBase64: body.avatarBase64 },
  })
  return NextResponse.json({ success: true })
}
