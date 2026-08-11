import SessionListClient from '@/components/sessions/SessionListClient'
import { getSessions } from '@/lib/supabase/queries'
import { getSessionUser } from '@/lib/api-auth'
import { mockSessions } from '@/lib/mock-data'

export default async function SesiPage() {
  const sess = await getSessionUser()
  const sessions = sess?.tenantId ? await getSessions(sess.tenantId).catch(() => mockSessions) : []
  return <SessionListClient sessions={sessions} />
}
