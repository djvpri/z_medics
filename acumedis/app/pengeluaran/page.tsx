'use client'

import { useState, useEffect } from 'react'
import Topbar from '@/components/layout/Topbar'
import { createClient } from '@/lib/supabase/client'

const CATEGORIES = ['Peralatan', 'Obat/Herbal', 'Sewa', 'Gaji', 'Utilitas', 'Marketing', 'Lainnya']

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  'Peralatan':   { bg: '#E8EDF5', color: '#2D3A5A' },
  'Obat/Herbal': { bg: '#E8F2EC', color: '#2D5A3D' },
  'Sewa':        { bg: '#F5EDD4', color: '#B8860B' },
  'Gaji':        { bg: '#EDE8DF', color: '#5C5449' },
  'Utilitas':    { bg: '#F5E8E8', color: '#8B2020' },
  'Marketing':   { bg: '#EDE8F5', color: '#5A3D8B' },
  'Lainnya':     { bg: '#F0F0F0', color: '#666'    },
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8,
  fontFamily: 'var(--font-dm-sans)', fontSize: 13.5, color: 'var(--ink)',
  background: 'var(--surface)', outline: 'none',
}
const selectStyle: React.CSSProperties = {
  ...inputStyle, appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%239C9389' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 32,
}
const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 500, color: 'var(--ink2)', letterSpacing: 0.3, marginBottom: 6, display: 'block',
}

interface Expense {
  id: string
  expense_date: string
  amount: number
  category: string
  description: string | null
}

