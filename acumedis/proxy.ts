import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

const PROTECTED = [
  '/dashboard', '/pasien', '/sesi', '/jadwal', '/laporan',
  '/stok', '/pengeluaran', '/pengaturan', '/rekam-medis',
  '/referensi', '/ai', '/klinik', '/kwitansi',
]

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname
  const isProtected = PROTECTED.some(p => path.startsWith(p))
  if (!isProtected) return NextResponse.next()

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) {
    const loginUrl = new URL('/login', req.url)
    return NextResponse.redirect(loginUrl)
  }
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*', '/pasien/:path*', '/sesi/:path*',
    '/jadwal/:path*', '/laporan/:path*', '/stok/:path*',
    '/pengeluaran/:path*', '/pengaturan/:path*', '/rekam-medis/:path*',
    '/referensi/:path*', '/ai/:path*', '/klinik/:path*', '/kwitansi/:path*',
  ],
}
