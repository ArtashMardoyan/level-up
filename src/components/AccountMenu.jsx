import { useEffect, useState, useRef } from 'react'
import { ChevronRight, LogOut, LogIn, Moon, User, Sun } from 'lucide-react'

import AuthDialog from './AuthDialog'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../hooks/useLanguage'
import { progressSummary } from '../services/endpoints'

export default function AccountMenu({ onViewProfile, toggleTheme, theme }) {
  const { setLanguage, language, t } = useLanguage()
  const { logout, user } = useAuth()
  const [open, setOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [totals, setTotals] = useState({ reviewed: 0, streak: 0, saved: 0 })
  const wrapRef = useRef(null)

  const signedIn = !!user
  const displayName = user?.name || ''

  // Real reviewed/favorite totals for the account, fetched when the menu opens.
  useEffect(() => {
    if (!open || !signedIn) return
    let active = true
    progressSummary()
      .then((data) => {
        if (active)
          setTotals({
            reviewed: data?.totalReviewed || 0,
            saved: data?.totalFavorites || 0,
            streak: data?.currentStreak || 0
          })
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [open, signedIn])

  useEffect(() => {
    if (!open) return
    const handleOutsideClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    // Close on page scroll (non-capturing → scrolling inside the panel, which
    // doesn't bubble to window, keeps it open).
    const closeOnScroll = () => setOpen(false)
    document.addEventListener('mousedown', handleOutsideClick)
    window.addEventListener('scroll', closeOnScroll)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      window.removeEventListener('scroll', closeOnScroll)
    }
  }, [open])

  const setTheme = (next) => {
    if (theme !== next) toggleTheme()
  }

  const openAuth = () => {
    setOpen(false)
    setAuthOpen(true)
  }

  const viewProfile = () => {
    setOpen(false)
    onViewProfile()
  }

  return (
    <div className="account-wrap" ref={wrapRef}>
      <button
        className={'account-btn' + (signedIn ? ' signed' : '')}
        onClick={() => setOpen((v) => !v)}
        aria-label={t('accountAria')}
        aria-expanded={open}
      >
        {signedIn ? displayName.charAt(0) : <User aria-hidden="true" strokeWidth={1.9} size={19} />}
      </button>

      {open && (
        <div className="account-menu">
          {signedIn ? (
            <button className="account-profile account-profile-link" onClick={viewProfile} type="button">
              <span className="account-avatar signed">{displayName.charAt(0)}</span>
              <span className="account-identity">
                <span className="account-name">{displayName}</span>
                <span className="account-sub">{t('accountSubtitle')}</span>
              </span>
              <ChevronRight className="account-profile-caret" aria-hidden="true" size={17} />
            </button>
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
                <span className="account-stat-value amber">🔥{totals.streak}</span>
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
              <button className="account-signin" onClick={openAuth}>
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
              <button
                className={'segmented-btn' + (language === 'hy' ? ' active' : '')}
                onClick={() => setLanguage('hy')}
              >
                Հայերեն
              </button>
            </div>
          </div>

          {signedIn && (
            <button className="account-signout" onClick={logout}>
              <LogOut aria-hidden="true" size={16} /> {t('accountSignOut')}
            </button>
          )}
        </div>
      )}

      <AuthDialog onClose={() => setAuthOpen(false)} open={authOpen} />
    </div>
  )
}
