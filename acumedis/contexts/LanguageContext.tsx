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
  currency: string
  setCurrency: (c: string) => void
}

const LangContext = createContext<LangContextType>({
  lang: 'en',
  t: en,
  setLang: () => {},
  currency: 'IDR',
  setCurrency: () => {},
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en')
  const [currency, setCurrencyState] = useState('IDR')

  useEffect(() => {
    const savedLang = localStorage.getItem('zmedics_lang') as Lang | null
    if (savedLang === 'en' || savedLang === 'id') setLangState(savedLang)
    const savedCurrency = localStorage.getItem('zmedics_currency')
    if (savedCurrency) setCurrencyState(savedCurrency)
  }, [])

  function setLang(l: Lang) {
    setLangState(l)
    localStorage.setItem('zmedics_lang', l)
  }

  function setCurrency(c: string) {
    setCurrencyState(c)
    localStorage.setItem('zmedics_currency', c)
  }

  const t = lang === 'id' ? id : en

  return (
    <LangContext.Provider value={{ lang, t, setLang, currency, setCurrency }}>
      {children}
    </LangContext.Provider>
  )
}

export function useT() {
  return useContext(LangContext)
}
