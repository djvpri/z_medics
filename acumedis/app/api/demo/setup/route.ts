export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { getOrCreateDemoTenant, getOrCreateDemoPractitioner, resetDemoData, seedDemoData, DEMO_PASSWORD } from '@/lib/demo-seed'

const DEMO_SECRET = process.env.DEMO_RESET_SECRET || 'secret-zmedics-2026'

export async function POST(req: Request) {
  const auth = req.headers.get('authorization') ?? ''
  if (auth !== `Bearer ${DEMO_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tenant = await getOrCreateDemoTenant()
  const practitioner = await getOrCreateDemoPractitioner(tenant.id)

  await resetDemoData(tenant.id)
  await seedDemoData(tenant.id, practitioner.id)

  return NextResponse.json({
    ok: true,
    tenantId: tenant.id,
    ownerEmail: practitioner.email,
    ownerPassword: DEMO_PASSWORD,
    loginUrl: '/login',
  })
}
