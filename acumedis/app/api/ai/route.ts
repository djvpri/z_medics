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
  } catch (error: any) {
    const msg = error?.message ?? String(error)
    console.error('AI API error:', msg)
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    )
  }
}