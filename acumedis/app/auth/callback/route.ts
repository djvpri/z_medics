import { NextResponse } from 'next/server'

// Tidak perlu lagi — auth sekarang via NextAuth
export async function GET() {
  return NextResponse.redirect(new URL('/dashboard', process.env.NEXTAUTH_URL || 'http://localhost:3000'))
}
