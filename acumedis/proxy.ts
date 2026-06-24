import { withAuth, NextRequestWithAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export async function proxy(req: NextRequestWithAuth) {
  const token = req.nextauth?.token
  if (!token) {
    const loginUrl = new URL('/login', req.url)
    return NextResponse.redirect(loginUrl)
  }
  return NextResponse.next()
}

export default withAuth(proxy, {
  pages: { signIn: '/login' },
})

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
  ],
}
