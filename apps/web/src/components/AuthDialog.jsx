import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
import { EyeOff, Zap, Eye, X } from 'lucide-react'

import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../hooks/useLanguage'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SIGNUP_PASSWORD_MIN = 8

// Map a backend ApiError to a localized message.
function messageFor(error, t) {
  if (!error) return null
  switch (error.status) {
    case 401:
      return t('authErrorCredentials')
    case 409:
      return t('authErrorEmailTaken')
    case 0:
      return t('authErrorNetwork')
    default:
      return t('authErrorGeneric')
  }
}

export default function AuthDialog({ onClose, open }) {
  const { register, login } = useAuth()
  const { t } = useLanguage()
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [prevOpen, setPrevOpen] = useState(open)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Full reset when the dialog closes — it stays mounted (just renders null),
  // so without this, stale email/password/mode from a previous attempt would
  // still be sitting there the next time it opens. Adjust state during render
  // (https://react.dev/learn/you-might-not-need-an-effect), same pattern as
  // the forceOpen/autoOpen sync in QuestionCard.jsx.
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (!open) {
      setMode('login')
      setName('')
      setEmail('')
      setPassword('')
      setShowPassword(false)
      setServerError(null)
    }
  }

  if (!open) return null

  const isSignUp = mode === 'signup'

  const emailValid = EMAIL_RE.test(email)
  const passwordValid = password.length >= (isSignUp ? SIGNUP_PASSWORD_MIN : 1)
  const nameValid = !isSignUp || name.trim().length >= 2
  const formValid = emailValid && passwordValid && nameValid

  const emailError = email && !emailValid ? t('authInvalidEmail') : null
  const passwordError = isSignUp && password && password.length < SIGNUP_PASSWORD_MIN ? t('authPasswordTooShort') : null

  // Switching Login <-> Signup keeps the email (typing it twice is annoying),
  // but clears the password/name and any error from the other mode's attempt.
  const switchMode = (next) => {
    setMode(next)
    setPassword('')
    setName('')
    setShowPassword(false)
    setServerError(null)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!formValid || busy) return
    setBusy(true)
    setServerError(null)
    try {
      if (isSignUp) {
        await register({ name: name.trim(), password, email })
      } else {
        await login({ password, email })
      }
      onClose()
    } catch (err) {
      setServerError(messageFor(err, t))
    } finally {
      setBusy(false)
    }
  }

  return createPortal(
    <div className="auth-overlay" onMouseDown={onClose}>
      <div onMouseDown={(e) => e.stopPropagation()} className="auth-card">
        <div className="auth-head">
          <span className="auth-logo">
            <Zap aria-hidden="true" strokeWidth={2.2} size={22} />
          </span>
          <button aria-label={t('authClose')} className="auth-close" onClick={onClose}>
            <X aria-hidden="true" size={17} />
          </button>
        </div>

        <h2 className="auth-title">{isSignUp ? t('authSignUpTitle') : t('authSignInTitle')}</h2>
        <p className="auth-sub">{isSignUp ? t('authSubSignup') : t('authSubLogin')}</p>

        <div className="auth-tabs">
          <button
            className={'auth-tab' + (isSignUp ? '' : ' active')}
            onClick={() => switchMode('login')}
            type="button"
          >
            {t('authTabLogin')}
          </button>
          <button
            className={'auth-tab' + (isSignUp ? ' active' : '')}
            onClick={() => switchMode('signup')}
            type="button"
          >
            {t('authTabSignup')}
          </button>
        </div>

        <form className="auth-form" onSubmit={submit}>
          {isSignUp && (
            <div className="auth-field">
              <label className="auth-label">{t('authName')}</label>
              <input
                onChange={(e) => setName(e.target.value)}
                placeholder={t('authNamePlaceholder')}
                className="auth-input"
                autoComplete="name"
                minLength={2}
                value={name}
                required
              />
            </div>
          )}

          <div className="auth-field">
            <label className="auth-label">{t('authEmail')}</label>
            <input
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('authEmailPlaceholder')}
              className="auth-input"
              autoComplete="email"
              value={email}
              type="email"
              required
            />
            {emailError && <span className="auth-hint">{emailError}</span>}
          </div>

          <div className="auth-field">
            <label className="auth-label">{t('authPassword')}</label>
            <div className="auth-input-wrap">
              <input
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('authPasswordPlaceholder')}
                type={showPassword ? 'text' : 'password'}
                className="auth-input"
                value={password}
                required
              />
              <button
                aria-label={showPassword ? t('authHidePassword') : t('authShowPassword')}
                onClick={() => setShowPassword((v) => !v)}
                className="auth-eye"
                type="button"
              >
                {showPassword ? <EyeOff aria-hidden="true" size={17} /> : <Eye aria-hidden="true" size={17} />}
              </button>
            </div>
            {passwordError && <span className="auth-hint">{passwordError}</span>}
          </div>

          {serverError && <p className="auth-error">{serverError}</p>}

          <button disabled={!formValid || busy} className="auth-submit" type="submit">
            {busy ? t('authWorking') : isSignUp ? t('authCtaSignUp') : t('authSubmitSignIn')}
          </button>
        </form>

        <p className="auth-switch">
          {isSignUp ? t('authSwitchToLogin') : t('authSwitchToSignup')}{' '}
          <button onClick={() => switchMode(isSignUp ? 'login' : 'signup')} className="auth-switch-link" type="button">
            {isSignUp ? t('authTabLogin') : t('authTabSignup')}
          </button>
        </p>
      </div>
    </div>,
    document.body
  )
}
