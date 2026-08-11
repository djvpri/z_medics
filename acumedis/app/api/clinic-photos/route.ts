import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma/client'

export async function GET() {
  const { error, tenantId } = await requireAuth()
  if (error) return error
  const photos = await prisma.clinicPhoto.findMany({ where: { tenantId: tenantId! }, orderBy: { createdAt: 'desc' } })
  return NextResponse.json(photos.map(p => ({ id: p.id, url: p.photoBase64.startsWith('data:') ? p.photoBase64 : `data:image/jpeg;base64,${p.photoBase64}`, caption: p.caption })))
}

export async function POST(req: NextRequest) {
  const { error, tenantId } = await requireAuth()
  if (error) return error
  const { photoBase64, caption } = await req.json()
  const photo = await prisma.clinicPhoto.create({ data: { tenantId: tenantId!, photoBase64, caption } })
  return NextResponse.json({ id: photo.id, url: photo.photoBase64.startsWith('data:') ? photo.photoBase64 : `data:image/jpeg;base64,${photo.photoBase64}`, caption: photo.caption }, { status: 201 })
}
