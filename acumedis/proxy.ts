export { default } from 'next-auth/middleware'

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/pasien/:path*',
    '/sesi/:path*',
    '/jadwal/:path*',
    '/laporan/:path*',
    '/stok/:path*',
    '/pengeluaran/:path*',
    '/pengaturan/:path*',
    '/rekam-medis/:path*',
    '/referensi/:path*',
    '/ai/:path*',
    '/klinik/:path*',
    '/kwitansi/:path*',
    '/api/me',
    '/api/patients/:path*',
    '/api/sessions/:path*',
    '/api/session-photos/:path*',
    '/api/clinic-photos/:path*',
  ],
}
