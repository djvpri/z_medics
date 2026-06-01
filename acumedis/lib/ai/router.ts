import { generateText } from 'ai'
import { google } from '@ai-sdk/google'
import { AITask } from '@/types'
import { getPrompt } from './prompts'

const GEMINI = () => google('gemini-2.5-flash')

const taskModelMap: Record<AITask, () => any> = {
  'treatment-recommendation': GEMINI,
  'soap-notes': GEMINI,
  'tongue-analysis': GEMINI,
  'tcm-reference': GEMINI,
  'patient-summary': GEMINI,
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

  const { text } = await generateText({
    model,
    system,
    prompt: user,
  })

  return {
    result: text,
    model: model.modelId,
    task,
    timestamp: new Date().toISOString(),
  }
}
