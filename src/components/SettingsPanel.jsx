import { Settings, Moon, Sun } from 'lucide-react'
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

  const setTheme = (next) => {
    if (theme !== next) toggleTheme()
  }

  return (
    <div className="settings-wrap" ref={wrapRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t('settingsAria')}
        className="settings-gear"
        aria-expanded={open}
      >
        <Settings aria-hidden="true" strokeWidth={1.9} size={19} />
      </button>
      {open && (
        <div className="settings-panel">
          <div className="settings-row">
            <span className="settings-label">{t('theme')}</span>
            <div className="segmented">
              <button
                className={'segmented-btn' + (theme === 'light' ? ' active' : '')}
                onClick={() => setTheme('light')}
              >
                <Sun aria-hidden="true" size={15} /> {t('themeLightLabel')}
              </button>
              <button
                className={'segmented-btn' + (theme === 'dark' ? ' active' : '')}
                onClick={() => setTheme('dark')}
              >
                <Moon aria-hidden="true" size={15} /> {t('themeDarkLabel')}
              </button>
            </div>
          </div>
          <div className="settings-row">
            <span className="settings-label">{t('language')}</span>
            <div className="segmented">
              <button
                className={'segmented-btn' + (language === 'en' ? ' active' : '')}
                onClick={() => setLanguage('en')}
              >
                English
              </button>
              <button
                className={'segmented-btn' + (language === 'ru' ? ' active' : '')}
                onClick={() => setLanguage('ru')}
              >
                Русский
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
