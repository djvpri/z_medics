// app/api/ai/route.ts
// Single endpoint untuk semua AI request

import { NextRequest, NextResponse } from 'next/server'
import { runAI } from '@/lib/ai/router'
import { AITask } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { task, context }: { task: AITask; context: Record<string, any> } = body

    if (!task || !context) {
      return NextResponse.json(
        { error: 'Parameter task dan context wajib diisi' },
        { status: 400 }
      )
    }

    const result = await runAI({ task, context })

    return NextResponse.json(result)
  } catch (error) {
    console.error('AI API error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada AI service' },
      { status: 500 }
    )
  }
}


// Contoh cara memanggil API ini dari frontend:
//
// const response = await fetch('/api/ai', {
//   method: 'POST',
//   headers: { 'Content-Type': 'application/json' },
//   body: JSON.stringify({
//     task: 'treatment-recommendation',
//     context: {
//       chief_complaint: 'Nyeri punggung bawah',
//       tongue_color: 'pale-red',
//       tongue_coating: 'thin-white',
//       pulse_quality: 'wiry',
//       pain_scale: 7,
//     }
//   })
// })
// const data = await response.json()
// console.log(data.result) // rekomendasi AI
