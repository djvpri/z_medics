import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import bcrypt from 'bcryptjs'

const ADMIN_SECRET = process.env.CROSS_APP_SECRET || 'z-ecosystem-admin-2026'

function auth(req: NextRequest) {
  return req.headers.get('authorization') === `Bearer ${ADMIN_SECRET}`
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const practitioners = await prisma.practitioner.findMany({
    select: { id: true, name: true, email: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

  // ZMedics tidak punya tenant — tiap practitioner adalah 1 akun mandiri
  return NextResponse.json({
    users: practitioners.map(p => ({
      id: p.id, name: p.name, email: p.email, active: true,
      role: 'owner', tenantId: null,
    })),
    tenants: [],
  })
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { action, data, email } = await req.json()

  if (action === 'create') {
    const exists = await prisma.practitioner.findUnique({ where: { email: data.email } })
    if (exists) return NextResponse.json({ error: 'Email sudah digunakan' }, { status: 409 })
    const passwordHash = await bcrypt.hash(data.password || 'changeme123', 10)
    const user = await prisma.practitioner.create({
      data: { name: data.name, email: data.email, password: passwordHash },
    })
    return NextResponse.json({ success: true, id: user.id })
  }

  if (action === 'delete') {
    await prisma.practitioner.deleteMany({ where: { email: email || data?.email } })
    return NextResponse.json({ success: true })
  }

  if (action === 'reactivate') {
    return NextResponse.json({ success: true }) // tidak ada field nonaktif di ZMedics
  }

  return NextResponse.json({ error: 'Action tidak dikenal' }, { status: 400 })
}
