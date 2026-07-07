import { useEffect, useState, useMemo } from 'react'

import { resolveVoice } from '../hooks/useSpeech'
import { useLanguage } from '../hooks/useLanguage'

export default function CoursePlayer({ onActiveChange, startRequest, questions, voiceName, onClose, voices }) {
  const { language, t } = useLanguage()
  const moduleNames = useMemo(() => {
    const seen = []
    for (const item of questions) {
      if (!seen.includes(item.module)) seen.push(item.module)
    }
    return seen
  }, [questions])

  const [selectedModule, setSelectedModule] = useState('all')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [phase, setPhase] = useState('question')
  const [playing, setPlaying] = useState(false)
  const [prevStartRequest, setPrevStartRequest] = useState(null)

  // Jump to the requested question by adjusting state during render
  // (https://react.dev/learn/you-might-not-need-an-effect).
  if (startRequest !== prevStartRequest) {
    setPrevStartRequest(startRequest)
    const idx = startRequest ? questions.findIndex((q) => q.id === startRequest.id) : -1
    if (idx !== -1) {
      setSelectedModule('all')
      setCurrentIndex(idx)
      setPhase('question')
      setPlaying(true)
    }
  }

  const scopedList = useMemo(
    () => (selectedModule === 'all' ? questions : questions.filter((q) => q.module === selectedModule)),
    [questions, selectedModule]
  )

  const currentItem = scopedList[currentIndex] || null

  useEffect(() => {
    document.body.classList.add('player-open')
    return () => document.body.classList.remove('player-open')
  }, [])

  useEffect(() => {
    if (currentItem) onActiveChange?.(currentItem.id)
  }, [currentItem, onActiveChange])

  // Chrome silently stalls speechSynthesis on utterances longer than ~15s
  // unless it's kept alive with a periodic pause/resume nudge.
  useEffect(() => {
    if (!playing) return
    const interval = setInterval(() => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause()
        window.speechSynthesis.resume()
      }
    }, 10000)
    return () => clearInterval(interval)
  }, [playing])

  useEffect(() => {
    if (!playing || !currentItem) return
    const text = phase === 'question' ? currentItem.question : currentItem.answer
    const utterance = new SpeechSynthesisUtterance(text)
    const selectedVoice = resolveVoice(voices, voiceName, language)
    if (selectedVoice) {
      utterance.voice = selectedVoice
      utterance.lang = selectedVoice.lang
    } else {
      utterance.lang = language === 'ru' ? 'ru-RU' : 'en-US'
    }
    utterance.onend = () => {
      if (phase === 'question') {
        setPhase('answer')
      } else if (currentIndex + 1 < scopedList.length) {
        setCurrentIndex((i) => i + 1)
        setPhase('question')
      } else {
        setPlaying(false)
      }
    }
    window.speechSynthesis.cancel()
    // Chrome can silently drop a speak() call made in the same tick as cancel().
    const timer = setTimeout(() => window.speechSynthesis.speak(utterance), 50)
    return () => {
      clearTimeout(timer)
      window.speechSynthesis.cancel()
    }
  }, [playing, currentIndex, phase, currentItem, scopedList.length, voices, voiceName, language])

  const handleModuleChange = (value) => {
    setSelectedModule(value)
    setCurrentIndex(0)
    setPhase('question')
  }

  const handlePrev = () => {
    setCurrentIndex((i) => Math.max(0, i - 1))
    setPhase('question')
  }

  const handleNext = () => {
    setCurrentIndex((i) => Math.min(scopedList.length - 1, i + 1))
    setPhase('question')
  }

  const handleClose = () => {
    window.speechSynthesis.cancel()
    setPlaying(false)
    onClose()
  }

  return (
    <div className="player-bar">
      <div className="player-top">
        <select onChange={(e) => handleModuleChange(e.target.value)} value={selectedModule} className="plain-btn">
          <option value="all">{t('allModules')}</option>
          {moduleNames.map((m) => (
            <option value={m} key={m}>
              {m}
            </option>
          ))}
        </select>
        <button aria-label={t('playerCloseAria')} className="player-close" onClick={handleClose}>
          ✕
        </button>
      </div>
      <div className="player-title">{currentItem ? currentItem.question : t('nothingToPlay')}</div>
      <div className="player-controls">
        <button disabled={currentIndex === 0} className="player-btn" onClick={handlePrev}>
          ⏮
        </button>
        <button className="player-btn player-btn-main" onClick={() => setPlaying((p) => !p)} disabled={!currentItem}>
          {playing ? '⏸' : '▶'}
        </button>
        <button disabled={currentIndex >= scopedList.length - 1} className="player-btn" onClick={handleNext}>
          ⏭
        </button>
        <span className="player-status">
          {currentItem
            ? t(phase === 'question' ? 'playerStatusQuestion' : 'playerStatusAnswer', {
                total: scopedList.length,
                n: currentIndex + 1
              })
            : ''}
        </span>
      </div>
    </div>
  )
}
