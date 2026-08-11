import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { NextResponse } from 'next/server'

export async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), userId: null, tenantId: null }
  }
  return { error: null, userId: session.user.id, tenantId: session.user.tenantId || null }
}

export async function getSessionUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null
  return { userId: session.user.id, tenantId: session.user.tenantId || null }
}
