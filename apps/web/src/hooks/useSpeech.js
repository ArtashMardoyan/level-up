import { useEffect, useState } from 'react'

const DEFAULT_VOICE_NAMES = {
  en: ['Google US English', 'Samantha'],
  ru: ['Google русский', 'Milena'],
  hy: []
}

// The app no longer lets users pick a voice — it always uses the language's
// default (Google / Samantha / Milena), resolved here at consumption time.
// `voiceName` is kept in the signature for callers that pass '' (auto).
export function resolveVoice(voices, voiceName, language) {
  return (
    voices.find((v) => v.name === voiceName) ??
    DEFAULT_VOICE_NAMES[language]?.map((name) => voices.find((v) => v.name === name)).find(Boolean) ??
    voices.find((v) => v.lang.toLowerCase().startsWith(language)) ??
    null
  )
}

export function useSpeech() {
  const [voices, setVoices] = useState([])
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

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

  return { supported, voices }
}
