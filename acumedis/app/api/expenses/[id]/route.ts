import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma/client'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenantId } = await requireAuth()
  if (error) return error
  await prisma.expense.deleteMany({ where: { id: (await params).id, tenantId: tenantId! } })
  return NextResponse.json({ success: true })
}
