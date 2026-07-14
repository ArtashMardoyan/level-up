import { useEffect, useState } from 'react'
import { SkipForward, RotateCcw, SkipBack, Pause, Play } from 'lucide-react'

import { resolveVoice } from '../hooks/useSpeech'
import { useLanguage } from '../hooks/useLanguage'

export default function DictionaryPlayer({ onActiveChange, startRequest, onClose, voices, items }) {
  const { language, t } = useLanguage()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [phase, setPhase] = useState('primary')
  const [playing, setPlaying] = useState(false)
  const [prevStartRequest, setPrevStartRequest] = useState(null)

  // Jump to the requested row by adjusting state during render
  // (https://react.dev/learn/you-might-not-need-an-effect).
  if (startRequest !== prevStartRequest) {
    setPrevStartRequest(startRequest)
    const idx = startRequest ? items.findIndex((it) => it.id === startRequest.id) : -1
    if (idx !== -1) {
      setCurrentIndex(idx)
      setPhase('primary')
      setPlaying(true)
    }
  }

  const currentItem = items[currentIndex] || null

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
    const targetLang = phase === 'primary' ? 'en' : 'ru'
    const text = phase === 'primary' ? currentItem.primary : currentItem.secondary
    const utterance = new SpeechSynthesisUtterance(text)
    const selectedVoice = resolveVoice(voices, '', targetLang)
    if (selectedVoice) {
      utterance.voice = selectedVoice
      utterance.lang = selectedVoice.lang
    } else {
      utterance.lang = targetLang === 'ru' ? 'ru-RU' : 'en-US'
    }
    utterance.onend = () => {
      if (phase === 'primary' && currentItem.secondary) {
        setPhase('secondary')
      } else if (currentIndex + 1 < items.length) {
        setCurrentIndex((i) => i + 1)
        setPhase('primary')
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
  }, [playing, currentIndex, phase, currentItem, items.length, voices, language])

  const handleRestart = () => {
    setCurrentIndex(0)
    setPhase('primary')
    setPlaying(true)
  }

  const handlePrev = () => {
    setCurrentIndex((i) => Math.max(0, i - 1))
    setPhase('primary')
  }

  const handleNext = () => {
    setCurrentIndex((i) => Math.min(items.length - 1, i + 1))
    setPhase('primary')
  }

  const handleClose = () => {
    window.speechSynthesis.cancel()
    setPlaying(false)
    onClose()
  }

  return (
    <div className="player-bar">
      <div className="player-top">
        <span className="player-status">{t('listen')}</span>
        <button aria-label={t('playerCloseAria')} className="player-close" onClick={handleClose}>
          ✕
        </button>
      </div>
      <div className="player-title">{currentItem ? currentItem.primary : t('nothingToPlay')}</div>
      <div className="player-controls">
        <div className="player-controls-main">
          <button aria-label={t('restart')} onClick={handleRestart} disabled={!currentItem} className="player-btn">
            <RotateCcw aria-hidden="true" size={17} />
          </button>
          <button disabled={currentIndex === 0} aria-label={t('previous')} className="player-btn" onClick={handlePrev}>
            <SkipBack aria-hidden="true" size={18} />
          </button>
          <button
            className="player-btn player-btn-main"
            onClick={() => setPlaying((p) => !p)}
            aria-label={t('playPause')}
            disabled={!currentItem}
          >
            {playing ? <Pause aria-hidden="true" size={20} /> : <Play aria-hidden="true" size={20} />}
          </button>
          <button
            disabled={currentIndex >= items.length - 1}
            aria-label={t('next')}
            className="player-btn"
            onClick={handleNext}
          >
            <SkipForward aria-hidden="true" size={18} />
          </button>
        </div>
        <span className="player-status">
          {currentItem ? t('dictionaryPlayerStatus', { total: items.length, n: currentIndex + 1 }) : ''}
        </span>
      </div>
    </div>
  )
}
