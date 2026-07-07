import { useEffect, useState, useRef } from 'react'

import { useLanguage } from '../hooks/useLanguage'

const NOVELTY_VOICE_PREFIXES = [
  'Albert',
  'Bad News',
  'Bahh',
  'Bells',
  'Boing',
  'Bubbles',
  'Cellos',
  'Eddy',
  'Flo',
  'Good News',
  'Grandma',
  'Grandpa',
  'Jester',
  'Junior',
  'Organ',
  'Ralph',
  'Reed',
  'Rocko',
  'Sandy',
  'Shelley',
  'Superstar',
  'Trinoids',
  'Whisper',
  'Wobble',
  'Zarvox'
]

export default function SettingsPanel({ setVoiceName, toggleTheme, voiceName, voices, theme }) {
  const { setLanguage, language, t } = useLanguage()
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

  const languageVoices = voices.filter((v) => v.lang.toLowerCase().startsWith(language))
  const normalVoices = languageVoices.filter((v) => !NOVELTY_VOICE_PREFIXES.some((prefix) => v.name.startsWith(prefix)))
  const voiceOptions = normalVoices.length ? normalVoices : languageVoices.length ? languageVoices : voices

  return (
    <div className="settings-wrap" ref={wrapRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t('settingsAria')}
        className="settings-gear"
        aria-expanded={open}
      >
        ⚙️
      </button>
      {open && (
        <div className="settings-panel">
          <div className="settings-row">
            <span className="settings-label">{t('theme')}</span>
            <button className="plain-btn" onClick={toggleTheme}>
              {theme === 'dark' ? t('themeLight') : t('themeDark')}
            </button>
          </div>
          <div className="settings-row">
            <span className="settings-label">{t('language')}</span>
            <button onClick={() => setLanguage(language === 'en' ? 'ru' : 'en')} className="plain-btn">
              {language === 'en' ? '🌐 Русский' : '🌐 English'}
            </button>
          </div>
          {voiceOptions.length > 0 && (
            <div className="settings-row">
              <span className="settings-label">{t('voice')}</span>
              <select
                onChange={(e) => setVoiceName(e.target.value)}
                aria-label={t('voiceAria')}
                className="plain-btn"
                value={voiceName}
              >
                <option value="">🎙 {t('defaultVoice')}</option>
                {voiceOptions.map((v) => (
                  <option value={v.name} key={v.name}>
                    🎙 {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
