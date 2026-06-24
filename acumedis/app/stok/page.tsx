'use client'

import { useState, useEffect } from 'react'
import Topbar from '@/components/layout/Topbar'

const CATEGORIES = ['Herbal', 'Jarum', 'Peralatan', 'Suplemen', 'Lainnya']
const UNITS = ['pcs', 'gram', 'ml', 'botol', 'sachet', 'lembar', 'bungkus', 'kapsul']

const CAT_COLOR: Record<string, { bg: string; color: string }> = {
  'Herbal':    { bg: '#E8F2EC', color: '#2D5A3D' },
  'Jarum':     { bg: '#EDE8F5', color: '#5A3D8B' },
  'Peralatan': { bg: '#E8EDF5', color: '#2D3A5A' },
  'Suplemen':  { bg: '#F5EDD4', color: '#B8860B' },
  'Lainnya':   { bg: '#EDE8DF', color: '#5C5449' },
}

const inp: React.CSSProperties = {
  width: '100%', padding: '8px 11px', border: '1px solid var(--border)', borderRadius: 8,
  fontFamily: 'var(--font-dm-sans)', fontSize: 13.5, color: 'var(--ink)',
  background: 'var(--surface)', outline: 'none',
}
const sel: React.CSSProperties = {
  ...inp, appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%239C9389' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', paddingRight: 30,
}
const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: 'var(--ink2)', marginBottom: 5, display: 'block' }

interface Item {
  id: string; name: string; category: string; unit: string
  quantity: number; min_quantity: number; notes: string | null
}

function stockStatus(qty: number, min: number): { label: string; bg: string; color: string } {
  if (qty === 0)     return { label: 'Habis',        bg: 'var(--red-light)',  color: 'var(--red)'    }
  if (qty <= min)    return { label: 'Hampir Habis', bg: 'var(--gold-light)', color: 'var(--gold)'   }
  return               { label: 'Tersedia',      bg: 'var(--accent-light)', color: 'var(--accent)' }
}

