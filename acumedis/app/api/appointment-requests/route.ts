import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma/client'

function map(r: any) {
  return {
    id: r.id,
    patient_name: r.name,
    patient_phone: r.phone,
    patient_email: r.email,
    preferred_date: r.preferredDate ? r.preferredDate.toISOString() : null,
    preferred_time: r.preferredTime,
    reason: r.reason,
    status: r.status,
    notes: r.notes,
    created_at: r.createdAt.toISOString(),
  }
}

export async function GET(req: NextRequest) {
  const { error, tenantId } = await requireAuth()
  if (error) return error
  const url = new URL(req.url)
  const status = url.searchParams.get('status')
  const where: any = { tenantId: tenantId! }
  if (status && status !== 'all') where.status = status
  const rows = await prisma.appointmentRequest.findMany({ where, orderBy: { createdAt: 'desc' } })
  return NextResponse.json(rows.map(map))
}

// Endpoint publik: pasien minta jadwal dari halaman /klinik/[id]
export async function POST(input: NextRequest) {
  const body = await input.json()
  const id = body.clinic_id || body.tenant_id || body.practitioner_id
  if (!id || !body.name || !body.phone) return NextResponse.json({ error: 'Klinik, nama, dan telepon diperlukan' }, { status: 400 })
  const tenant = await prisma.tenant.findFirst({ where: { id, isListed: true, isActive: true, acceptsBookings: true } })
  if (!tenant) return NextResponse.json({ error: 'Klinik tidak ditemukan' }, { status: 404 })
  const created = await prisma.appointmentRequest.create({
    data: {
      tenantId: tenant.id,
      name: body.name,
      phone: body.phone,
      email: body.email || null,
      preferredDate: body.preferred_date ? new Date(`${body.preferred_date}T00:00:00.000Z`) : null,
      preferredTime: body.preferred_time || null,
      reason: body.reason || null,
      status: 'pending',
    },
  })
  return NextResponse.json({ success: true, id: created.id }, { status: 201 })
}
