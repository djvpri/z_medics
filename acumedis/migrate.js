/**
 * Script migrasi data ZMedics dari Supabase ke PostgreSQL
 * 
 * Cara pakai:
 * 1. Set env vars:
 *    SUPABASE_URL=https://xxx.supabase.co
 *    SUPABASE_SERVICE_ROLE_KEY=eyJ...  (dari Supabase Dashboard > Settings > API > service_role)
 *    DATABASE_URL=postgresql://...     (koneksi PostgreSQL Railway baru)
 * 
 * 2. Jalankan:
 *    cd acumedis
 *    node --env-file=.env.migration migrate.js
 * 
 * PENTING: Jalankan sekali saja. Kalau dijalankan ulang, data bisa duplikat.
 */

const { createClient } = require('@supabase/supabase-js')
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const DATABASE_URL = process.env.DATABASE_URL

if (!SUPABASE_URL || !SUPABASE_KEY || !DATABASE_URL) {
  console.error('❌ Set env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }
})

const prisma = new PrismaClient({ datasources: { db: { url: DATABASE_URL } } })

// ── Helper: download foto dari Supabase Storage → base64 ──────
async function downloadPhoto(storagePath) {
  if (!storagePath) return null
  try {
    // Coba beberapa bucket yang umum dipakai
    for (const bucket of ['photos', 'session-photos', 'avatars', 'clinic']) {
      const { data, error } = await supabase.storage.from(bucket).download(storagePath)
      if (!error && data) {
        const buffer = Buffer.from(await data.arrayBuffer())
        return buffer.toString('base64')
      }
    }
    console.warn(`  ⚠️ Foto tidak ditemukan di storage: ${storagePath}`)
    return null
  } catch (e) {
    console.warn(`  ⚠️ Gagal download foto: ${storagePath}`, e.message)
    return null
  }
}

// ── Map ID lama ke ID baru ────────────────────────────────────
const practitionerMap = {} // supabase auth uid → prisma practitioner id
const patientMap = {}      // supabase patient id → prisma patient id
const sessionMap = {}      // supabase session id → prisma session id

