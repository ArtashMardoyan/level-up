import { useEffect, useRef, useState } from 'react'

const NOVELTY_VOICE_PREFIXES = [
  'Albert', 'Bad News', 'Bahh', 'Bells', 'Boing', 'Bubbles', 'Cellos',
  'Eddy', 'Flo', 'Good News', 'Grandma', 'Grandpa', 'Jester', 'Junior',
  'Organ', 'Ralph', 'Reed', 'Rocko', 'Sandy', 'Shelley', 'Superstar',
  'Trinoids', 'Whisper', 'Wobble', 'Zarvox',
]

export default function SettingsPanel({ theme, toggleTheme, voices, voiceName, setVoiceName }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handleOutsideClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [open])

  const englishVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('en'))
  const normalVoices = englishVoices.filter(
    (v) => !NOVELTY_VOICE_PREFIXES.some((prefix) => v.name.startsWith(prefix))
  )
  const voiceOptions = normalVoices.length ? normalVoices : (englishVoices.length ? englishVoices : voices)

  return (
    <div className="settings-wrap" ref={wrapRef}>
      <button
        className="settings-gear"
        aria-label="Settings"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        ⚙️
      </button>
      {open && (
        <div className="settings-panel">
          <div className="settings-row">
            <span className="settings-label">Theme</span>
            <button className="plain-btn" onClick={toggleTheme}>
              {theme === 'dark' ? '☀ Light' : '☾ Dark'}
            </button>
          </div>
          {voiceOptions.length > 0 && (
            <div className="settings-row">
              <span className="settings-label">Voice</span>
              <select
                className="plain-btn"
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
                aria-label="Voice for read-aloud"
              >
                <option value="">Default voice</option>
                {voiceOptions.map((v) => (
                  <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
