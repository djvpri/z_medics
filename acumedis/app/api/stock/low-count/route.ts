import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma/client'
export async function GET() {
  const { error, tenantId } = await requireAuth()
  if (error) return NextResponse.json({ count: 0 })
  const items = await prisma.stockItem.findMany({ where: { tenantId: tenantId! }, select: { quantity: true, minQuantity: true } })
  const count = items.filter(i => i.quantity <= i.minQuantity).length
  return NextResponse.json({ count })
}
