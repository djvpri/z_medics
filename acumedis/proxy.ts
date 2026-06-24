import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export const proxy = withAuth(
  function proxy(req) {
    return NextResponse.next()
  },
  {
    pages: {
      signIn: '/login',
    },
  }
)

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
