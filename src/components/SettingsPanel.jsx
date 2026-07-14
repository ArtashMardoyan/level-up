import { useEffect, useState, useRef } from 'react'

import { useLanguage } from '../hooks/useLanguage'

export default function SettingsPanel({ toggleTheme, theme }) {
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
        </div>
      )}
    </div>
  )
}
