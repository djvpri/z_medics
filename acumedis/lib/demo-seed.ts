import { prisma } from './prisma/client'
import bcrypt from 'bcryptjs'
import { addDays, subDays, subHours } from 'date-fns'

export const DEMO_SLUG = 'demo-acumedis'
export const DEMO_EMAIL = 'demo@zomet.my.id'
export const DEMO_PASSWORD = 'demo1234'

export async function getOrCreateDemoTenant() {
  let tenant = await prisma.tenant.findFirst({ where: { slug: DEMO_SLUG } })
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: 'Klinik Demo Acumedis',
        slug: DEMO_SLUG,
        address: 'Jl. Kesehatan No. 1, Jakarta',
        phone: '021-12345678',
        isDemo: true,
        isActive: true,
        plan: 'pro',
      },
    })
  } else if (!tenant.isDemo) {
    tenant = await prisma.tenant.update({ where: { id: tenant.id }, data: { isDemo: true } })
  }
  return tenant
}

export async function getOrCreateDemoPractitioner(tenantId: string) {
  let prac = await prisma.practitioner.findUnique({ where: { email: DEMO_EMAIL } })
  if (!prac) {
    const hashed = await bcrypt.hash(DEMO_PASSWORD, 10)
    prac = await prisma.practitioner.create({
      data: {
        tenantId,
        name: 'Dr. Demo Akupunktur',
        email: DEMO_EMAIL,
        password: hashed,
        role: 'owner',
        isActive: true,
        currency: 'IDR',
      },
    })
  }
  return prac
}

export async function resetDemoData(tenantId: string) {
  await prisma.sessionPhoto.deleteMany({
    where: { session: { tenantId } },
  })
  await prisma.appointment.deleteMany({ where: { tenantId } })
  await prisma.appointmentRequest.deleteMany({ where: { tenantId } })
  await prisma.session.deleteMany({ where: { tenantId } })
  await prisma.patient.deleteMany({ where: { tenantId } })
  await prisma.stockItem.deleteMany({ where: { tenantId } })
  await prisma.expense.deleteMany({ where: { tenantId } })
  await prisma.clinicPhoto.deleteMany({ where: { tenantId } })
}

