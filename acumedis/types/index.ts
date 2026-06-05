export type Gender = 'male' | 'female'

export type TongueColor = 'red' | 'pale-red' | 'pale' | 'purple' | 'dark-red'

export type TongueCoating =
  | 'thin-white'
  | 'thick-white'
  | 'thin-yellow'
  | 'thick-yellow'
  | 'none'

export type PulseQuality =
  | 'wiry'
  | 'slippery'
  | 'weak'
  | 'rapid'
  | 'slow'
  | 'deep'
  | 'floating'

export interface Practitioner {
  id: string
  name: string
  email: string
  phone?: string
  clinic_name?: string
  created_at: string
}

export interface Patient {
  id: string
  practitioner_id: string
  name: string
  gender?: Gender
  birth_date?: string
  phone?: string
  email?: string
  address?: string
  avatar_url?: string
  created_at: string
  // computed
  age?: number
  total_sessions?: number
  last_session_date?: string
}

export interface Session {
  id: string
  patient_id: string
  practitioner_id: string
  session_date: string
  chief_complaint: string
  tongue_color?: TongueColor
  tongue_coating?: TongueCoating
  pulse_quality?: PulseQuality
  pain_scale?: number
  tcm_diagnosis?: string
  points_used?: string[]
  duration_minutes?: number
  notes?: string
  ai_recommendation?: AIRecommendation
  created_at: string
  // joined
  patient?: Patient
}

export interface SessionPhoto {
  id: string
  session_id: string
  photo_type: 'tongue' | 'body' | 'other'
  storage_path: string
  ai_analysis?: string
  created_at: string
}

export interface AIRecommendation {
  model: string
  task: AITask
  result: string
  points?: string[]
  diagnosis?: string
  timestamp: string
}

export type AITask =
  | 'treatment-recommendation'
  | 'soap-notes'
  | 'tongue-analysis'
  | 'tcm-reference'
  | 'patient-summary'

export interface NewPatientForm {
  name: string
  gender?: Gender
  birth_date?: string
  phone?: string
  email?: string
  address?: string
  avatar_url?: string
}

export interface NewSessionForm {
  patient_id: string
  session_date: string
  chief_complaint: string
  tongue_color?: TongueColor
  tongue_coating?: TongueCoating
  pulse_quality?: PulseQuality
  pain_scale?: number
  points_used?: string[]
  duration_minutes?: number
  notes?: string
}