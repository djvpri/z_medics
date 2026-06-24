/**
 * Migrasi schema lama (practitionerId) ke schema baru (tenantId)
 * Jalankan di Railway Console ZMedics setelah deploy
 * 
 * Setiap practitioner lama → buat Tenant baru → pindahkan semua data ke tenant itu
 */
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Migrasi ke schema Tenant...\n')

  // Ambil semua practitioner lama
  const practitioners = await prisma.practitioner.findMany({
    orderBy: { createdAt: 'asc' }
  })

  console.log(`Found ${practitioners.length} practitioners`)

  for (const prac of practitioners) {
    // Skip yang sudah punya tenantId
    if (prac.tenantId) {
      console.log(`⏭️ Skip ${prac.email} (sudah punya tenant)`)
      continue
    }

    // Buat tenant baru untuk practitioner ini
    const tenant = await prisma.tenant.create({
      data: {
        name: prac.clinicName || prac.name + ' Clinic',
        plan: 'starter',
        expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000), // 1 tahun
      }
    })

    // Update practitioner dengan tenantId baru
    await prisma.practitioner.update({
      where: { id: prac.id },
      data: { tenantId: tenant.id, role: 'owner' }
    })

    // Pindahkan semua data ke tenant baru
    const [patients, sessions, stocks, expenses, clinicPhotos, appts, reqs] = await Promise.all([
      prisma.patient.updateMany({ where: { practitionerId: prac.id }, data: { tenantId: tenant.id } }).catch(() => ({ count: 0 })),
      prisma.session.updateMany({ where: { practitionerId: prac.id }, data: { tenantId: tenant.id } }).catch(() => ({ count: 0 })),
      prisma.stockItem.updateMany({ where: { practitionerId: prac.id }, data: { tenantId: tenant.id } }).catch(() => ({ count: 0 })),
      prisma.expense.updateMany({ where: { practitionerId: prac.id }, data: { tenantId: tenant.id } }).catch(() => ({ count: 0 })),
      prisma.clinicPhoto.updateMany({ where: { practitionerId: prac.id }, data: { tenantId: tenant.id } }).catch(() => ({ count: 0 })),
      prisma.appointment.updateMany({ where: { practitionerId: prac.id }, data: { tenantId: tenant.id } }).catch(() => ({ count: 0 })),
      prisma.appointmentRequest.updateMany({ where: { practitionerId: prac.id }, data: { tenantId: tenant.id } }).catch(() => ({ count: 0 })),
    ])

    console.log(`✅ ${prac.email} → Tenant "${tenant.name}" (patients:${patients.count}, sessions:${sessions.count})`)
  }

  console.log('\n✅ Migrasi tenant selesai!')
  await prisma.$disconnect()
}

main().catch(async e => { console.error(e); await prisma.$disconnect(); process.exit(1) })
