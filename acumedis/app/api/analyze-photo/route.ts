import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30
import { generateText } from 'ai'
import { google } from '@ai-sdk/google'

export async function POST(req: NextRequest) {
  try {
    const { image, mimeType = 'image/jpeg', context } = await req.json()

    if (!image) {
      return NextResponse.json({ error: 'Gambar wajib disertakan' }, { status: 400 })
    }

    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            image: Buffer.from(image, 'base64'),
          },
          {
            type: 'text',
            text: `Kamu adalah ahli diagnosis TCM yang menganalisis foto lidah untuk praktisi akupuntur di Indonesia.

Analisis foto lidah ini dan kembalikan hasil HANYA dalam format JSON berikut:
{
  "warna": "warna lidah yang terlihat (misal: merah muda, merah, pucat, ungu)",
  "selaput": "kondisi selaput lidah (misal: putih tipis, kuning tebal, tidak ada)",
  "bentuk": "bentuk dan ukuran lidah (misal: normal, bengkak, tipis, ada retakan)",
  "kelembaban": "kondisi kelembaban (misal: normal, kering, basah berlebihan)",
  "indikasi": ["sindrom TCM 1", "sindrom TCM 2"],
  "ringkasan": "1-2 kalimat ringkasan analisis TCM",
  "rekomendasi": "saran singkat teknis untuk praktisi"
}

${context ? `Catatan tambahan dari praktisi: ${context}` : ''}

Jawab dalam Bahasa Indonesia. Output HANYA JSON, tanpa teks lain di luar JSON.`,
          },
        ],
      }],
    })

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Format respons tidak valid', raw: text }, { status: 500 })
    }

    const result = JSON.parse(jsonMatch[0])
    return NextResponse.json({ result })
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Gagal menganalisis foto' }, { status: 500 })
  }
}
