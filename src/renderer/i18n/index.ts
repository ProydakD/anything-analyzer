import React, { createContext, useContext, useCallback } from 'react'
import { zh } from './zh'
import { en } from './en'
import { ru } from './ru'
import type { LocaleKey } from './en'
import type { AppLocale } from '@shared/types'

export type Locale = AppLocale

const localeMap: Record<Locale, Partial<Record<LocaleKey, string>>> = { zh, en, ru }
const locales: Locale[] = ['zh', 'en', 'ru']

interface LocaleContextValue {
  locale: Locale
  t: (key: LocaleKey, vars?: Record<string, string | number>) => string
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: 'zh',
  t: (key) => key,
})

export function isLocale(value: string | null): value is Locale {
  return value !== null && (locales as string[]).includes(value)
}

export function getInitialLocale(): Locale {
  const saved = localStorage.getItem('app-locale')
  if (isLocale(saved)) return saved

  const language = navigator.language.toLowerCase()
  if (language.startsWith('ru')) return 'ru'
  if (language.startsWith('en')) return 'en'
  return 'zh'
}

export function getNextLocale(locale: Locale): Locale {
  const index = locales.indexOf(locale)
  return locales[(index + 1) % locales.length]
}

export function translate(
  locale: Locale,
  key: LocaleKey,
  vars?: Record<string, string | number>,
): string {
  let text = localeMap[locale]?.[key] ?? localeMap.en[key] ?? localeMap.zh[key] ?? key
  if (vars) {
    Object.entries(vars).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, String(v))
    })
  }
  return text
}

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale
  children: React.ReactNode
}) {
  const t = useCallback(
    (key: LocaleKey, vars?: Record<string, string | number>) => {
      return translate(locale, key, vars)
    },
    [locale]
  )

  return React.createElement(LocaleContext.Provider, { value: { locale, t } }, children)
}

export function useLocale() {
  return useContext(LocaleContext)
}

export type { LocaleKey }
