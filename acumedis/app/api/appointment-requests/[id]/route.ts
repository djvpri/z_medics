import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma/client'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenantId } = await requireAuth()
  if (error) return error
  const body = await req.json()
  const id = (await params).id
  const data: any = {}
  if (body.status !== undefined) data.status = body.status
  if (body.notes !== undefined) data.notes = body.notes || null
  await prisma.appointmentRequest.updateMany({ where: { id, tenantId: tenantId! }, data })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenantId } = await requireAuth()
  if (error) return error
  await prisma.appointmentRequest.deleteMany({ where: { id: (await params).id, tenantId: tenantId! } })
  return NextResponse.json({ success: true })
}
