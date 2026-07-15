import { useEffect, useState, useRef } from 'react'
import { LogOut, LogIn, Moon, User, Sun } from 'lucide-react'

import { useLanguage } from '../hooks/useLanguage'

// UI-only account block. There is no auth/DB yet — `signedIn` is a local demo
// toggle so the signed-in design can be previewed; wire it to real auth later.
// Placeholder identity until a backend exists:
const DEMO_NAME = 'Artash'
const DEMO_STREAK = 5

// Sum reviewed / favorited items across every course + the dictionary. These
// counts are real (read from localStorage) even without an account.
function readTotals() {
  let reviewed = 0
  let saved = 0
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key || !key.startsWith('interviewPrepState:')) continue
      const parsed = JSON.parse(localStorage.getItem(key))
      if (Array.isArray(parsed?.reviewed)) reviewed += parsed.reviewed.length
      if (Array.isArray(parsed?.favorites)) saved += parsed.favorites.length
    }
  } catch {
    // ignore parse/read failures
  }
  return { reviewed, saved }
}

export default function AccountMenu({ toggleTheme, theme }) {
  const { setLanguage, language, t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [signedIn, setSignedIn] = useState(false)
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

  const totals = open ? readTotals() : { reviewed: 0, saved: 0 }

  return (
    <div className="account-wrap" ref={wrapRef}>
      <button
        className={'account-btn' + (signedIn ? ' signed' : '')}
        onClick={() => setOpen((v) => !v)}
        aria-label={t('accountAria')}
        aria-expanded={open}
      >
        {signedIn ? DEMO_NAME.charAt(0) : <User aria-hidden="true" strokeWidth={1.9} size={19} />}
      </button>

      {open && (
        <div className="account-menu">
          {signedIn ? (
            <div className="account-profile">
              <span className="account-avatar signed">{DEMO_NAME.charAt(0)}</span>
              <span className="account-identity">
                <span className="account-name">{DEMO_NAME}</span>
                <span className="account-sub">{t('accountSubtitle')}</span>
              </span>
            </div>
          ) : (
            <div className="account-profile">
              <span className="account-avatar">
                <User aria-hidden="true" strokeWidth={1.8} size={20} />
              </span>
              <span className="account-identity">
                <span className="account-name">{t('accountGuestName')}</span>
                <span className="account-sub">{t('accountGuestSubtitle')}</span>
              </span>
            </div>
          )}

          {signedIn ? (
            <div className="account-stats">
              <span className="account-stat">
                <span className="account-stat-value amber">🔥{DEMO_STREAK}</span>
                <span className="account-stat-label">{t('accountStatStreak')}</span>
              </span>
              <span className="account-stat">
                <span className="account-stat-value green">{totals.reviewed}</span>
                <span className="account-stat-label">{t('accountStatReviewed')}</span>
              </span>
              <span className="account-stat">
                <span className="account-stat-value amber">★{totals.saved}</span>
                <span className="account-stat-label">{t('accountStatSaved')}</span>
              </span>
            </div>
          ) : (
            <>
              <button onClick={() => setSignedIn(true)} className="account-signin">
                <LogIn aria-hidden="true" size={16} /> {t('accountSignIn')}
              </button>
              <p className="account-hint">{t('accountSignInHint')}</p>
            </>
          )}

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

          {signedIn && (
            <button onClick={() => setSignedIn(false)} className="account-signout">
              <LogOut aria-hidden="true" size={16} /> {t('accountSignOut')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
