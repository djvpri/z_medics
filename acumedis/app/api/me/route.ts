import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma/client'

export async function GET() {
  const { error, userId } = await requireAuth()
  if (error) return error
  const user = await prisma.practitioner.findUnique({
    where: { id: userId! },
    include: { tenant: true },
  })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const t = user.tenant
  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    currency: user.currency,
    default_fee: user.defaultFee ?? 0,
    role: user.role,
    tenant_id: user.tenantId,
    avatar_url: user.avatarBase64 ? `data:image/jpeg;base64,${user.avatarBase64}` : null,
    clinic_name: t.clinicName,
    specialty: t.specialty,
    city: t.city,
    province: t.province,
    public_address: t.publicAddress,
    description: t.description,
    phone_public: t.phonePublic,
    is_listed: t.isListed,
    accepts_bookings: t.acceptsBookings,
  })
}

export async function PATCH(req: NextRequest) {
  const { error, userId } = await requireAuth()
  if (error) return error
  const body = await req.json()
  const user = await prisma.practitioner.update({
    where: { id: userId! },
    data: {
      name: body.name,
      phone: body.phone ?? undefined,
      currency: body.currency ?? undefined,
      defaultFee: body.default_fee !== undefined ? Number(body.default_fee) : undefined,
    },
  })
  const t = await prisma.tenant.update({
    where: { id: user.tenantId },
    data: {
      clinicName: body.clinic_name,
      specialty: body.specialty,
      city: body.city,
      province: body.province,
      publicAddress: body.public_address,
      description: body.description,
      phonePublic: body.phone_public,
      isListed: body.is_listed,
      acceptsBookings: body.accepts_bookings,
    },
  })
  return NextResponse.json({ success: true, name: user.name, is_listed: t.isListed })
}
