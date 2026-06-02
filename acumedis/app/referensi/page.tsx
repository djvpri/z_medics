'use client'

import { useState, useRef, useEffect } from 'react'
import Topbar from '@/components/layout/Topbar'
import { useT } from '@/contexts/LanguageContext'

interface Message {
  id: string
  question: string
  answer: string
  model?: string
  loading?: boolean
}

const QUICK_TOPICS = [
  { label: 'LI4 — Hegu', q: 'Jelaskan titik akupuntur LI4 (Hegu): lokasi, fungsi, dan indikasinya.' },
  { label: 'ST36 — Zusanli', q: 'Jelaskan titik ST36 (Zusanli): lokasi, fungsi, dan kapan digunakan.' },
  { label: 'SP6 — Sanyinjiao', q: 'Jelaskan titik SP6 (Sanyinjiao) dan mengapa disebut titik pertemuan tiga meridian Yin.' },
  { label: 'LV3 — Taichong', q: 'Jelaskan titik LV3 (Taichong) dan hubungannya dengan Liver Qi Stagnasi.' },
  { label: 'GB20 — Fengchi', q: 'Jelaskan titik GB20 (Fengchi) untuk nyeri kepala dan leher.' },
  { label: 'GV20 — Baihui', q: 'Jelaskan titik GV20 (Baihui) dan indikasinya dalam TCM.' },
  { label: 'Liver Qi Stagnasi', q: 'Jelaskan sindrom Liver Qi Stagnasi dalam TCM: gejala, penyebab, dan prinsip pengobatannya.' },
  { label: 'Defisiensi Yin Ginjal', q: 'Jelaskan sindrom Defisiensi Yin Ginjal: gejala, tanda lidah & nadi, dan titik yang digunakan.' },
  { label: 'Qi Defisiensi Limpa', q: 'Jelaskan sindrom Qi Defisiensi Limpa dalam TCM beserta manifestasi klinisnya.' },
  { label: 'Meridian Du Mai', q: 'Jelaskan Meridian Du Mai (Governor Vessel): jalur, fungsi, dan titik-titik pentingnya.' },
  { label: 'Insomnia — TCM', q: 'Apa saja sindrom TCM yang menyebabkan insomnia dan bagaimana pendekatan akupunturnya?' },
  { label: 'Nyeri Punggung', q: 'Bagaimana TCM memandang nyeri punggung bawah dan apa titik akupuntur yang digunakan?' },
]

export default function ReferensiPage() {
  const { t, lang } = useT()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function ask(question: string) {
    if (!question.trim() || loading) return

    const id = Date.now().toString()
    setMessages(prev => [...prev, { id, question, answer: '', loading: true }])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: 'tcm-reference', context: { question } }),
      })
      const data = await res.json()
      setMessages(prev =>
        prev.map(m =>
          m.id === id
            ? { ...m, answer: data.result ?? data.error ?? (lang === 'id' ? 'Tidak ada jawaban.' : 'No answer available.'), model: data.model, loading: false }
            : m
        )
      )
    } catch {
      setMessages(prev =>
        prev.map(m =>
          m.id === id
            ? { ...m, answer: 'Gagal menghubungi AI. Pastikan API key sudah dikonfigurasi di .env.local.', loading: false }
            : m
        )
      )
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    ask(input)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      ask(input)
    }
  }

  return (
    <>
      <Topbar
        title={lang === 'id' ? 'Referensi TCM' : 'TCM Reference'}
        subtitle={lang === 'id' ? 'Tanya AI tentang titik akupuntur, meridian, dan sindrom TCM' : 'Ask AI about acupuncture points, meridians, and TCM syndromes'}
      />

      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Quick Topics */}
        <div className="px-6 pt-4 pb-2" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          <p style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 8 }}>{lang === 'id' ? 'Topik cepat:' : 'Quick topics:'}</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_TOPICS.map(topic => (
              <button
                key={topic.label}
                onClick={() => ask(topic.q)}
                disabled={loading}
                style={{ padding: '4px 10px', fontSize: 12, border: '1px solid var(--border)', borderRadius: 20, color: 'var(--ink2)', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)', opacity: loading ? 0.4 : 1 }}
              >
                {topic.label}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)', marginBottom: 4 }}>
                {lang === 'id' ? 'Referensi TCM dengan AI' : 'TCM Reference with AI'}
              </p>
              <p style={{ fontSize: 12, color: 'var(--ink3)', maxWidth: 300 }}>
                {lang === 'id'
                  ? 'Klik topik di atas atau ketik pertanyaan tentang titik akupuntur, meridian, sindrom TCM, atau formula herbal.'
                  : 'Click a topic above or type a question about acupuncture points, meridians, TCM syndromes, or herbal formulas.'}
              </p>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} className="space-y-2">
              {/* Question */}
              <div className="flex justify-end">
                <div className="max-w-xl bg-teal-600 text-white text-sm rounded-2xl rounded-tr-sm px-4 py-2.5">
                  {msg.question}
                </div>
              </div>

              {/* Answer */}
              <div className="flex justify-start">
                <div className="max-w-2xl bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  {msg.loading ? (
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      AI sedang menjawab...
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{msg.answer}</p>
                      {msg.model && (
                        <p className="text-[10px] text-gray-400 mt-2 font-mono">{msg.model}</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4" style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
          <form onSubmit={handleSubmit} className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={lang === 'id' ? 'Tanya tentang titik akupuntur, meridian, sindrom TCM...' : 'Ask about acupuncture points, meridians, TCM syndromes...'}
              rows={2}
              disabled={loading}
              style={{ flex: 1, padding: '8px 12px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg)', color: 'var(--ink)', outline: 'none', resize: 'none', fontFamily: 'var(--font-dm-sans)', opacity: loading ? 0.5 : 1 }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'var(--accent)', color: '#F5F0E8', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', height: 68, opacity: loading || !input.trim() ? 0.5 : 1, fontFamily: 'var(--font-dm-sans)' }}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
              {lang === 'id' ? 'Kirim' : 'Send'}
            </button>
          </form>
          <p className="text-[10px] text-gray-400 mt-1.5 ml-1">Shift+Enter untuk baris baru</p>
        </div>

      </div>
    </>
  )
}
