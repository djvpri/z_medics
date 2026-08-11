import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'

export async function GET() {
  const tenants = await prisma.tenant.findMany({
    where: { isListed: true, isActive: true },
    include: {
      practitioners: { select: { name: true, avatarBase64: true } },
      clinicPhotos: { orderBy: { createdAt: 'desc' }, take: 1, select: { photoBase64: true } },
    },
    orderBy: { clinicName: 'asc' },
  })
  return NextResponse.json(tenants.map(t => {
    const owner = t.practitioners[0]
    return {
      id: t.id,
      name: owner?.name ?? t.name,
      clinic_name: t.clinicName ?? t.name,
      city: t.city,
      province: t.province,
      public_address: t.publicAddress,
      description: t.description,
      specialty: t.specialty,
      phone_public: t.phonePublic,
      avatar_url: owner?.avatarBase64 ? `data:image/jpeg;base64,${owner.avatarBase64}` : null,
      accepts_bookings: t.acceptsBookings,
      clinic_photos: t.clinicPhotos.map(p => ({ url: p.photoBase64.startsWith('data:') ? p.photoBase64 : `data:image/jpeg;base64,${p.photoBase64}` })),
    }
  }))
}
