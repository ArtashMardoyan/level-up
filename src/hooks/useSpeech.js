import { useCallback, useEffect, useRef, useState } from 'react'

const VOICE_STORAGE_KEY = 'interviewPrepVoice'
const DEFAULT_VOICE_NAME = 'Google US English'

function readStoredVoice() {
  try { return localStorage.getItem(VOICE_STORAGE_KEY) } catch { return null }
}

export function useSpeech() {
  const [speakingId, setSpeakingId] = useState(null)
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

  // Chrome silently stalls speechSynthesis on utterances longer than ~15s
  // unless it's kept alive with a periodic pause/resume nudge.
  useEffect(() => {
    if (!speakingId) return
    const interval = setInterval(() => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause()
        window.speechSynthesis.resume()
      }
    }, 10000)
    return () => clearInterval(interval)
  }, [speakingId])

  const speak = useCallback((id, text) => {
    if (!supported) return
    window.speechSynthesis.cancel()
    if (speakingId === id) {
      setSpeakingId(null)
      return
    }
    const utterance = new SpeechSynthesisUtterance(text)
    const selected = voices.find((v) => v.name === voiceName)
    if (selected) {
      utterance.voice = selected
      utterance.lang = selected.lang
    } else {
      utterance.lang = 'en-US'
    }
    utterance.onend = () => setSpeakingId((current) => (current === id ? null : current))
    utterance.onerror = () => setSpeakingId((current) => (current === id ? null : current))
    // Chrome can silently drop a speak() call made in the same tick as cancel().
    setTimeout(() => window.speechSynthesis.speak(utterance), 50)
    setSpeakingId(id)
  }, [speakingId, supported, voices, voiceName])

  const stop = useCallback(() => {
    if (!supported) return
    window.speechSynthesis.cancel()
    setSpeakingId(null)
  }, [supported])

  return { supported, speakingId, speak, stop, voices, voiceName, setVoiceName }
}
