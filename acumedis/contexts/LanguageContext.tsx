'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import en from '@/lib/i18n/en'
import type { Translations } from '@/lib/i18n/types'
import id from '@/lib/i18n/id'

type Lang = 'en' | 'id'

interface LangContextType {
  lang: Lang
  t: Translations
  setLang: (l: Lang) => void
}

const LangContext = createContext<LangContextType>({
  lang: 'en',
  t: en,
  setLang: () => {},
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en')

  useEffect(() => {
    const saved = localStorage.getItem('zmedics_lang') as Lang | null
    if (saved === 'en' || saved === 'id') setLangState(saved)
  }, [])

  function setLang(l: Lang) {
    setLangState(l)
    localStorage.setItem('zmedics_lang', l)
  }

  const t = lang === 'id' ? id : en

  return (
    <LangContext.Provider value={{ lang, t, setLang }}>
      {children}
    </LangContext.Provider>
  )
}

export function useT() {
  return useContext(LangContext)
}
