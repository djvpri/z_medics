import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma/client'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenantId } = await requireAuth()
  if (error) return error
  try {
    const { avatarBase64 } = await req.json()
    await prisma.patient.updateMany({ where: { id: (await params).id, tenantId: tenantId! }, data: { avatarBase64 } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[api/patients/[id]/avatar] PATCH failed:', err)
    return NextResponse.json({ error: (err as Error).message || 'Gagal simpan avatar' }, { status: 500 })
  }
}
