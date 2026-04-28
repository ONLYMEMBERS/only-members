'use client'

import { useState } from 'react'
import { I18nContext, Lang, strings } from '@/lib/i18n'
import { CustomCursor } from './CustomCursor'
import { PageTransition } from './PageTransition'

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('es')
  const [city, setCity] = useState('Buenos Aires')

  return (
    <I18nContext.Provider value={{ lang, setLang, t: strings[lang], city, setCity }}>
      <CustomCursor />
      <PageTransition />
      {children}
    </I18nContext.Provider>
  )
}
