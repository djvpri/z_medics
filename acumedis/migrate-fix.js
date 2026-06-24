/**
 * Script fix untuk data yang gagal di migrate.js pertama
 * Jalankan SETELAH migrate.js selesai
 */

const { createClient } = require('@supabase/supabase-js')
const { PrismaClient } = require('@prisma/client')

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
})
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } })

// Map status Supabase → Prisma enum
function mapAppointmentStatus(s) {
  const map = { scheduled: 'pending', completed: 'done', cancelled: 'cancelled', confirmed: 'confirmed' }
  return map[s] || 'pending'
}

async function downloadPublicPhoto(url) {
  if (!url) return null
  if (!url.startsWith('http')) return null
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const buf = Buffer.from(await res.arrayBuffer())
    return buf.toString('base64')
  } catch { return null }
}

async function main() {
  console.log('🔧 Menjalankan fix migrasi...\n')

  // Build map practitioner email → id baru
  const practitioners = await prisma.practitioner.findMany({ select: { id: true, email: true } })
  const emailToId = {}
  for (const p of practitioners) emailToId[p.email] = p.id

  // Build map dari Supabase auth uid → email → prisma id
  const { data: { users } } = await supabase.auth.admin.listUsers()
  const uidToNewId = {}
  for (const u of users) {
    if (emailToId[u.email]) uidToNewId[u.id] = emailToId[u.email]
  }

  // Build map patient supabase id → prisma id
  const { data: sbPatients } = await supabase.from('patients').select('id, practitioner_id, name')
  const patients = await prisma.patient.findMany({ select: { id: true, name: true } })
  // Match by name (sederhana)
  const nameToPatientId = {}
  for (const p of patients) nameToPatientId[p.name.toLowerCase()] = p.id
  const sbPatientMap = {}
  for (const p of sbPatients) {
    const prismaId = nameToPatientId[p.name.toLowerCase()]
    if (prismaId) sbPatientMap[p.id] = prismaId
  }

  // Build map session supabase id → prisma id
  const { data: sbSessions } = await supabase.from('sessions').select('id, patient_id, session_date, chief_complaint')
  const dbSessions = await prisma.session.findMany({ select: { id: true, chiefComplaint: true, sessionDate: true } })
  const sbSessionMap = {}
  for (const s of sbSessions) {
    const match = dbSessions.find(ds =>
      ds.chiefComplaint === s.chief_complaint &&
      new Date(ds.sessionDate).toISOString().slice(0,10) === s.session_date?.slice(0,10)
    )
    if (match) sbSessionMap[s.id] = match.id
  }

  // ── Fix Appointments ──────────────────────────────────────
  console.log('📅 Fix Appointments...')
  const { data: appointments } = await supabase.from('appointments').select('*')
  let apptOk = 0
  for (const a of appointments) {
    try {
      const practitionerId = uidToNewId[a.practitioner_id]
      if (!practitionerId) continue
      const existing = await prisma.appointment.findFirst({
        where: { practitionerId, scheduledAt: new Date(a.scheduled_at) }
      })
      if (existing) continue // sudah ada

      await prisma.appointment.create({
        data: {
          practitionerId,
          patientId: a.patient_id ? sbPatientMap[a.patient_id] || null : null,
          sessionId: a.session_id ? sbSessionMap[a.session_id] || null : null,
          scheduledAt: new Date(a.scheduled_at),
          durationMinutes: a.duration_minutes || 60,
          reason: a.reason,
          status: mapAppointmentStatus(a.status),
          externalName: a.external_name,
          externalPhone: a.external_phone,
          createdAt: new Date(a.created_at),
        }
      })
      apptOk++
      process.stdout.write('.')
    } catch (e) { console.error(`\n  ❌ ${a.id}:`, e.message.slice(0, 80)) }
  }
  console.log(`\n  ✅ ${apptOk} appointments berhasil`)

  // ── Fix Appointment Requests ──────────────────────────────
  console.log('\n📝 Fix Appointment Requests...')
  const { data: requests } = await supabase.from('appointment_requests').select('*')
  let reqOk = 0
  for (const r of requests) {
    try {
      const practitionerId = uidToNewId[r.practitioner_id]
      if (!practitionerId) continue
      const existing = await prisma.appointmentRequest.findFirst({
        where: { practitionerId, reason: r.reason }
      })
      if (existing) continue

      await prisma.appointmentRequest.create({
        data: {
          practitionerId,
          name: r.name || r.patient_name || r.external_name || 'Pasien',
          phone: r.phone || r.external_phone || '-',
          preferredDate: r.preferred_date ? new Date(r.preferred_date) : null,
          reason: r.reason,
          status: r.status === 'confirmed' ? 'confirmed' : r.status === 'cancelled' ? 'cancelled' : 'pending',
          createdAt: new Date(r.created_at),
        }
      })
      reqOk++
    } catch (e) { console.error(`  ❌ Request:`, e.message.slice(0, 80)) }
  }
  console.log(`  ✅ ${reqOk} requests berhasil`)

  // ── Fix Session Photos (URL publik) ───────────────────────
  console.log('\n📸 Fix Session Photos (public URL)...')
  const { data: photos } = await supabase.from('session_photos').select('*')
  let photoOk = 0
  for (const ph of photos) {
    try {
      const sessionId = sbSessionMap[ph.session_id]
      if (!sessionId) continue

      // Cek sudah ada
      const exists = await prisma.sessionPhoto.findFirst({ where: { sessionId } })
      if (exists) continue

      // storage_path bisa berupa URL publik
      const url = ph.storage_path?.startsWith('http')
        ? ph.storage_path
        : `${process.env.SUPABASE_URL}/storage/v1/object/public/tongue-photos/${ph.storage_path}`

      const photoBase64 = await downloadPublicPhoto(url)
      if (!photoBase64) { console.warn(`  ⚠️ Foto tidak bisa didownload: ${url?.slice(0,60)}`); continue }

      await prisma.sessionPhoto.create({
        data: { sessionId, photoType: ph.photo_type || 'tongue', photoBase64, aiAnalysis: ph.ai_analysis, createdAt: new Date(ph.created_at) }
      })
      photoOk++
      process.stdout.write('.')
    } catch (e) { console.error(`\n  ❌ Photo:`, e.message.slice(0, 80)) }
  }
  console.log(`\n  ✅ ${photoOk} photos berhasil`)

  // ── Fix Clinic Photos ─────────────────────────────────────
  console.log('\n🏥 Fix Clinic Photos...')
  const { data: clinicPhotos } = await supabase.from('clinic_photos').select('*')
  if (clinicPhotos?.length) {
    let clinicOk = 0
    for (const cp of clinicPhotos) {
      try {
        const practitionerId = uidToNewId[cp.practitioner_id]
        if (!practitionerId) continue
        const url = cp.storage_path?.startsWith('http') ? cp.storage_path
          : cp.photo_url?.startsWith('http') ? cp.photo_url
          : `${process.env.SUPABASE_URL}/storage/v1/object/public/clinic-photos/${cp.storage_path}`
        const photoBase64 = await downloadPublicPhoto(url)
        if (!photoBase64) continue
        await prisma.clinicPhoto.create({ data: { practitionerId, photoBase64, caption: cp.caption, createdAt: new Date(cp.created_at) } })
        clinicOk++
      } catch (e) { console.error(`  ❌ Clinic photo:`, e.message.slice(0, 80)) }
    }
    console.log(`  ✅ ${clinicOk}/${clinicPhotos.length} clinic photos`)
  }

  console.log('\n✅ Fix selesai!')
  await prisma.$disconnect()
}

main().catch(async e => { console.error('Fatal:', e); await prisma.$disconnect(); process.exit(1) })
