import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id
  const t = await prisma.tenant.findFirst({
    where: { id, isListed: true, isActive: true },
    include: {
      practitioners: { select: { name: true, avatarBase64: true }, take: 1 },
      clinicPhotos: { orderBy: { createdAt: 'desc' }, select: { id: true, photoBase64: true } },
    },
  })
  if (!t) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const owner = t.practitioners[0]
  const photos = t.clinicPhotos.map(p => ({ id: p.id, url: p.photoBase64.startsWith('data:') ? p.photoBase64 : `data:image/jpeg;base64,${p.photoBase64}` }))
  return NextResponse.json({
    id: t.id,
    name: owner?.name ?? t.name,
    clinic_name: t.clinicName ?? t.name,
    city: t.city,
    province: t.province,
    public_address: t.publicAddress,
    description: t.description,
    specialty: t.specialty,
    phone_public: t.phonePublic,
    email: null,
    avatar_url: owner?.avatarBase64 ? `data:image/jpeg;base64,${owner.avatarBase64}` : null,
    accepts_bookings: t.acceptsBookings,
    clinic_photos: photos,
  })
}
