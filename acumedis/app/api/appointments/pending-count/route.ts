import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma/client'
export async function GET() {
  const { error, userId } = await requireAuth()
  if (error) return NextResponse.json({ count: 0 })
  const count = await prisma.appointmentRequest.count({ where: { practitionerId: userId!, status: 'pending' } })
  return NextResponse.json({ count })
}
