import DashboardClient from '@/components/dashboard/DashboardClient'
import { getDashboardStats, getWeekAppointments, getPendingRequests, getFollowUpPatients, getLowStockItems } from '@/lib/supabase/queries'

export default async function DashboardPage() {
  const [stats, weekAppts, pendingRequests, followUpPatients, lowStockItems] = await Promise.all([
    getDashboardStats().catch(() => null),
    getWeekAppointments().catch(() => []),
    getPendingRequests().catch(() => []),
    getFollowUpPatients(30).catch(() => []),
    getLowStockItems().catch(() => []),
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
