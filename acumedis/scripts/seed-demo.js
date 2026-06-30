// Seed data DEMO untuk ZMedics/Acumedis (klinik akupunktur/TCM) — mengisi
// tenant (klinik) milik akun demo dengan pasien, sesi terapi (diagnosa TCM),
// janji temu, stok, dan pengeluaran. SEMUA DATA FIKTIF untuk demo.
//
// Catatan: ZMedics sudah migrasi dari Supabase ke Prisma + PostgreSQL (Railway).
// Seed ini pakai Prisma client (DATABASE_URL dari schema).
//
// IDEMPOTENT / RESET MANUAL: tiap dijalankan, data demo lama tenant ini DIHAPUS
// lalu diisi ulang (tenant & practitioner TIDAK dihapus). Reset:
//   node scripts/seed-demo.js
// Target tenant: practitioner dgn email DEMO_EMAIL (default demo@zomet.my.id) ->
// tenantId; fallback slug DEMO_SLUG; fallback tenant pertama.

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const DEMO_EMAIL = process.env.DEMO_EMAIL || 'demo@zomet.my.id'
const DEMO_SLUG = process.env.DEMO_SLUG || 'demo'

const now = new Date()
const rint = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
function daysAgo(n, hour) {
  const d = new Date(now); d.setDate(d.getDate() - n)
  d.setHours(hour != null ? hour : rint(8, 18), rint(0, 59), 0, 0); return d
}

const FIRST = ['Budi', 'Sari', 'Andi', 'Dewi', 'Rizky', 'Putri', 'Agus', 'Maya', 'Fajar', 'Indah',
  'Hendra', 'Ratna', 'Yoga', 'Lestari', 'Bayu', 'Wulan', 'Dimas', 'Citra', 'Eko', 'Nadia']
const LAST = ['Santoso', 'Wijaya', 'Kurniawan', 'Pratama', 'Nugroho', 'Halim', 'Saputra', 'Anggraini', 'Hidayat']
const COMPLAINTS = ['Nyeri punggung bawah', 'Migrain berulang', 'Insomnia', 'Nyeri lutut', 'Gangguan lambung (maag)',
  'Vertigo', 'Nyeri leher & bahu', 'Stres & cemas', 'Alergi/rinitis', 'Nyeri haid', 'Kelelahan kronis', 'Sciatica']
const TCM_DX = ['Stagnasi Qi Hati', 'Defisiensi Qi Limpa', 'Api Hati naik ke atas', 'Defisiensi Yin Ginjal',
  'Lembap-Panas', 'Stagnasi Darah', 'Defisiensi Qi & Darah', 'Angin-Dingin menyerang']
const POINTS = [['LI4', 'ST36', 'SP6'], ['GB20', 'GB21'], ['BL23', 'BL40'], ['LV3', 'LI4'], ['GB34', 'ST36'],
  ['DU20', 'EX-HN3'], ['PC6', 'HT7'], ['BL18', 'BL20']]
const TONGUE_COLOR = ['red', 'pale-red', 'pale', 'purple', 'dark-red']
const TONGUE_COATING = ['thin-white', 'thick-white', 'thin-yellow', 'thick-yellow', 'none']
const PULSE = ['wiry', 'slippery', 'weak', 'rapid', 'slow', 'deep', 'floating']
const PAY = ['paid', 'paid', 'paid', 'unpaid', 'partial']
const STOCK = [
  ['Jarum Akupunktur 0.25x40mm', 'Jarum', 'box', 12, 5], ['Jarum Akupunktur 0.30x50mm', 'Jarum', 'box', 4, 5],
  ['Moxa Stick', 'Moksibasi', 'pcs', 30, 10], ['Kapas Alkohol', 'Habis Pakai', 'pack', 25, 8],
  ['Cupping Set', 'Alat', 'set', 6, 2], ['Herbal: Dang Gui', 'Herbal', 'gram', 200, 50],
  ['Herbal: Huang Qi', 'Herbal', 'gram', 80, 50], ['Minyak Gosok', 'Habis Pakai', 'botol', 15, 5],
  ['Sarung Tangan', 'Habis Pakai', 'box', 3, 5], ['Plester', 'Habis Pakai', 'pack', 18, 6],
]
const EXPENSES = [['Sewa Klinik', 3500000, 'Operasional'], ['Listrik & Air', 650000, 'Utilitas'],
  ['Beli Jarum Akupunktur', 850000, 'Persediaan'], ['Stok Herbal', 1200000, 'Persediaan'],
  ['Gaji Asisten', 2000000, 'Gaji'], ['Internet', 350000, 'Utilitas'], ['Perlengkapan Habis Pakai', 450000, 'Persediaan']]