export async function seedDemoData(tenantId: string, practitionerId: string) {
  const now = new Date()

  const patients = await prisma.patient.createManyAndReturn({
    data: [
      { tenantId, name: 'Budi Santoso', gender: 'male',   birthDate: new Date('1975-03-15'), phone: '08111234567', email: 'budi@email.com',   address: 'Jl. Mawar No. 5, Jakarta Selatan' },
      { tenantId, name: 'Siti Rahayu',  gender: 'female', birthDate: new Date('1982-07-20'), phone: '08222345678', email: 'siti@email.com',   address: 'Jl. Melati No. 12, Depok' },
      { tenantId, name: 'Ahmad Fauzi',  gender: 'male',   birthDate: new Date('1968-11-08'), phone: '08333456789',                            address: 'Jl. Anggrek No. 3, Tangerang' },
      { tenantId, name: 'Dewi Kurnia',  gender: 'female', birthDate: new Date('1990-02-14'), phone: '08444567890', email: 'dewi@email.com',   address: 'Jl. Kamboja No. 7, Bekasi' },
      { tenantId, name: 'Hendra Wijaya',gender: 'male',   birthDate: new Date('1955-09-30'), phone: '08555678901',                            address: 'Jl. Flamboyan No. 9, Bogor' },
      { tenantId, name: 'Rina Lestari', gender: 'female', birthDate: new Date('1995-05-25'), phone: '08666789012', email: 'rina@email.com',   address: 'Jl. Dahlia No. 2, Jakarta Barat' },
      { tenantId, name: 'Wahyu Pratama',gender: 'male',   birthDate: new Date('1978-12-03'), phone: '08777890123',                            address: 'Jl. Kenanga No. 15, Tangerang Selatan' },
      { tenantId, name: 'Maya Indira',  gender: 'female', birthDate: new Date('1988-06-18'), phone: '08888901234', email: 'maya@email.com',   address: 'Jl. Lavender No. 4, Jakarta Timur' },
    ],
  })

  const [budi, siti, ahmad, dewi, hendra, rina, wahyu, maya] = patients

  const sessionData = [
    {
      tenantId, practitionerId, patientId: budi.id,
      sessionDate: subDays(now, 45),
      chiefComplaint: 'Nyeri punggung bawah kronis, sudah 3 bulan',
      tongueColor: 'pale-red', tongueCoating: 'thin-white', pulseQuality: 'wiry',
      painScale: 7, tcmDiagnosis: 'Qi Stagnation dan Blood Deficiency di meridian Kidney',
      pointsUsed: ['BL23', 'BL25', 'GV4', 'KI3', 'SP6'],
      durationMinutes: 60,
      notes: 'Pasien mengeluh nyeri punggung bawah yang menjalar ke paha kiri. Kondisi memburuk saat cuaca dingin.',
      fee: 350000, paymentStatus: 'paid' as const,
    },
    {
      tenantId, practitionerId, patientId: budi.id,
      sessionDate: subDays(now, 30),
      chiefComplaint: 'Nyeri punggung bawah, ada perbaikan dari sesi sebelumnya',
      tongueColor: 'pale-red', tongueCoating: 'thin-white', pulseQuality: 'deep',
      painScale: 4, tcmDiagnosis: 'Qi Stagnation membaik, Blood Deficiency masih ada',
      pointsUsed: ['BL23', 'BL25', 'GV4', 'KI3', 'SP6', 'ST36'],
      durationMinutes: 60,
      notes: 'Perbaikan signifikan. Nyeri berkurang 40%. Pasien disarankan untuk terapi 2x sebulan.',
      fee: 350000, paymentStatus: 'paid' as const,
    },
    {
      tenantId, practitionerId, patientId: siti.id,
      sessionDate: subDays(now, 20),
      chiefComplaint: 'Insomnia dan kecemasan berlebih, sulit tidur sejak 2 minggu lalu',
      tongueColor: 'red', tongueCoating: 'thin-yellow', pulseQuality: 'rapid',
      painScale: 3, tcmDiagnosis: 'Heart dan Liver Fire, Yin Deficiency',
      pointsUsed: ['HT7', 'PC6', 'LV3', 'KI6', 'SP6', 'GV20', 'EX-HN1'],
      durationMinutes: 50,
      notes: 'Pasien merasa stres akibat pekerjaan. Lidah merah menandakan panas berlebih.',
      fee: 300000, paymentStatus: 'paid' as const,
    },
    {
      tenantId, practitionerId, patientId: siti.id,
      sessionDate: subDays(now, 7),
      chiefComplaint: 'Insomnia membaik, masih ada kecemasan saat malam',
      tongueColor: 'pale-red', tongueCoating: 'thin-yellow', pulseQuality: 'wiry',
      painScale: 2, tcmDiagnosis: 'Heart Fire berkurang, Liver Qi Stagnation masih ada',
      pointsUsed: ['HT7', 'PC6', 'LV3', 'LV14', 'GB34', 'SP6'],
      durationMinutes: 50,
      notes: 'Kualitas tidur membaik 60%. Ditambahkan titik GB34 untuk merelaksasi otot.',
      fee: 300000, paymentStatus: 'paid' as const,
    },
    {
      tenantId, practitionerId, patientId: ahmad.id,
      sessionDate: subDays(now, 60),
      chiefComplaint: 'Vertigo dan pusing kepala berputar, sudah 1 bulan',
      tongueColor: 'pale', tongueCoating: 'thick-white', pulseQuality: 'slippery',
      painScale: 6, tcmDiagnosis: 'Phlegm-Dampness menyumbat ke atas, Spleen Qi Deficiency',
      pointsUsed: ['ST40', 'SP9', 'PC6', 'GV20', 'GB20', 'BL20'],
      durationMinutes: 55,
      notes: 'Pasien memiliki riwayat hipertensi. Lidah pucat dengan selaput tebal menunjukkan Phlegm-Dampness.',
      fee: 350000, paymentStatus: 'paid' as const,
    },
    {
      tenantId, practitionerId, patientId: dewi.id,
      sessionDate: subDays(now, 14),
      chiefComplaint: 'Nyeri haid (dismenore), kram perut bagian bawah setiap menstruasi',
      tongueColor: 'purple', tongueCoating: 'thin-white', pulseQuality: 'wiry',
      painScale: 8, tcmDiagnosis: 'Blood Stasis dan Cold in Uterus',
      pointsUsed: ['SP6', 'SP8', 'LV3', 'CV4', 'CV6', 'ST36'],
      durationMinutes: 60,
      notes: 'Nyeri dimulai hari pertama haid, sangat parah di hari ke-1 dan ke-2. Disarankan datang 5 hari sebelum haid berikutnya.',
      fee: 300000, paymentStatus: 'unpaid' as const,
    },
    {
      tenantId, practitionerId, patientId: hendra.id,
      sessionDate: subDays(now, 90),
      chiefComplaint: 'Diabetes tipe 2 dan kelelahan kronis, energi sangat rendah',
      tongueColor: 'pale', tongueCoating: 'thin-white', pulseQuality: 'weak',
      painScale: 2, tcmDiagnosis: 'Kidney dan Spleen Yang Deficiency, Qi dan Blood Deficiency',
      pointsUsed: ['SP6', 'ST36', 'KI3', 'BL20', 'BL23', 'CV12', 'CV4'],
      durationMinutes: 70,
      notes: 'Pasien 70 tahun, diabetes sejak 15 tahun. Fokus pada peningkatan energi dan sirkulasi. Konsultasi dengan dokter reguler tetap diperlukan.',
      fee: 400000, paymentStatus: 'paid' as const,
    },
    {
      tenantId, practitionerId, patientId: rina.id,
      sessionDate: subHours(now, 3),
      chiefComplaint: 'Sakit kepala migrain, 2-3x seminggu, disertai mual',
      tongueColor: 'red', tongueCoating: 'thin-yellow', pulseQuality: 'wiry',
      painScale: 7, tcmDiagnosis: 'Liver Yang Rising, Qi Stagnation',
      pointsUsed: ['GB20', 'GV20', 'LV3', 'LI4', 'PC6', 'GB8'],
      durationMinutes: 55,
      notes: 'Pertama kali datang. Migrain lebih sering saat stres pekerjaan. Rencana 6 sesi.',
      fee: 300000, paymentStatus: 'paid' as const,
    },
  ]

  const createdSessions = []
  for (const sd of sessionData) {
    const s = await prisma.session.create({ data: sd })
    createdSessions.push(s)
  }

  // Appointments minggu ini
  const apptData = [
    {
      tenantId, practitionerId,
      patientId: budi.id,
      scheduledAt: addDays(now, 1),
      durationMinutes: 60,
      reason: 'Kontrol nyeri punggung bawah — sesi ke-3',
      status: 'confirmed' as const,
    },
    {
      tenantId, practitionerId,
      patientId: siti.id,
      scheduledAt: addDays(now, 2),
      durationMinutes: 50,
      reason: 'Lanjutan terapi insomnia — sesi ke-3',
      status: 'confirmed' as const,
    },
    {
      tenantId, practitionerId,
      patientId: dewi.id,
      scheduledAt: addDays(now, 3),
      durationMinutes: 60,
      reason: 'Terapi dismenore sebelum siklus berikutnya',
      status: 'confirmed' as const,
    },
    {
      tenantId, practitionerId,
      patientId: wahyu.id,
      scheduledAt: addDays(now, 4),
      durationMinutes: 60,
      reason: 'Konsultasi awal — nyeri sendi lutut',
      status: 'confirmed' as const,
    },
    {
      tenantId, practitionerId,
      patientId: maya.id,
      scheduledAt: addDays(now, 5),
      durationMinutes: 50,
      reason: 'Konsultasi awal — kelelahan dan anemia',
      status: 'confirmed' as const,
    },
  ]
  await prisma.appointment.createMany({ data: apptData })

  // Appointment requests masuk
  await prisma.appointmentRequest.createMany({
    data: [
      {
        tenantId,
        name: 'Eko Prasetyo',
        phone: '08999012345',
        preferredDate: addDays(now, 5),
        reason: 'Nyeri leher dan bahu akibat kerja di depan komputer',
        status: 'pending',
      },
      {
        tenantId,
        name: 'Fitriani',
        phone: '08100123456',
        preferredDate: addDays(now, 6),
        reason: 'Insomnia dan sakit kepala',
        status: 'pending',
      },
    ],
  })

  // Stock items herbal
  await prisma.stockItem.createMany({
    data: [
      { tenantId, name: 'Jarum Akupunktur 0.25x25mm', category: 'Jarum',   quantity: 500, minQuantity: 100, unit: 'pcs' },
      { tenantId, name: 'Jarum Akupunktur 0.25x40mm', category: 'Jarum',   quantity: 300, minQuantity: 100, unit: 'pcs' },
      { tenantId, name: 'Jarum Akupunktur 0.30x50mm', category: 'Jarum',   quantity: 8,   minQuantity: 50,  unit: 'pcs' },
      { tenantId, name: 'Moxa Roll (Mugwort)',         category: 'Moksibusi', quantity: 24, minQuantity: 10, unit: 'roll' },
      { tenantId, name: 'Kop Vakum Set',              category: 'Cupping',  quantity: 5,  minQuantity: 2,  unit: 'set' },
      { tenantId, name: 'Alkohol 70%',                category: 'Antiseptik',quantity: 0, minQuantity: 5,  unit: 'botol' },
      { tenantId, name: 'Kapas Steril',               category: 'Antiseptik',quantity: 20,minQuantity: 10, unit: 'pak' },
      { tenantId, name: 'Sarung Tangan Nitrile M',    category: 'APD',      quantity: 3,  minQuantity: 5,  unit: 'kotak' },
      { tenantId, name: 'Permen Jahe Herbal',         category: 'Herbal',   quantity: 50, minQuantity: 20, unit: 'pcs' },
      { tenantId, name: 'Minyak Esensial Peppermint', category: 'Herbal',   quantity: 4,  minQuantity: 3,  unit: 'botol' },
    ],
  })

  // Pengeluaran bulan ini
  await prisma.expense.createMany({
    data: [
      { tenantId, description: 'Pembelian jarum akupunktur bulk',  amount: 850000,  category: 'Perlengkapan', date: subDays(now, 25) },
      { tenantId, description: 'Sewa ruang klinik bulan ini',     amount: 5000000, category: 'Operasional',  date: subDays(now, 28) },
      { tenantId, description: 'Listrik dan air',                 amount: 450000,  category: 'Utilitas',     date: subDays(now, 15) },
      { tenantId, description: 'Moxa roll dan perlengkapan moxa', amount: 320000,  category: 'Perlengkapan', date: subDays(now, 10) },
      { tenantId, description: 'Gaji asisten klinik',             amount: 2500000, category: 'SDM',          date: subDays(now, 1)  },
      { tenantId, description: 'Alkohol dan antiseptik',          amount: 180000,  category: 'Perlengkapan', date: subDays(now, 5)  },
    ],
  })
}
