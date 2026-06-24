import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from './prisma/client'

const CROSS_APP_SECRET = process.env.CROSS_APP_SECRET || 'z-ecosystem-admin-2026'

declare module 'next-auth' {
  interface User { id: string; name?: string | null; email?: string | null; tenantId?: string; role?: string }
  interface Session { user: { id: string; name?: string | null; email?: string | null; tenantId?: string; role?: string } }
}
declare module 'next-auth/jwt' {
  interface JWT { id: string; tenantId?: string; role?: string }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',     type: 'email' },
        password: { label: 'Password',  type: 'password' },
        ssoToken: { label: 'SSO Token', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials) return null

        // SSO dari Z One
        if ((credentials as any).ssoToken) {
          try {
            const payload = jwt.verify((credentials as any).ssoToken, CROSS_APP_SECRET) as any
            if (payload.app !== 'zmedics') return null
            const email = String(payload.email || '')
            const user = await prisma.practitioner.findUnique({
              where: { email },
              include: { tenant: true }
            })
            if (!user || !user.isActive) return null
            return { id: user.id, name: user.name, email: user.email, tenantId: user.tenantId, role: user.role }
          } catch { return null }
        }

        if (!credentials.email || !credentials.password) return null

        const user = await prisma.practitioner.findUnique({
          where: { email: credentials.email },
          include: { tenant: true }
        })
        if (!user || !user.isActive) return null

        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid) return null

        return { id: user.id, name: user.name, email: user.email, tenantId: user.tenantId, role: user.role }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.tenantId = (user as any).tenantId
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id
        session.user.tenantId = token.tenantId
        session.user.role = token.role
      }
      return session
    },
  },
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
}
