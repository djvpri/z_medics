export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma/client'
import { resetDemoData, seedDemoData } from '@/lib/demo-seed'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.tenantId) {
    return NextResponse.json({ isDemo: false })
  }
  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { isDemo: true },
  })
  return NextResponse.json({ isDemo: !!tenant?.isDemo })
}

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !session?.user?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { id: true, isDemo: true },
  })
  if (!tenant?.isDemo) {
    return NextResponse.json({ error: 'Bukan akun demo' }, { status: 403 })
  }

  await resetDemoData(tenant.id)
  await seedDemoData(tenant.id, session.user.id)

  return NextResponse.json({ ok: true })
}
