import { useCallback, useContext, useEffect, useState } from 'react'

import { translate } from '../i18n/strings'
import { LanguageContext } from '../i18n/LanguageContext'

const LANGUAGE_STORAGE_KEY = 'interviewPrepLanguage'

function getInitialLanguage() {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (saved === 'en' || saved === 'ru') return saved
  } catch {
    /* ignore */
  }
  return navigator.language?.toLowerCase().startsWith('ru') ? 'ru' : 'en'
}

// Owner side — called exactly once, in App, to create the context value.
export function useLanguageState() {
  const [language, setLanguage] = useState(getInitialLanguage)

  useEffect(() => {
    document.documentElement.lang = language
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
    } catch {
      /* ignore */
    }
  }, [language])

  return { setLanguage, language }
}

// Consumer side — any component that needs strings or the active language.
export function useLanguage() {
  const { setLanguage, language } = useContext(LanguageContext)
  const t = useCallback((key, params) => translate(language, key, params), [language])
  return { setLanguage, language, t }
}