async function main() {
  // 1. Tenant (klinik) + practitioner target
  const demoP = await prisma.practitioner.findFirst({ where: { email: DEMO_EMAIL } })
  let tenantId = demoP?.tenantId
  if (!tenantId) tenantId = (await prisma.tenant.findFirst({ where: { slug: DEMO_SLUG } }))?.id
  if (!tenantId) tenantId = (await prisma.tenant.findFirst())?.id
  if (!tenantId) throw new Error('Tidak ada tenant di ZMedics. Daftar klinik dulu.')
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
  let practitionerId = demoP && demoP.tenantId === tenantId ? demoP.id : (await prisma.practitioner.findFirst({ where: { tenantId } }))?.id || null
  console.log(`Target klinik: ${tenant.name} (${tenant.slug || '-'}) | practitioner: ${practitionerId || '(none)'}`)

  // 2. RESET (appointment dulu; session cascade ke photos)
  await prisma.appointment.deleteMany({ where: { tenantId } })
  await prisma.session.deleteMany({ where: { tenantId } })
  await prisma.patient.deleteMany({ where: { tenantId } })
  await prisma.stockItem.deleteMany({ where: { tenantId } })
  await prisma.expense.deleteMany({ where: { tenantId } })
  await prisma.appointmentRequest.deleteMany({ where: { tenantId } })
  console.log('Data demo lama dibersihkan.')

  // 3. Pasien
  const patients = []
  for (let i = 0; i < 18; i++) {
    patients.push(await prisma.patient.create({
      data: {
        tenantId,
        name: `${pick(FIRST)} ${pick(LAST)}`,
        gender: pick(['male', 'female']),
        birthDate: new Date(rint(1960, 2005), rint(0, 11), rint(1, 28)),
        phone: `0812${String(rint(10000000, 99999999))}`,
        address: pick(['Pontianak', 'Singkawang', 'Mempawah', 'Kubu Raya']),
      },
    }))
  }

  // 4. Sesi terapi (1–5 per pasien, ~90 hari)
  let sessionCount = 0, omzet = 0
  for (const p of patients) {
    const n = rint(1, 5)
    for (let s = 0; s < n; s++) {
      const fee = pick([100000, 120000, 150000, 175000, 200000])
      const pay = pick(PAY)
      await prisma.session.create({
        data: {
          tenantId, patientId: p.id, practitionerId,
          sessionDate: daysAgo(rint(0, 90)),
          chiefComplaint: pick(COMPLAINTS),
          tongueColor: pick(TONGUE_COLOR), tongueCoating: pick(TONGUE_COATING), pulseQuality: pick(PULSE),
          painScale: rint(2, 8), tcmDiagnosis: pick(TCM_DX), pointsUsed: pick(POINTS),
          durationMinutes: pick([30, 45, 60]), notes: 'Pasien menunjukkan perbaikan setelah terapi.',
          fee, paymentStatus: pay,
        },
      })
      sessionCount++
      if (pay === 'paid') omzet += fee
    }
  }

  // 5. Janji temu (minggu ini + lampau)
  let apptCount = 0
  for (let i = 0; i < 14; i++) {
    const offset = rint(-20, 6)
    const d = new Date(now); d.setDate(d.getDate() + offset); d.setHours(pick([9, 10, 13, 15, 16]), pick([0, 30]), 0, 0)
    await prisma.appointment.create({
      data: {
        tenantId, practitionerId, patientId: pick(patients).id,
        scheduledAt: d, durationMinutes: pick([30, 45, 60]),
        reason: pick(COMPLAINTS),
        status: offset < 0 ? pick(['done', 'done', 'cancelled']) : pick(['confirmed', 'pending']),
      },
    })
    apptCount++
  }

  // 6. Permintaan janji (pending)
  for (let i = 0; i < 4; i++) {
    await prisma.appointmentRequest.create({
      data: {
        tenantId, name: `${pick(FIRST)} ${pick(LAST)}`, phone: `0857${String(rint(10000000, 99999999))}`,
        reason: pick(COMPLAINTS), preferredDate: daysAgo(rint(-7, -1)), status: 'pending',
      },
    })
  }

  // 7. Stok
  for (const [name, category, unit, quantity, minQuantity] of STOCK) {
    await prisma.stockItem.create({ data: { tenantId, name, category, unit, quantity, minQuantity } })
  }

  // 8. Pengeluaran ~3 bulan
  let expCount = 0
  for (let m = 0; m < 3; m++) {
    for (const [description, amount, category] of EXPENSES) {
      await prisma.expense.create({
        data: { tenantId, description, amount: amount + rint(-50, 50) * 1000, category, date: daysAgo(m * 30 + rint(0, 20)) },
      })
      expCount++
    }
  }

  console.log('✅ Seed demo ZMedics selesai:')
  console.log(`   pasien=${patients.length}, sesi=${sessionCount} (pendapatan terbayar Rp${omzet.toLocaleString('id-ID')})`)
  console.log(`   janji=${apptCount}, stok=${STOCK.length}, pengeluaran=${expCount}`)
}

main()
  .catch((e) => { console.error('❌', e.message); process.exit(1) })
  .finally(() => prisma.$disconnect())
