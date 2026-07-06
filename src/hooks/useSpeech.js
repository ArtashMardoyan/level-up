import { useCallback, useEffect, useState } from 'react'

const VOICE_STORAGE_KEY = 'interviewPrepVoice'
const DEFAULT_VOICE_NAMES = {
  en: ['Google US English', 'Samantha'],
  ru: ['Google русский', 'Milena']
}

// English keeps the legacy un-suffixed key so existing users keep their voice.
function voiceStorageKey(language) {
  return language === 'en' ? VOICE_STORAGE_KEY : `${VOICE_STORAGE_KEY}:${language}`
}

function readStoredVoice(language) {
  try {
    return localStorage.getItem(voiceStorageKey(language)) ?? ''
  } catch {
    return ''
  }
}

// '' means "auto default for the language" — resolved here at consumption time.
export function resolveVoice(voices, voiceName, language) {
  return (
    voices.find((v) => v.name === voiceName) ??
    DEFAULT_VOICE_NAMES[language]?.map((name) => voices.find((v) => v.name === name)).find(Boolean) ??
    voices.find((v) => v.lang.toLowerCase().startsWith(language)) ??
    null
  )
}

export function useSpeech(language) {
  const [voices, setVoices] = useState([])
  const [voiceName, setVoiceNameState] = useState(() => readStoredVoice(language))
  const [prevLanguage, setPrevLanguage] = useState(language)
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

  // Each language keeps its own voice preference — reload it on switch.
  if (language !== prevLanguage) {
    setPrevLanguage(language)
    setVoiceNameState(readStoredVoice(language))
  }

  const setVoiceName = useCallback(
    (name) => {
      setVoiceNameState(name)
      try {
        localStorage.setItem(voiceStorageKey(language), name)
      } catch {
        /* ignore */
      }
    },
    [language]
  )

  useEffect(() => {
    if (!supported) return
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices())
    loadVoices()
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices)
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices)
      window.speechSynthesis.cancel()
    }
  }, [supported])

  return { setVoiceName, supported, voiceName, voices }
}
