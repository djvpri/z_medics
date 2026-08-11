'use client'

import { useState, useRef, useEffect } from 'react'
import { useT } from '@/contexts/LanguageContext'

interface Msg { role: 'ai' | 'user'; text: string; model?: string }

function getGreeting(lang: 'en' | 'id') {
  const h = new Date().getHours()
  if (lang === 'en') {
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }
  if (h < 11) return 'Selamat pagi'
  if (h < 15) return 'Selamat siang'
  if (h < 18) return 'Selamat sore'
  return 'Selamat malam'
}

export default function AIPanel() {
  const { lang } = useT()
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function generateGreeting() {
      let name = lang === 'id' ? 'Dokter' : 'Doctor'
      try {
        const meRes = await fetch('/api/me')
        const me = meRes.ok ? await meRes.json() : null
        if (me?.name) name = me.name
      } catch {}

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      let appts: any[] = []
      try {
        const qs = `start=${today.toISOString()}&end=${tomorrow.toISOString()}`
        const apptRes = await fetch(`/api/appointments?${qs}`)
        const data = apptRes.ok ? await apptRes.json() : []
        appts = Array.isArray(data) ? data.filter((a: any) => a.status !== 'cancelled') : []
      } catch {}

      let totalPatients = 0
      try {
        const pRes = await fetch('/api/patients')
        const pd = pRes.ok ? await pRes.json() : []
        totalPatients = Array.isArray(pd) ? pd.length : 0
      } catch {}

      const greeting = getGreeting(lang)
      const count = appts.length
      let text = `${greeting}, ${name}. `

      if (count === 0) {
        text += lang === 'id'
          ? `Tidak ada jadwal sesi hari ini. `
          : `No sessions scheduled for today. `
        if (totalPatients > 0) {
          text += lang === 'id'
            ? `Anda memiliki <strong>${totalPatients}</strong> pasien terdaftar.`
            : `You have <strong>${totalPatients}</strong> registered patients.`
        } else {
          text += lang === 'id'
            ? `Mulai tambahkan pasien dan jadwal sesi Anda.`
            : `Start by adding patients and scheduling sessions.`
        }
      } else {
        text += lang === 'id'
          ? `Hari ini ada <strong>${count}</strong> jadwal sesi. `
          : `You have <strong>${count}</strong> sessions scheduled today. `

        const upcoming = appts.find(a => new Date(a.scheduled_at) > new Date() && a.status === 'scheduled')
        if (upcoming) {
          const patientName = (upcoming.patient as any)?.name ?? (lang === 'id' ? 'Pasien' : 'Patient')
          const time = new Date(upcoming.scheduled_at).toLocaleTimeString(lang === 'id' ? 'id-ID' : 'en-US', { hour: '2-digit', minute: '2-digit' })
          text += lang === 'id'
            ? `Sesi berikutnya: <strong>${patientName}</strong> pukul ${time}`
            : `Next session: <strong>${patientName}</strong> at ${time}`
          if (upcoming.reason) text += ` (${upcoming.reason})`
          text += `.`
        }
      }

      setMessages([{ role: 'ai', text }])
    }

    generateGreeting().catch(() => {
      setMessages([{
        role: 'ai',
        text: lang === 'id'
          ? `${getGreeting('id')}! Tanya saya seputar pasien, titik akupuntur, atau sindrom TCM.`
          : `${getGreeting('en')}! Ask me about patients, acupuncture points, or TCM syndromes.`,
      }])
    })
  }, [lang])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send() {
    if (!input.trim() || loading) return
    const q = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: q }])
    setLoading(true)

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: 'tcm-reference', context: { question: q } }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'ai', text: data.result ?? 'Tidak ada jawaban.', model: data.model }])
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: 'Gagal menghubungi AI.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-[18px] overflow-hidden flex flex-col" style={{ background: 'var(--ink)', height: 420 }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <span className="w-2 h-2 rounded-full" style={{ background: '#4A8C60', boxShadow: '0 0 6px #4A8C60', animation: 'pulse-dot 2s infinite' }} />
        <span style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 14, color: '#F5F0E8' }}>AI Assistant</span>
        <span className="ml-auto" style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, background: 'rgba(74,140,96,0.2)', color: '#7DC49A', letterSpacing: 0.5 }}>Gemini</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3.5 flex flex-col gap-2.5">
        {messages.length === 0 && (
          <div className="flex items-center gap-2 py-2" style={{ color: 'rgba(245,240,232,0.35)', fontSize: 13 }}>
            <div className="flex gap-1">
              {[0,1,2].map(i => <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(245,240,232,0.35)', display: 'inline-block', animation: `blink 1.2s ${i*0.2}s infinite` }} />)}
            </div>
            Memuat...
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`max-w-[90%] px-3 py-2 rounded-xl text-[12.5px] leading-snug ${m.role === 'ai' ? 'self-start' : 'self-end'}`}
            style={{
              background: m.role === 'ai' ? 'rgba(255,255,255,0.07)' : 'var(--accent)',
              color: m.role === 'ai' ? 'rgba(245,240,232,0.85)' : '#F5F0E8',
              borderRadius: m.role === 'ai' ? '4px 10px 10px 10px' : '10px 4px 10px 10px',
            }}
          >
            <div style={{ fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 3, opacity: 0.4 }}>
              {m.role === 'ai' ? `AI${m.model ? ` · ${m.model}` : ''}` : (lang === 'id' ? 'Anda' : 'You')}
            </div>
            <span dangerouslySetInnerHTML={{ __html: m.text }} />
          </div>
        ))}

        {loading && (
          <div className="self-start px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '4px 10px 10px 10px' }}>
            <div className="flex gap-1">
              {[0,1,2].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(245,240,232,0.4)', animation: `blink 1.2s ${i*0.2}s infinite` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 px-3.5 py-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder={lang === 'id' ? 'Tanya tentang pasien atau TCM...' : 'Ask about patients or TCM...'}
          className="flex-1 rounded-lg px-3 py-2 text-[12.5px] outline-none"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(245,240,232,0.85)', fontFamily: 'var(--font-dm-sans)' }}
        />
        <button onClick={send} disabled={loading} className="flex items-center justify-center rounded-lg flex-shrink-0"
          style={{ width: 34, height: 34, background: 'var(--accent)', border: 'none', cursor: 'pointer' }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 16 16" stroke="#F5F0E8" strokeWidth={2}>
            <path d="M14 2L2 8l4 2 2 4 6-12z"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
