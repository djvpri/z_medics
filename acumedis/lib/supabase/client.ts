// Stub — Supabase sudah tidak dipakai, diganti NextAuth + Prisma
// File ini dipertahankan agar import lama tidak error saat build

export function createClient() {
  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: (table: string) => ({
      select: () => ({ data: [], error: null, count: 0 }),
      insert: () => ({ data: null, error: { message: 'Supabase tidak lagi dipakai' } }),
      update: () => ({ data: null, error: { message: 'Supabase tidak lagi dipakai' } }),
      delete: () => ({ data: null, error: null }),
      eq: () => ({ data: [], error: null, single: async () => ({ data: null, error: null }) }),
      single: async () => ({ data: null, error: null }),
    }),
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: { message: 'Gunakan API route untuk upload' } }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
        download: async () => ({ data: null, error: null }),
      }),
    },
  }
}
