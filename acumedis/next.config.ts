import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true, // sementara, sambil migrate Supabase ke Prisma
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
