# AcuMedis — Panduan Setup Development

## Tech Stack

| Layer | Teknologi | Alasan |
|---|---|---|
| Frontend | Next.js 14 (App Router) | React-based, familiar dengan HTML/JS, full-stack dalam satu project |
| Database | Supabase (PostgreSQL) | Gratis, ada auth bawaan, dashboard visual, realtime |
| Styling | Tailwind CSS | Cepat, tidak perlu nulis CSS manual |
| AI Layer | Vercel AI SDK | Abstraksi multi-AI (GPT, Claude, Gemini) dalam satu interface |
| Hosting | Vercel | Deploy otomatis, gratis untuk mulai, cocok dengan Next.js |

---

## Langkah 1 — Install prasyarat

Pastikan sudah terinstall di komputer:

```bash
# Cek apakah Node.js sudah ada (butuh versi 18+)
node --version

# Jika belum, download dari: https://nodejs.org
```

---

## Langkah 2 — Buat project Next.js

Buka terminal, jalankan perintah ini:

```bash
npx create-next-app@latest acumedis
```

Saat ditanya, pilih opsi berikut:
```
✔ Would you like to use TypeScript? → Yes
✔ Would you like to use ESLint? → Yes
✔ Would you like to use Tailwind CSS? → Yes
✔ Would you like to use `src/` directory? → No
✔ Would you like to use App Router? → Yes
✔ Would you like to customize the default import alias? → No
```

Masuk ke folder project:
```bash
cd acumedis
```

---

## Langkah 3 — Install dependencies

```bash
# Supabase client
npm install @supabase/supabase-js @supabase/ssr

# Vercel AI SDK (multi-AI support)
npm install ai @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google

# UI utilities
npm install clsx date-fns

# Form handling
npm install react-hook-form zod @hookform/resolvers
```

---

## Langkah 4 — Setup Supabase

1. Buka https://supabase.com dan buat akun gratis
2. Klik **New Project**, isi nama: `acumedis`
3. Catat **Project URL** dan **anon public key** dari Settings → API
4. Buat file `.env.local` di root project:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx

# AI APIs (isi bertahap, mulai dari satu dulu)
OPENAI_API_KEY=sk-xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx
GOOGLE_GENERATIVE_AI_API_KEY=AIxxxxx
```

> ⚠️ Jangan pernah commit file `.env.local` ke GitHub!
> Pastikan ada di `.gitignore`

---

## Langkah 5 — Buat tabel database di Supabase

Buka **Supabase Dashboard → SQL Editor**, paste dan jalankan SQL ini:

```sql
-- Tabel klinik/praktisi
CREATE TABLE practitioners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  clinic_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel pasien
CREATE TABLE patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  practitioner_id UUID REFERENCES practitioners(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female')),
  birth_date DATE,
  phone TEXT,
  email TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel sesi akupuntur
CREATE TABLE sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  practitioner_id UUID REFERENCES practitioners(id),
  session_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  chief_complaint TEXT NOT NULL,
  tongue_color TEXT,
  tongue_coating TEXT,
  pulse_quality TEXT,
  pain_scale INTEGER CHECK (pain_scale BETWEEN 1 AND 10),
  tcm_diagnosis TEXT,
  points_used TEXT[],         -- array titik, contoh: ['GB20','LI4','LV3']
  duration_minutes INTEGER,
  notes TEXT,
  ai_recommendation JSONB,    -- simpan saran AI beserta model yang digunakan
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel foto (lidah, tubuh)
CREATE TABLE session_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  photo_type TEXT CHECK (photo_type IN ('tongue', 'body', 'other')),
  storage_path TEXT NOT NULL,
  ai_analysis TEXT,           -- hasil analisis Gemini
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security — data hanya bisa diakses oleh praktisi yang login
ALTER TABLE practitioners ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Practitioner can manage own data" ON patients
  FOR ALL USING (practitioner_id = auth.uid());

CREATE POLICY "Practitioner can manage own sessions" ON sessions
  FOR ALL USING (practitioner_id = auth.uid());
```

---

## Langkah 6 — Struktur folder project

Setelah setup, struktur folder akan terlihat seperti ini:

```
acumedis/
├── app/
│   ├── layout.tsx              # Layout utama (sidebar, topbar)
│   ├── page.tsx                # Redirect ke /dashboard
│   ├── dashboard/
│   │   └── page.tsx            # Halaman dashboard
│   ├── patients/
│   │   ├── page.tsx            # Daftar pasien
│   │   └── [id]/
│   │       └── page.tsx        # Detail pasien
│   ├── sessions/
│   │   ├── new/
│   │   │   └── page.tsx        # Form sesi baru
│   │   └── [id]/
│   │       └── page.tsx        # Detail sesi
│   └── api/
│       └── ai/
│           └── route.ts        # API endpoint untuk semua AI
├── components/
│   ├── ui/                     # Komponen reusable (Button, Card, dll)
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── Topbar.tsx
│   ├── patients/
│   │   ├── PatientList.tsx
│   │   └── PatientCard.tsx
│   ├── sessions/
│   │   ├── SessionForm.tsx
│   │   └── AcupuncturePointPicker.tsx
│   └── ai/
│       ├── AIChat.tsx
│       └── AIRecommendation.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Supabase browser client
│   │   └── server.ts           # Supabase server client
│   ├── ai/
│   │   ├── router.ts           # AI Orchestrator (pilih model per tugas)
│   │   └── prompts.ts          # Semua prompt TCM
│   └── utils.ts
├── types/
│   └── index.ts                # TypeScript types (Patient, Session, dll)
├── .env.local                  # API keys (JANGAN di-commit)
└── .gitignore
```

---

## Langkah 7 — Jalankan project

```bash
npm run dev
```

Buka browser: http://localhost:3000

---

## Langkah berikutnya (urutan yang disarankan)

1. **Autentikasi** — login/register untuk praktisi (Supabase Auth sudah built-in)
2. **CRUD Pasien** — tambah, lihat, edit data pasien
3. **Form Sesi** — input sesi akupuntur dan simpan ke database
4. **AI pertama** — integrasi satu AI dulu (Gemini untuk analisis foto lidah)
5. **AI Orchestrator** — routing ke multi-AI berdasarkan tugas
6. **Deploy** — push ke GitHub → auto-deploy ke Vercel

---

## Tips untuk developer menengah

- Mulai dari satu fitur, selesaikan sampai tuntas sebelum pindah ke fitur lain
- Gunakan Supabase Dashboard untuk cek data langsung — tidak perlu query manual
- Tailwind CSS punya playground di https://play.tailwindcss.com untuk test style
- Jika stuck, tanya saya — paste error message-nya dan saya bantu debug
