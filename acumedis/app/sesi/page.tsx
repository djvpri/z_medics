import SessionListClient from '@/components/sessions/SessionListClient'
import { getSessions } from '@/lib/supabase/queries'
import { mockSessions } from '@/lib/mock-data'

export default async function SesiPage() {
  const sessions = await getSessions().catch(() => mockSessions)
  return <SessionListClient sessions={sessions} />
}
