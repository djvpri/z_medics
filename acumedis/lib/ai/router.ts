import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'
import { google } from '@ai-sdk/google'
import { AITask } from '@/types'
import { getPrompt } from './prompts'

const taskModelMap: Record<AITask, () => any> = {
  'treatment-recommendation': () => anthropic('claude-sonnet-4-6'),
  'soap-notes': () => openai('gpt-4o'),
  'tongue-analysis': () => google('gemini-1.5-flash'),
  'tcm-reference': () => openai('gpt-4o'),
  'patient-summary': () => openai('gpt-4o'),
}

interface OrchestratorInput {
  task: AITask
  context: Record<string, any>
}

interface OrchestratorOutput {
  result: string
  model: string
  task: AITask
  timestamp: string
}

export async function runAI(input: OrchestratorInput): Promise<OrchestratorOutput> {
  const { task, context } = input
  const model = taskModelMap[task]()
  const { system, user } = getPrompt(task, context)

  try {
    const { text } = await generateText({
      model,
      system,
      prompt: user,
      maxTokens: 1000,
    })

    return {
      result: text,
      model: model.modelId,
      task,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error(`AI task ${task} failed with primary model, falling back...`, error)

    const fallback = openai('gpt-4o')
    const { text } = await generateText({
      model: fallback,
      system,
      prompt: user,
      maxTokens: 1000,
    })

    return {
      result: text,
      model: 'gpt-4o (fallback)',
      task,
      timestamp: new Date().toISOString(),
    }
  }
}