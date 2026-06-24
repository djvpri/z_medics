// Stub — Supabase sudah tidak dipakai, diganti NextAuth + Prisma
export async function createServerSupabaseClient() {
  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
    },
    from: (table: string) => ({
      select: (cols?: string) => ({
        eq: () => ({ data: [], error: null, single: async () => ({ data: null, error: null }) }),
        order: () => ({ data: [], error: null }),
        limit: () => ({ data: [], error: null }),
        gte: () => ({ data: [], error: null }),
        lte: () => ({ data: [], error: null }),
        neq: () => ({ data: [], error: null }),
        in: () => ({ data: [], error: null }),
        not: () => ({ data: [], error: null }),
        single: async () => ({ data: null, error: null }),
        data: [],
        error: null,
        count: 0,
      }),
      insert: () => ({ data: null, error: null }),
      update: () => ({ eq: () => ({ data: null, error: null }) }),
      delete: () => ({ eq: () => ({ data: null, error: null }) }),
    }),
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
        download: async () => ({ data: null, error: null }),
      }),
    },
  }
}