function formatRp(val: number) {
  return 'Rp ' + val.toLocaleString('id-ID')
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getMonthKey(d: string) {
  return d.slice(0, 7) // "2025-06"
}

function getMonthLabel(key: string) {
  const [y, m] = key.split('-')
  return new Date(Number(y), Number(m) - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
}

export default function PengeluaranPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [practitionerId, setPractitionerId] = useState('')
  const [form, setForm] = useState({
    expense_date: new Date().toISOString().slice(0, 10),
    amount: '',
    category: 'Peralatan',
    description: '',
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setPractitionerId(user.id)
      const { data } = await supabase
        .from('expenses')
        .select('id, expense_date, amount, category, description')
        .order('expense_date', { ascending: false })
      setExpenses(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  function set(k: string, v: string) { setForm(p => ({ ...p, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.amount || Number(form.amount) <= 0) return
    setSaving(true)
    const supabase = createClient()
    const { data, error } = await supabase.from('expenses').insert({
      practitioner_id: practitionerId,
      expense_date: form.expense_date,
      amount: Number(form.amount),
      category: form.category,
      description: form.description || null,
    }).select('id, expense_date, amount, category, description').single()
    setSaving(false)
    if (error) { alert('Gagal menyimpan: ' + error.message); return }
    if (data) setExpenses(prev => [data, ...prev])
    setForm({ expense_date: new Date().toISOString().slice(0, 10), amount: '', category: 'Peralatan', description: '' })
    setShowForm(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus pengeluaran ini?')) return
    setDeleting(id)
    await createClient().from('expenses').delete().eq('id', id)
    setExpenses(prev => prev.filter(e => e.id !== id))
    setDeleting(null)
  }

  // Stats
  const now = new Date()
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthTotal = expenses.filter(e => e.expense_date.startsWith(thisMonthKey)).reduce((s, e) => s + e.amount, 0)
  const allTotal = expenses.reduce((s, e) => s + e.amount, 0)

  // Top category this month
  const catMap: Record<string, number> = {}
  expenses.filter(e => e.expense_date.startsWith(thisMonthKey)).forEach(e => {
    catMap[e.category] = (catMap[e.category] ?? 0) + e.amount
  })
  const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0]

  // Group by month
  const grouped: Record<string, Expense[]> = {}
  expenses.forEach(e => {
    const key = getMonthKey(e.expense_date)
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(e)
  })

  const fo = (e: React.FocusEvent<any>) => (e.target.style.borderColor = 'var(--accent2)')
  const bl = (e: React.FocusEvent<any>) => (e.target.style.borderColor = 'var(--border)')

  return (
    <>
      <Topbar
        title="Pengeluaran"
        actions={
          <button
            onClick={() => setShowForm(v => !v)}
            style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, background: showForm ? 'var(--surface2)' : 'var(--accent)', color: showForm ? 'var(--ink2)' : '#F5F0E8', border: showForm ? '1px solid var(--border)' : 'none', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)' }}>
            {showForm ? 'Tutup' : '+ Tambah Pengeluaran'}
          </button>
        }
      />

      <div className="p-4 md:p-7 space-y-5">

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          <div className="rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Bulan Ini</div>
            <div style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 26, color: 'var(--red)', lineHeight: 1 }}>{loading ? '...' : formatRp(monthTotal)}</div>
            <div style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 4 }}>{now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</div>
          </div>
          <div className="rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Total Semua</div>
            <div style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 26, color: 'var(--ink)', lineHeight: 1 }}>{loading ? '...' : formatRp(allTotal)}</div>
            <div style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 4 }}>Semua waktu</div>
          </div>
          <div className="col-span-2 md:col-span-1 rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Kategori Terbesar</div>
            {topCat ? (
              <>
                <div style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 20, color: 'var(--ink)', lineHeight: 1.2 }}>{topCat[0]}</div>
                <div style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 4 }}>{formatRp(topCat[1])} bulan ini</div>
              </>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--ink3)' }}>—</div>
            )}
          </div>
        </div>

        {/* Form tambah */}
        {showForm && (
          <div className="rounded-[18px] overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border2)' }}>
              <h2 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 16, color: 'var(--ink)' }}>Tambah Pengeluaran</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-4 md:p-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label style={labelStyle}>Tanggal</label>
                  <input type="date" value={form.expense_date} onChange={e => set('expense_date', e.target.value)} style={inputStyle} onFocus={fo} onBlur={bl} />
                </div>
                <div>
                  <label style={labelStyle}>Nominal (Rp) <span style={{ color: 'var(--red)' }}>*</span></label>
                  <input type="number" min={0} step={1000} value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="150000" required style={inputStyle} onFocus={fo} onBlur={bl} />
                </div>
                <div>
                  <label style={labelStyle}>Kategori</label>
                  <select value={form.category} onChange={e => set('category', e.target.value)} style={selectStyle} onFocus={fo} onBlur={bl}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Keterangan</label>
                  <input type="text" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Opsional" style={inputStyle} onFocus={fo} onBlur={bl} />
                </div>
              </div>
              <button type="submit" disabled={saving || !form.amount}
                style={{ padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)', background: saving || !form.amount ? 'var(--bg2)' : 'var(--accent)', color: saving || !form.amount ? 'var(--ink3)' : '#F5F0E8', transition: 'all 0.15s' }}>
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </form>
          </div>
        )}

        {/* Daftar pengeluaran */}
        <div className="rounded-[18px] overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border2)' }}>
            <h2 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 16, color: 'var(--ink)' }}>Riwayat Pengeluaran</h2>
          </div>

          {loading ? (
            <div className="py-12 text-center" style={{ fontSize: 13, color: 'var(--ink3)' }}>Memuat...</div>
          ) : expenses.length === 0 ? (
            <div className="py-12 text-center" style={{ fontSize: 13, color: 'var(--ink3)' }}>
              Belum ada pengeluaran.{' '}
              <button onClick={() => setShowForm(true)} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-dm-sans)' }}>
                Tambah sekarang
              </button>
            </div>
          ) : (
            Object.entries(grouped).map(([monthKey, items]) => (
              <div key={monthKey}>
                {/* Month header */}
                <div className="px-5 py-2 flex items-center justify-between" style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border2)' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: 1 }}>{getMonthLabel(monthKey)}</span>
                  <span style={{ fontSize: 12, color: 'var(--ink2)', fontWeight: 500 }}>{formatRp(items.reduce((s, e) => s + e.amount, 0))}</span>
                </div>
                {items.map((expense, i) => {
                  const catColor = CATEGORY_COLORS[expense.category] ?? CATEGORY_COLORS['Lainnya']
                  return (
                    <div key={expense.id} className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: i < items.length - 1 ? '1px solid var(--border2)' : 'none' }}>
                      <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: catColor.bg, color: catColor.color, whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {expense.category}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--ink)' }}>
                          {formatRp(expense.amount)}
                        </div>
                        {expense.description && (
                          <div style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 1 }}>{expense.description}</div>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--ink3)', flexShrink: 0 }}>{formatDate(expense.expense_date)}</div>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        disabled={deleting === expense.id}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--ink3)', opacity: deleting === expense.id ? 0.4 : 0.5, flexShrink: 0 }}
                        title="Hapus"
                      >
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
