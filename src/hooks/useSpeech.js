import { useCallback, useEffect, useRef, useState } from 'react'

const VOICE_STORAGE_KEY = 'interviewPrepVoice'
const DEFAULT_VOICE_NAME = 'Google US English'

function readStoredVoice() {
  try { return localStorage.getItem(VOICE_STORAGE_KEY) } catch { return null }
}

export function useSpeech() {
  const [voices, setVoices] = useState([])
  const storedVoice = useRef(readStoredVoice()).current
  const [voiceName, setVoiceNameState] = useState(storedVoice ?? '')
  const hasAppliedDefault = useRef(storedVoice !== null)
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

  const setVoiceName = useCallback((name) => {
    setVoiceNameState(name)
    try { localStorage.setItem(VOICE_STORAGE_KEY, name) } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (!supported) return
    const loadVoices = () => {
      const list = window.speechSynthesis.getVoices()
      setVoices(list)
      if (!hasAppliedDefault.current && list.some((v) => v.name === DEFAULT_VOICE_NAME)) {
        hasAppliedDefault.current = true
        setVoiceName(DEFAULT_VOICE_NAME)
      }
    }
    loadVoices()
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices)
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices)
      window.speechSynthesis.cancel()
    }
  }, [supported, setVoiceName])

  return { supported, voices, voiceName, setVoiceName }
}
