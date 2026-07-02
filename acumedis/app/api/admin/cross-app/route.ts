import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import bcrypt from 'bcryptjs'

// Migration 2026-07-02: Dual secret support during transition
const NEW_SECRET = process.env.CROSS_APP_SECRET || 'uurclTHL375CiZeWi2g4T3GczU2YNY9I1wzjlsVTgSk'
const OLD_SECRET = 'z-ecosystem-admin-2026'
const VALID_SECRETS = [NEW_SECRET, OLD_SECRET]

function auth(req: NextRequest) {
  const header = req.headers.get('authorization') || ''
  const token = header.replace('Bearer ', '')
  return VALID_SECRETS.includes(token)
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenants = await prisma.tenant.findMany({
    select: { id: true, name: true, plan: true, isActive: true, expiresAt: true },
    orderBy: { createdAt: 'desc' },
  })

  const practitioners = await prisma.practitioner.findMany({
    select: { id: true, name: true, email: true, role: true, tenantId: true, isActive: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({
    tenants: tenants.map(t => ({
      id: t.id, name: t.name, plan: t.plan, active: t.isActive,
      expires_at: t.expiresAt?.toISOString() ?? null,
    })),
    users: practitioners.map(p => ({
      id: p.id, name: p.name, email: p.email,
      role: p.role, tenantId: p.tenantId, active: p.isActive,
    })),
  })
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { action, data, email } = await req.json()

  if (action === 'createTenant') {
    if (!data?.name) return NextResponse.json({ error: 'Nama klinik wajib diisi' }, { status: 400 })
    const tenant = await prisma.tenant.create({
      data: {
        name: data.name,
        plan: data.plan || 'starter',
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : new Date(Date.now() + 30 * 24 * 3600 * 1000),
      }
    })
    return NextResponse.json({ success: true, id: tenant.id })
  }

  if (action === 'updateTenant') {
    const tenantId = data?.id
    if (!tenantId) return NextResponse.json({ error: 'ID tenant wajib' }, { status: 400 })
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        name: data.name,
        plan: data.plan,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      }
    })
    return NextResponse.json({ success: true })
  }

  if (action === 'delete') {
    // Soft delete tenant atau user
    const userEmail = email || data?.email
    if (userEmail) {
      await prisma.practitioner.updateMany({ where: { email: userEmail }, data: { isActive: false } })
    } else if (data?.tenantId || data?.id) {
      await prisma.tenant.update({ where: { id: data.tenantId || data.id }, data: { isActive: false } })
    }
    return NextResponse.json({ success: true })
  }

  if (action === 'reactivate') {
    const userEmail = email || data?.email
    if (userEmail) {
      await prisma.practitioner.updateMany({ where: { email: userEmail }, data: { isActive: true } })
    } else if (data?.tenantId || data?.id) {
      await prisma.tenant.update({ where: { id: data.tenantId || data.id }, data: { isActive: true } })
    }
    return NextResponse.json({ success: true })
  }

  if (action === 'create') {
    const userEmail = data?.email
    if (!userEmail) return NextResponse.json({ error: 'Email wajib diisi' }, { status: 400 })
    const exists = await prisma.practitioner.findUnique({ where: { email: userEmail } })
    if (exists) return NextResponse.json({ error: 'Email sudah digunakan' }, { status: 409 })

    // Tentukan tenant
    let tenantId = data?.tenantId
    if (!tenantId) {
      // Buat tenant baru otomatis kalau tidak ada
      const tenant = await prisma.tenant.create({
        data: { name: data.name + ' Clinic', plan: 'starter' }
      })
      tenantId = tenant.id
    }

    const passwordHash = await bcrypt.hash(data.password || 'changeme123', 10)
    const user = await prisma.practitioner.create({
      data: { name: data.name, email: userEmail, password: passwordHash, tenantId, role: 'owner' }
    })
    return NextResponse.json({ success: true, id: user.id })
  }

  if (action === 'updateRole') {
    const userEmail = email || data?.email
    const role = data?.role
    if (!userEmail || !role) return NextResponse.json({ error: 'email dan role wajib' }, { status: 400 })
    const validRoles = ['owner', 'practitioner', 'admin']
    if (!validRoles.includes(role)) return NextResponse.json({ error: `Role tidak valid: ${validRoles.join(', ')}` }, { status: 400 })
    await prisma.practitioner.updateMany({ where: { email: userEmail }, data: { role: role as any } })
    return NextResponse.json({ success: true })
  }

  if (action === 'moveTenant') {
    const userEmail = email || data?.email
    const newTenantId = data?.tenantId
    if (!userEmail || !newTenantId) return NextResponse.json({ error: 'email dan tenantId wajib' }, { status: 400 })
    await prisma.practitioner.updateMany({ where: { email: userEmail }, data: { tenantId: newTenantId } })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Action tidak dikenal' }, { status: 400 })
}
