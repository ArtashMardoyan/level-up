import { useEffect, useState, useMemo } from 'react'

import { audioUrl } from '../data/audio'
import { resolveVoice } from '../hooks/useSpeech'
import { useLanguage } from '../hooks/useLanguage'
import { audioPlayer } from '../services/audioPlayer'
import { useAudioPlayer } from '../hooks/useAudioPlayer'

const SPEEDS = [0.75, 1, 1.25, 1.5]

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

// Inline SVG player icons — crisp at any size and consistent across platforms.
const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M8 5v14l11-7z" />
  </svg>
)
const PauseIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M6.5 5h3.5v14H6.5zM14 5h3.5v14H14z" />
  </svg>
)
const PrevIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M7 5h2.2v14H7zM20 5v14L9.6 12z" />
  </svg>
)
const NextIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M4 5l10.4 7L4 19zM14.8 5H17v14h-2.2z" />
  </svg>
)
const RestartIcon = () => (
  <svg stroke="currentColor" strokeLinecap="round" viewBox="0 0 24 24" aria-hidden="true" strokeWidth="2.2" fill="none">
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path strokeLinejoin="round" d="M3 4v4h4" />
  </svg>
)

export default function CoursePlayer({ onActiveChange, startRequest, questions, courseId, onClose, voices }) {
  const { language, t } = useLanguage()
  const { currentTime, duration, canSeek, rate } = useAudioPlayer()
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
  const [paused, setPaused] = useState(false)
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
      setPaused(false)
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

  // Stop playback when the player unmounts so nothing keeps running in the background.
  useEffect(() => () => audioPlayer.stop(), [])

  // Drive the shared service: it plays a local MP3 when one exists and otherwise
  // reads the text via speech — the component neither knows nor cares which.
  useEffect(() => {
    if (!playing || !currentItem) {
      if (!playing) audioPlayer.stop()
      return
    }
    const id = `${courseId}/${language}/${currentItem.id}-${phase}`
    // Same track already loaded → this is a pause/resume, not a new track.
    if (audioPlayer.currentInterviewId() === id) {
      if (paused) audioPlayer.pause()
      else if (audioPlayer.isPaused()) audioPlayer.resume()
      return
    }
    if (paused) return
    const voice = resolveVoice(voices, '', language)
    audioPlayer.play({
      onEnded: () => {
        if (phase === 'question') {
          setPhase('answer')
        } else if (currentIndex + 1 < scopedList.length) {
          setCurrentIndex((i) => i + 1)
          setPhase('question')
        } else {
          setPlaying(false)
        }
      },
      text: phase === 'question' ? currentItem.question : currentItem.answer,
      lang: voice ? voice.lang : language === 'ru' ? 'ru-RU' : 'en-US',
      url: audioUrl(currentItem.audio?.[phase]),
      voice,
      id
    })
  }, [playing, paused, currentIndex, phase, currentItem, courseId, scopedList.length, voices, language])

  const handleModuleChange = (value) => {
    setSelectedModule(value)
    setCurrentIndex(0)
    setPhase('question')
    setPaused(false)
  }

  const handleRestart = () => {
    setCurrentIndex(0)
    setPhase('question')
    setPlaying(true)
    setPaused(false)
  }

  const handlePrev = () => {
    setCurrentIndex((i) => Math.max(0, i - 1))
    setPhase('question')
    setPaused(false)
  }

  const handleNext = () => {
    setCurrentIndex((i) => Math.min(scopedList.length - 1, i + 1))
    setPhase('question')
    setPaused(false)
  }

  const handlePlayPause = () => {
    if (!playing) {
      setPlaying(true)
      setPaused(false)
      return
    }
    setPaused((p) => !p)
  }

  const cycleSpeed = () => {
    const next = SPEEDS[(SPEEDS.indexOf(rate) + 1) % SPEEDS.length]
    audioPlayer.setRate(next)
  }

  const handleClose = () => {
    audioPlayer.stop()
    setPlaying(false)
    setPaused(false)
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
      <div className="player-progress">
        <span className="player-time">{formatTime(currentTime)}</span>
        <input
          onChange={(e) => audioPlayer.seek(Number(e.target.value))}
          value={Math.min(currentTime, duration || 0)}
          className="player-seek"
          aria-label={t('seek')}
          disabled={!canSeek}
          max={duration || 0}
          type="range"
          step={0.1}
          min={0}
        />
        <span className="player-time">{formatTime(duration)}</span>
      </div>
      <div className="player-controls">
        <div className="player-controls-main">
          <button aria-label={t('restart')} onClick={handleRestart} disabled={!currentItem} className="player-btn">
            <RestartIcon />
          </button>
          <button disabled={currentIndex === 0} aria-label={t('previous')} className="player-btn" onClick={handlePrev}>
            <PrevIcon />
          </button>
          <button
            className="player-btn player-btn-main"
            aria-label={t('playPause')}
            onClick={handlePlayPause}
            disabled={!currentItem}
          >
            {playing && !paused ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button
            disabled={currentIndex >= scopedList.length - 1}
            aria-label={t('next')}
            className="player-btn"
            onClick={handleNext}
          >
            <NextIcon />
          </button>
          <button className="player-btn player-speed" aria-label={t('speed')} onClick={cycleSpeed}>
            {rate}×
          </button>
        </div>
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
