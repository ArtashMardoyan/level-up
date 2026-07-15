import { useEffect, useState, useMemo, useRef } from 'react'
import { SkipForward, SkipBack, Repeat, Pause, Play } from 'lucide-react'

import { audioUrl } from '../data/audio'
import { resolveVoice } from '../hooks/useSpeech'
import { useLanguage } from '../hooks/useLanguage'
import { audioPlayer } from '../services/audioPlayer'
import { useAudioPlayer } from '../hooks/useAudioPlayer'

const SPEEDS = [0.75, 1, 1.25, 1.5]
// "Back" restarts the current question if you're past this many seconds into it
// (like Spotify / Yandex Music); before it, "back" goes to the previous question.
const RESTART_BACK_SEC = 3

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function CoursePlayer({
  onActiveChange,
  startRequest,
  courseTitle,
  questions,
  courseId,
  onClose,
  voices
}) {
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
  const [playing, setPlaying] = useState(false)
  const [paused, setPaused] = useState(false)
  const [repeat, setRepeat] = useState(false)
  const [replayTick, setReplayTick] = useState(0)
  const [prevStartRequest, setPrevStartRequest] = useState(null)
  // Read inside onEnded so toggling repeat mid-track takes effect immediately.
  const repeatRef = useRef(repeat)

  // Jump to the requested question by adjusting state during render
  // (https://react.dev/learn/you-might-not-need-an-effect).
  if (startRequest !== prevStartRequest) {
    setPrevStartRequest(startRequest)
    const idx = startRequest ? questions.findIndex((q) => q.id === startRequest.id) : -1
    if (idx !== -1) {
      setSelectedModule('all')
      setCurrentIndex(idx)
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

  // Keep the ref current so the onEnded closure (captured when a track starts)
  // always sees the latest repeat value, even if toggled mid-playback.
  useEffect(() => {
    repeatRef.current = repeat
  }, [repeat])

  // Stop playback when the player unmounts so nothing keeps running in the background.
  useEffect(() => () => audioPlayer.stop(), [])

  // Clear the lock-screen metadata when the player unmounts.
  useEffect(
    () => () => {
      if ('mediaSession' in navigator) navigator.mediaSession.metadata = null
    },
    []
  )

  // Drive the shared service: it plays a local MP3 when one exists and otherwise
  // reads the text via speech — the component neither knows nor cares which.
  useEffect(() => {
    if (!playing || !currentItem) {
      if (!playing) audioPlayer.stop()
      return
    }
    const id = `${courseId}/${language}/${currentItem.id}`
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
        if (repeatRef.current) {
          // Repeat the same question: bump the tick so the effect replays it.
          setReplayTick((n) => n + 1)
        } else if (currentIndex + 1 < scopedList.length) {
          setCurrentIndex((i) => i + 1)
        } else {
          setPlaying(false)
        }
      },
      // One track per question: the question, then the answer (speech fallback
      // reads both; the MP3 already contains both).
      text: [currentItem.question, currentItem.answer].filter(Boolean).join('\n\n'),
      lang: voice ? voice.lang : language === 'ru' ? 'ru-RU' : 'en-US',
      url: audioUrl(currentItem.audio),
      voice,
      id
    })
  }, [playing, paused, currentIndex, currentItem, courseId, scopedList.length, voices, language, replayTick])

  const handleModuleChange = (value) => {
    setSelectedModule(value)
    setCurrentIndex(0)
    setPaused(false)
  }

  const handlePrev = () => {
    // Read the live position from the service (avoids a stale closure when this
    // runs from a lock-screen action handler).
    const position = audioPlayer.getSnapshot().currentTime
    if (position > RESTART_BACK_SEC) {
      audioPlayer.seek(0) // restart the current question from the beginning
    } else if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1)
      setPaused(false)
    } else {
      audioPlayer.seek(0) // already the first question → just restart it
    }
  }

  const handleNext = () => {
    setCurrentIndex((i) => Math.min(scopedList.length - 1, i + 1))
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

  // Lock-screen / control-center metadata (iOS, Android, macOS). It surfaces for
  // the MP3 path (the <audio> element); the speech fallback has no media session,
  // which is fine. Artwork uses the deploy base so paths resolve under /level-up/.
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentItem) return
    const base = import.meta.env.BASE_URL
    navigator.mediaSession.metadata = new MediaMetadata({
      artwork: [
        { src: `${base}icon-192.png`, type: 'image/png', sizes: '192x192' },
        { src: `${base}icon-512.png`, type: 'image/png', sizes: '512x512' }
      ],
      album: courseTitle || 'Interview Prep',
      artist: 'Level Up — Interview Prep',
      title: currentItem.question
    })
    navigator.mediaSession.setActionHandler('play', handlePlayPause)
    navigator.mediaSession.setActionHandler('pause', handlePlayPause)
    navigator.mediaSession.setActionHandler('previoustrack', handlePrev)
    navigator.mediaSession.setActionHandler('nexttrack', currentIndex < scopedList.length - 1 ? handleNext : null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentItem, courseTitle, currentIndex, scopedList.length])

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
      <div className="player-status">
        {currentItem ? t('playerStatusQuestion', { total: scopedList.length, n: currentIndex + 1 }) : ''}
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
        <button className="player-btn player-speed" aria-label={t('speed')} onClick={cycleSpeed}>
          {rate}×
        </button>
        <button aria-label={t('previous')} disabled={!currentItem} className="player-btn" onClick={handlePrev}>
          <SkipBack aria-hidden="true" size={18} />
        </button>
        <button
          className="player-btn player-btn-main"
          aria-label={t('playPause')}
          onClick={handlePlayPause}
          disabled={!currentItem}
        >
          {playing && !paused ? <Pause aria-hidden="true" size={20} /> : <Play aria-hidden="true" size={20} />}
        </button>
        <button
          disabled={currentIndex >= scopedList.length - 1}
          aria-label={t('next')}
          className="player-btn"
          onClick={handleNext}
        >
          <SkipForward aria-hidden="true" size={18} />
        </button>
        <button
          className={'player-btn' + (repeat ? ' active' : '')}
          onClick={() => setRepeat((v) => !v)}
          aria-label={t('playerRepeat')}
          aria-pressed={repeat}
        >
          <Repeat aria-hidden="true" size={17} />
        </button>
      </div>
    </div>
  )
}
