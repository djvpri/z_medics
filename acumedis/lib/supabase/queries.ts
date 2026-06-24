// Re-export semua dari lib/queries.ts (Prisma) — pengganti permanen Supabase
// File ini dipertahankan agar import lama tidak perlu diubah satu per satu
export {
  getPatients,
  getPatient,
  getPatientSessions,
  getSessions,
  getSession,
  getPendingRequests,
  getLastTonguePhoto,
  getPatientLastTonguePhoto,
  getLowStockItems,
  getFollowUpPatients,
  getWeekAppointments,
  getDashboardStats,
} from '@/lib/queries'
