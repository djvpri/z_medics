import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma/client'

export async function GET() {
  const { error, userId } = await requireAuth()
  if (error) return error
  const photos = await prisma.clinicPhoto.findMany({ where: { practitionerId: userId! }, orderBy: { createdAt: 'desc' } })
  return NextResponse.json(photos)
}

export async function POST(req: NextRequest) {
  const { error, userId } = await requireAuth()
  if (error) return error
  const { photoBase64, caption } = await req.json()
  const photo = await prisma.clinicPhoto.create({ data: { practitionerId: userId!, photoBase64, caption } })
  return NextResponse.json(photo, { status: 201 })
}
