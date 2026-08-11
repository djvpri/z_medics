import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma/client'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenantId } = await requireAuth()
  if (error) return error
  const body = await req.json()
  const data: any = {}
  if (body.name !== undefined) data.name = body.name
  if (body.category !== undefined) data.category = body.category
  if (body.quantity !== undefined) data.quantity = Number(body.quantity)
  if (body.min_quantity !== undefined) data.minQuantity = Number(body.min_quantity)
  if (body.unit !== undefined) data.unit = body.unit
  const item = await prisma.stockItem.updateMany({ where: { id: (await params).id, tenantId: tenantId! }, data })
  if (!item.count) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenantId } = await requireAuth()
  if (error) return error
  await prisma.stockItem.deleteMany({ where: { id: (await params).id, tenantId: tenantId! } })
  return NextResponse.json({ success: true })
}
