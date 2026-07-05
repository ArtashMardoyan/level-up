import { useEffect, useMemo, useState } from 'react'

export default function CoursePlayer({ questions, voices, voiceName, onClose, onPlayingChange }) {
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

  const scopedList = useMemo(() => (
    selectedModule === 'all' ? questions : questions.filter((q) => q.module === selectedModule)
  ), [questions, selectedModule])

  const currentItem = scopedList[currentIndex] || null

  useEffect(() => {
    document.body.classList.add('player-open')
    return () => document.body.classList.remove('player-open')
  }, [])

  useEffect(() => {
    onPlayingChange(playing)
  }, [playing, onPlayingChange])

  useEffect(() => {
    return () => onPlayingChange(false)
  }, [onPlayingChange])

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
    const selectedVoice = voices.find((v) => v.name === voiceName)
    if (selectedVoice) {
      utterance.voice = selectedVoice
      utterance.lang = selectedVoice.lang
    } else {
      utterance.lang = 'en-US'
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
  }, [playing, currentIndex, phase, currentItem, scopedList.length, voices, voiceName])

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
        <select
          className="plain-btn"
          value={selectedModule}
          onChange={(e) => handleModuleChange(e.target.value)}
        >
          <option value="all">All modules</option>
          {moduleNames.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <button className="player-close" aria-label="Stop and close player" onClick={handleClose}>✕</button>
      </div>
      <div className="player-title">{currentItem ? currentItem.question : 'Nothing to play'}</div>
      <div className="player-controls">
        <button className="player-btn" onClick={handlePrev} disabled={currentIndex === 0}>⏮</button>
        <button className="player-btn player-btn-main" onClick={() => setPlaying((p) => !p)} disabled={!currentItem}>
          {playing ? '⏸' : '▶'}
        </button>
        <button className="player-btn" onClick={handleNext} disabled={currentIndex >= scopedList.length - 1}>⏭</button>
        <span className="player-status">
          {currentItem ? `${phase === 'question' ? 'Q' : 'A'} ${currentIndex + 1} of ${scopedList.length}` : ''}
        </span>
      </div>
    </div>
  )
}
