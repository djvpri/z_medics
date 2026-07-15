export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { resetDemoData, seedDemoData } from '@/lib/demo-seed'

const DEMO_SECRET = process.env.DEMO_RESET_SECRET || 'secret-zmedics-2026'

export async function POST(req: Request) {
  const auth = req.headers.get('authorization') ?? ''
  if (auth !== `Bearer ${DEMO_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const demoTenants = await prisma.tenant.findMany({
    where: { isDemo: true },
    include: { practitioners: { where: { role: 'owner' }, take: 1 } },
  })

  const direset: string[] = []
  for (const tenant of demoTenants) {
    const owner = tenant.practitioners[0]
    if (!owner) continue
    await resetDemoData(tenant.id)
    await seedDemoData(tenant.id, owner.id)
    direset.push(tenant.name)
  }

  return NextResponse.json({ ok: true, direset, total: demoTenants.length })
}