export default function StokPage() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [practitionerId, setPractitionerId] = useState('')
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('Semua')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Item | null>(null)
  const [saving, setSaving] = useState(false)
  const [adjustingId, setAdjustingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', category: 'Herbal', unit: 'pcs', quantity: '', min_quantity: '5', notes: '' })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setPractitionerId(user.id)
      const { data } = await supabase.from('stock_items').select('*').order('category').order('name')
      setItems(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  function openAdd() { setEditItem(null); setForm({ name: '', category: 'Herbal', unit: 'pcs', quantity: '', min_quantity: '5', notes: '' }); setShowForm(true) }
  function openEdit(item: Item) { setEditItem(item); setForm({ name: item.name, category: item.category, unit: item.unit, quantity: String(item.quantity), min_quantity: String(item.min_quantity), notes: item.notes ?? '' }); setShowForm(true) }
  function setF(k: string, v: string) { setForm(p => ({ ...p, [k]: v })) }
  const fo = (e: React.FocusEvent<any>) => (e.target.style.borderColor = 'var(--accent2)')
  const bl = (e: React.FocusEvent<any>) => (e.target.style.borderColor = 'var(--border)')

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    const supabase = createClient()
    const payload = { name: form.name.trim(), category: form.category, unit: form.unit, quantity: Number(form.quantity) || 0, min_quantity: Number(form.min_quantity) || 5, notes: form.notes || null, practitioner_id: practitionerId }

    if (editItem) {
      const { data } = await supabase.from('stock_items').update(payload).eq('id', editItem.id).select().single()
      if (data) setItems(prev => prev.map(i => i.id === editItem.id ? data : i))
    } else {
      const { data } = await supabase.from('stock_items').insert(payload).select().single()
      if (data) setItems(prev => [...prev, data].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)))
    }
    setSaving(false)
    setShowForm(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus item ini?')) return
    await createClient().from('stock_items').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  async function adjustQty(item: Item, delta: number) {
    const newQty = Math.max(0, item.quantity + delta)
    setAdjustingId(item.id)
    await createClient().from('stock_items').update({ quantity: newQty }).eq('id', item.id)
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, quantity: newQty } : i))
    setAdjustingId(null)
  }

  const filtered = items.filter(i =>
    (filterCat === 'Semua' || i.category === filterCat) &&
    i.name.toLowerCase().includes(search.toLowerCase())
  )

  const lowCount = items.filter(i => i.quantity <= i.min_quantity).length
  const outCount = items.filter(i => i.quantity === 0).length

  return (
    <>
      <Topbar
        title="Stok Obat & Herbal"
        actions={
          <button onClick={openAdd}
            style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, border: 'none', background: 'var(--accent)', color: '#F5F0E8', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)' }}>
            + Tambah Item
          </button>
        }
      />

      <div className="p-4 md:p-7 space-y-5">

        {/* Alert banner */}
        {(outCount > 0 || lowCount > 0) && (
          <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: outCount > 0 ? 'var(--red-light)' : 'var(--gold-light)', border: `1px solid ${outCount > 0 ? 'var(--red)' : 'var(--gold)'}` }}>
            <span style={{ fontSize: 20 }}>{outCount > 0 ? '🚨' : '⚠️'}</span>
            <div>
              {outCount > 0 && <p style={{ fontWeight: 600, color: 'var(--red)', fontSize: 13.5 }}>{outCount} item stok habis</p>}
              {lowCount - outCount > 0 && <p style={{ fontWeight: 500, color: 'var(--gold)', fontSize: 13 }}>{lowCount - outCount} item hampir habis</p>}
            </div>
          </div>
        )}

        {/* Form tambah/edit */}
        {showForm && (
          <div className="rounded-[18px] overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--accent)' }}>
            <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border2)' }}>
              <h2 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 16, color: 'var(--ink)' }}>
                {editItem ? 'Edit Item' : 'Tambah Item Baru'}
              </h2>
            </div>
            <form onSubmit={handleSave} className="p-4 md:p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div className="col-span-2 md:col-span-1">
                  <label style={lbl}>Nama Item <span style={{ color: 'var(--red)' }}>*</span></label>
                  <input type="text" value={form.name} onChange={e => setF('name', e.target.value)} required placeholder="Jahe merah, Jarum 0.25mm..." style={inp} onFocus={fo} onBlur={bl} />
                </div>
                <div>
                  <label style={lbl}>Kategori</label>
                  <select value={form.category} onChange={e => setF('category', e.target.value)} style={sel} onFocus={fo} onBlur={bl}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Satuan</label>
                  <select value={form.unit} onChange={e => setF('unit', e.target.value)} style={sel} onFocus={fo} onBlur={bl}>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Stok Saat Ini</label>
                  <input type="number" min={0} value={form.quantity} onChange={e => setF('quantity', e.target.value)} placeholder="0" style={inp} onFocus={fo} onBlur={bl} />
                </div>
                <div>
                  <label style={lbl}>Batas Minimum (alert)</label>
                  <input type="number" min={1} value={form.min_quantity} onChange={e => setF('min_quantity', e.target.value)} placeholder="5" style={inp} onFocus={fo} onBlur={bl} />
                </div>
                <div>
                  <label style={lbl}>Catatan</label>
                  <input type="text" value={form.notes} onChange={e => setF('notes', e.target.value)} placeholder="Opsional" style={inp} onFocus={fo} onBlur={bl} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button type="submit" disabled={saving || !form.name.trim()}
                  style={{ padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)', background: saving || !form.name.trim() ? 'var(--bg2)' : 'var(--accent)', color: saving || !form.name.trim() ? 'var(--ink3)' : '#F5F0E8', transition: 'all 0.15s' }}>
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ padding: '9px 14px', borderRadius: 8, fontSize: 13, border: '1px solid var(--border)', background: 'transparent', color: 'var(--ink2)', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)' }}>
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filter & search */}
        <div className="flex flex-wrap gap-2 items-center">
          <input type="text" placeholder="Cari nama item..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...inp, maxWidth: 220, width: 'auto' }} />
          {['Semua', ...CATEGORIES].map(c => (
            <button key={c} onClick={() => setFilterCat(c)}
              style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)', transition: 'all 0.15s', background: filterCat === c ? 'var(--accent)' : 'var(--surface)', color: filterCat === c ? '#F5F0E8' : 'var(--ink2)', boxShadow: filterCat === c ? 'none' : '0 1px 3px rgba(0,0,0,0.06)' }}>
              {c}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="rounded-[18px] overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          {loading ? (
            <div className="py-12 text-center" style={{ fontSize: 13, color: 'var(--ink3)' }}>Memuat...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center" style={{ fontSize: 13, color: 'var(--ink3)' }}>
              {items.length === 0 ? 'Belum ada item. ' : 'Tidak ada item ditemukan. '}
              {items.length === 0 && <button onClick={openAdd} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-dm-sans)' }}>Tambah sekarang</button>}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                <thead>
                  <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border2)' }}>
                    {['Nama', 'Kategori', 'Stok', 'Min', 'Status', ''].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, color: 'var(--ink3)', fontWeight: 500, letterSpacing: 0.5, textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item, i) => {
                    const status = stockStatus(item.quantity, item.min_quantity)
                    const cat = CAT_COLOR[item.category] ?? CAT_COLOR['Lainnya']
                    return (
                      <tr key={item.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border2)' : 'none' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 500, color: 'var(--ink)', fontSize: 13.5 }}>{item.name}</div>
                          {item.notes && <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 1 }}>{item.notes}</div>}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: cat.bg, color: cat.color }}>{item.category}</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div className="flex items-center gap-2">
                            <button onClick={() => adjustQty(item, -1)} disabled={adjustingId === item.id || item.quantity === 0}
                              style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--ink2)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              −
                            </button>
                            <span style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 18, color: item.quantity === 0 ? 'var(--red)' : item.quantity <= item.min_quantity ? 'var(--gold)' : 'var(--ink)', minWidth: 32, textAlign: 'center' }}>
                              {item.quantity}
                            </span>
                            <button onClick={() => adjustQty(item, 1)} disabled={adjustingId === item.id}
                              style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--ink2)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              +
                            </button>
                            <span style={{ fontSize: 12, color: 'var(--ink3)' }}>{item.unit}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--ink3)', fontSize: 13 }}>{item.min_quantity} {item.unit}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: status.bg, color: status.color, fontWeight: 500 }}>{status.label}</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div className="flex items-center gap-2">
                            <button onClick={() => openEdit(item)}
                              style={{ padding: '4px 10px', borderRadius: 7, fontSize: 12, border: '1px solid var(--border)', background: 'transparent', color: 'var(--ink2)', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)' }}>
                              Edit
                            </button>
                            <button onClick={() => handleDelete(item.id)}
                              style={{ padding: '4px 10px', borderRadius: 7, fontSize: 12, border: '1px solid var(--border)', background: 'transparent', color: 'var(--red)', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)' }}>
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