async function main() {
  console.log('🚀 Mulai migrasi ZMedics dari Supabase ke PostgreSQL...\n')

  // ── 1. Practitioners (dari Supabase auth.users) ────────────
  console.log('👨‍⚕️ Migrasi Practitioners...')
  
  // Ambil semua user dari Supabase Auth
  const { data: { users: authUsers }, error: authErr } = await supabase.auth.admin.listUsers()
  if (authErr) {
    console.error('❌ Gagal ambil users dari Supabase Auth:', authErr.message)
    console.log('   Coba ambil dari tabel practitioners langsung...')
  }

  // Ambil data practitioner tambahan (kalau ada tabel practitioners)
  const { data: practitioners } = await supabase.from('practitioners').select('*')
  const practitionerExtra = {}
  for (const p of (practitioners || [])) {
    practitionerExtra[p.id] = p
  }

  const usersToMigrate = authUsers || []
  console.log(`  Found ${usersToMigrate.length} practitioners`)

  for (const u of usersToMigrate) {
    try {
      const extra = practitionerExtra[u.id] || {}
      
      // Download avatar kalau ada
      let avatarBase64 = null
      if (extra.avatar_url && !extra.avatar_url.startsWith('http')) {
        avatarBase64 = await downloadPhoto(extra.avatar_url)
      }

      const created = await prisma.practitioner.create({
        data: {
          name: extra.name || u.user_metadata?.name || u.email?.split('@')[0] || 'Dokter',
          email: u.email,
          password: await bcrypt.hash('ChangeMe123!', 10), // password temp
          phone: extra.phone || u.user_metadata?.phone || null,
          clinicName: extra.clinic_name || u.user_metadata?.clinic_name || null,
          avatarBase64,
          currency: extra.currency || 'IDR',
          createdAt: new Date(u.created_at),
        }
      })
      
      practitionerMap[u.id] = created.id
      console.log(`  ✅ ${u.email}`)
    } catch (e) {
      if (e.code === 'P2002') {
        // Sudah ada, ambil ID yang existing
        const existing = await prisma.practitioner.findUnique({ where: { email: u.email } })
        if (existing) {
          practitionerMap[u.id] = existing.id
          console.log(`  ⏭️ Skip (sudah ada): ${u.email}`)
        }
      } else {
        console.error(`  ❌ Gagal migrate practitioner ${u.email}:`, e.message)
      }
    }
  }

  // Kalau tidak ada auth users, coba dari tabel practitioners langsung
  if (usersToMigrate.length === 0 && practitioners?.length) {
    console.log('  Migrasi dari tabel practitioners...')
    for (const p of practitioners) {
      try {
        const created = await prisma.practitioner.create({
          data: {
            name: p.name || 'Dokter',
            email: p.email,
            password: await bcrypt.hash('ChangeMe123!', 10),
            phone: p.phone || null,
            clinicName: p.clinic_name || null,
            currency: p.currency || 'IDR',
            createdAt: new Date(p.created_at),
          }
        })
        practitionerMap[p.id] = created.id
        console.log(`  ✅ ${p.email}`)
      } catch (e) {
        console.error(`  ❌ ${p.email}:`, e.message)
      }
    }
  }

  // ── 2. Patients ────────────────────────────────────────────
  console.log('\n🧑‍🤝‍🧑 Migrasi Patients...')
  const { data: patients, error: patErr } = await supabase
    .from('patients').select('*').order('created_at')
  
  if (patErr) { console.error('❌', patErr.message) }
  else {
    console.log(`  Found ${patients.length} patients`)
    for (const p of patients) {
      try {
        const practitionerId = practitionerMap[p.practitioner_id]
        if (!practitionerId) {
          console.warn(`  ⚠️ Skip patient ${p.name}: practitioner_id ${p.practitioner_id} tidak ada`)
          continue
        }

        let avatarBase64 = null
        if (p.avatar_url && !p.avatar_url.startsWith('http')) {
          avatarBase64 = await downloadPhoto(p.avatar_url)
        }

        const created = await prisma.patient.create({
          data: {
            practitionerId,
            name: p.name,
            gender: p.gender,
            birthDate: p.birth_date ? new Date(p.birth_date) : null,
            phone: p.phone,
            email: p.email,
            address: p.address,
            avatarBase64,
            createdAt: new Date(p.created_at),
          }
        })
        patientMap[p.id] = created.id
        process.stdout.write('.')
      } catch (e) {
        console.error(`\n  ❌ Patient ${p.name}:`, e.message)
      }
    }
    console.log(`\n  ✅ ${Object.keys(patientMap).length}/${patients.length} patients berhasil`)
  }

  // ── 3. Sessions ────────────────────────────────────────────
  console.log('\n📋 Migrasi Sessions...')
  const { data: sessions, error: sesErr } = await supabase
    .from('sessions').select('*').order('created_at')
  
  if (sesErr) { console.error('❌', sesErr.message) }
  else {
    console.log(`  Found ${sessions.length} sessions`)
    for (const s of sessions) {
      try {
        const practitionerId = practitionerMap[s.practitioner_id]
        const patientId = patientMap[s.patient_id]
        if (!practitionerId || !patientId) {
          console.warn(`\n  ⚠️ Skip session ${s.id}: missing reference`)
          continue
        }

        const created = await prisma.session.create({
          data: {
            practitionerId,
            patientId,
            sessionDate: new Date(s.session_date || s.created_at),
            chiefComplaint: s.chief_complaint || '-',
            tongueColor: s.tongue_color,
            tongueCoating: s.tongue_coating,
            pulseQuality: s.pulse_quality,
            painScale: s.pain_scale,
            tcmDiagnosis: s.tcm_diagnosis,
            pointsUsed: s.points_used || [],
            durationMinutes: s.duration_minutes,
            notes: s.notes,
            aiRecommendation: s.ai_recommendation,
            fee: s.fee,
            paymentStatus: s.payment_status || 'unpaid',
            createdAt: new Date(s.created_at),
          }
        })
        sessionMap[s.id] = created.id
        process.stdout.write('.')
      } catch (e) {
        console.error(`\n  ❌ Session ${s.id}:`, e.message)
      }
    }
    console.log(`\n  ✅ ${Object.keys(sessionMap).length}/${sessions.length} sessions berhasil`)
  }

  // ── 4. Session Photos ──────────────────────────────────────
  console.log('\n📸 Migrasi Session Photos (download dari Storage)...')
  const { data: photos, error: photoErr } = await supabase
    .from('session_photos').select('*').order('created_at')
  
  if (photoErr) { console.error('❌', photoErr.message) }
  else {
    console.log(`  Found ${photos.length} photos`)
    let photoOk = 0
    for (const ph of photos) {
      try {
        const sessionId = sessionMap[ph.session_id]
        if (!sessionId) continue

        const photoBase64 = await downloadPhoto(ph.storage_path)
        if (!photoBase64) continue

        await prisma.sessionPhoto.create({
          data: {
            sessionId,
            photoType: ph.photo_type || 'tongue',
            photoBase64,
            aiAnalysis: ph.ai_analysis,
            createdAt: new Date(ph.created_at),
          }
        })
        photoOk++
        process.stdout.write('.')
      } catch (e) {
        console.error(`\n  ❌ Photo ${ph.id}:`, e.message)
      }
    }
    console.log(`\n  ✅ ${photoOk}/${photos.length} photos berhasil`)
  }

  // ── 5. Stock Items ─────────────────────────────────────────
  console.log('\n📦 Migrasi Stock Items...')
  const { data: stocks } = await supabase.from('stock_items').select('*')
  if (stocks?.length) {
    let stockOk = 0
    for (const s of stocks) {
      try {
        const practitionerId = practitionerMap[s.practitioner_id]
        if (!practitionerId) continue
        await prisma.stockItem.create({
          data: {
            practitionerId,
            name: s.name,
            category: s.category,
            quantity: s.quantity || 0,
            minQuantity: s.min_quantity || 0,
            unit: s.unit,
            createdAt: new Date(s.created_at),
          }
        })
        stockOk++
      } catch (e) { console.error(`  ❌ Stock ${s.name}:`, e.message) }
    }
    console.log(`  ✅ ${stockOk}/${stocks.length} stock items`)
  }

  // ── 6. Appointments ────────────────────────────────────────
  console.log('\n📅 Migrasi Appointments...')
  const { data: appointments } = await supabase.from('appointments').select('*')
  if (appointments?.length) {
    let apptOk = 0
    for (const a of appointments) {
      try {
        const practitionerId = practitionerMap[a.practitioner_id]
        if (!practitionerId) continue
        await prisma.appointment.create({
          data: {
            practitionerId,
            patientId: a.patient_id ? patientMap[a.patient_id] : null,
            sessionId: a.session_id ? sessionMap[a.session_id] : null,
            scheduledAt: new Date(a.scheduled_at),
            durationMinutes: a.duration_minutes || 60,
            reason: a.reason,
            status: a.status || 'confirmed',
            externalName: a.external_name,
            externalPhone: a.external_phone,
            createdAt: new Date(a.created_at),
          }
        })
        apptOk++
      } catch (e) { console.error(`  ❌ Appointment ${a.id}:`, e.message) }
    }
    console.log(`  ✅ ${apptOk}/${appointments.length} appointments`)
  }

  // ── 7. Appointment Requests ────────────────────────────────
  console.log('\n📝 Migrasi Appointment Requests...')
  const { data: requests } = await supabase.from('appointment_requests').select('*')
  if (requests?.length) {
    let reqOk = 0
    for (const r of requests) {
      try {
        const practitionerId = practitionerMap[r.practitioner_id]
        if (!practitionerId) continue
        await prisma.appointmentRequest.create({
          data: {
            practitionerId,
            name: r.name,
            phone: r.phone,
            preferredDate: r.preferred_date ? new Date(r.preferred_date) : null,
            reason: r.reason,
            status: r.status || 'pending',
            createdAt: new Date(r.created_at),
          }
        })
        reqOk++
      } catch (e) { console.error(`  ❌ Request ${r.id}:`, e.message) }
    }
    console.log(`  ✅ ${reqOk}/${requests.length} requests`)
  }

  // ── 8. Expenses ────────────────────────────────────────────
  console.log('\n💸 Migrasi Expenses...')
  const { data: expenses } = await supabase.from('expenses').select('*')
  if (expenses?.length) {
    let expOk = 0
    for (const e of expenses) {
      try {
        const practitionerId = practitionerMap[e.practitioner_id]
        if (!practitionerId) continue
        await prisma.expense.create({
          data: {
            practitionerId,
            description: e.description || e.name || '-',
            amount: e.amount || 0,
            category: e.category,
            date: e.date ? new Date(e.date) : new Date(e.created_at),
            createdAt: new Date(e.created_at),
          }
        })
        expOk++
      } catch (e2) { console.error(`  ❌ Expense:`, e2.message) }
    }
    console.log(`  ✅ ${expOk}/${expenses.length} expenses`)
  }

  // ── 9. Clinic Photos ───────────────────────────────────────
  console.log('\n🏥 Migrasi Clinic Photos...')
  const { data: clinicPhotos } = await supabase.from('clinic_photos').select('*')
  if (clinicPhotos?.length) {
    let clinicOk = 0
    for (const cp of clinicPhotos) {
      try {
        const practitionerId = practitionerMap[cp.practitioner_id]
        if (!practitionerId) continue
        const photoBase64 = await downloadPhoto(cp.storage_path || cp.photo_url)
        if (!photoBase64) continue
        await prisma.clinicPhoto.create({
          data: {
            practitionerId,
            photoBase64,
            caption: cp.caption,
            createdAt: new Date(cp.created_at),
          }
        })
        clinicOk++
      } catch (e) { console.error(`  ❌ Clinic photo:`, e.message) }
    }
    console.log(`  ✅ ${clinicOk}/${clinicPhotos.length} clinic photos`)
  }

  console.log('\n✅ MIGRASI SELESAI!')
  console.log('\n⚠️  PERHATIAN: Password semua practitioner direset ke "ChangeMe123!"')
  console.log('   Minta setiap dokter login lewat Z One (SSO) — tidak perlu password lagi.')
  console.log('\nRingkasan:')
  console.log(`  Practitioners: ${Object.keys(practitionerMap).length}`)
  console.log(`  Patients:      ${Object.keys(patientMap).length}`)
  console.log(`  Sessions:      ${Object.keys(sessionMap).length}`)

  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error('❌ Fatal error:', e)
  await prisma.$disconnect()
  process.exit(1)
})
