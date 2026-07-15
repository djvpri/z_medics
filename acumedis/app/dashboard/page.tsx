import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import DashboardClient from '@/components/dashboard/DashboardClient'
import { getDashboardStats, getWeekAppointments, getPendingRequests, getFollowUpPatients, getLowStockItems } from '@/lib/queries'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.tenantId) redirect('/login')
  const tenantId = session.user.tenantId

  const [stats, weekAppts, pendingRequests, followUpPatients, lowStockItems] = await Promise.all([
    getDashboardStats(tenantId).catch(() => null),
    getWeekAppointments(tenantId).catch(() => []),
    getPendingRequests(tenantId).catch(() => []),
    getFollowUpPatients(tenantId, 30).catch(() => []),
    getLowStockItems(tenantId).catch(() => []),
  ])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const groupedByDay = weekAppts.reduce((acc: Record<string, any[]>, appt: any) => {
    const d = new Date(appt.scheduled_at)
    d.setHours(0, 0, 0, 0)
    const key = d.toISOString()
    if (!acc[key]) acc[key] = []
    acc[key].push(appt)
    return acc
  }, {})

  const todayAppts = weekAppts.filter((a: any) => {
    const d = new Date(a.scheduled_at)
    d.setHours(0, 0, 0, 0)
    return d.getTime() === today.getTime()
  })

  return (
    <DashboardClient
      stats={stats}
      weekAppts={weekAppts}
      groupedByDay={groupedByDay}
      todayAppts={todayAppts}
      pendingRequests={pendingRequests}
      followUpPatients={followUpPatients}
      lowStockItems={lowStockItems}
    />
  )
}
