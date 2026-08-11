import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma/client'

export async function GET() {
  const { error, tenantId } = await requireAuth()
  if (error) return error
  const items = await prisma.stockItem.findMany({ where: { tenantId: tenantId! }, orderBy: [{ category: 'asc' }, { name: 'asc' }] })
  return NextResponse.json(items.map(i => ({ id: i.id, name: i.name, category: i.category, quantity: i.quantity, min_quantity: i.minQuantity, unit: i.unit })))
}

export async function POST(req: NextRequest) {
  const { error, tenantId } = await requireAuth()
  if (error) return error
  const body = await req.json()
  const item = await prisma.stockItem.create({
    data: {
      tenantId: tenantId!,
      name: body.name,
      category: body.category,
      quantity: Number(body.quantity) || 0,
      minQuantity: Number(body.min_quantity) || 0,
      unit: body.unit,
    },
  })
  return NextResponse.json({ id: item.id, name: item.name, category: item.category, quantity: item.quantity, min_quantity: item.minQuantity, unit: item.unit }, { status: 201 })
}
