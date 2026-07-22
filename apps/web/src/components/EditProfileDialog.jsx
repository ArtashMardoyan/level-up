import { createPortal } from 'react-dom'
import { Camera, X } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'

import { useLanguage } from '../hooks/useLanguage'
import { usersUpdate } from '../services/endpoints'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_MIN = 8
const TRACKS = ['Backend', 'Frontend', 'Full-stack', 'DevOps', 'Mobile']

// Map a backend ApiError to a localized inline message.
function messageFor(error, t) {
  if (!error) return null
  switch (error.status) {
    case 401:
      return t('editErrWrongPassword')
    case 409:
      return t('authErrorEmailTaken')
    case 0:
      return t('authErrorNetwork')
    default:
      return t('authErrorGeneric')
  }
}

export default function EditProfileDialog({ onSaved, onClose, open, user }) {
  const { t } = useLanguage()
  const [prevOpen, setPrevOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [bio, setBio] = useState('')
  const [track, setTrack] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [serverError, setServerError] = useState(null)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef(null)

  // Seed the form from the user each time the dialog opens (state-from-prop via a
  // render-time guard — never setState in an effect, per the repo's lint rules).
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setName(user?.name || '')
      setEmail(user?.email || '')
      setBio(user?.bio || '')
      setTrack(user?.track || '')
      setCurrentPassword('')
      setNewPassword('')
      setServerError(null)
    }
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const nameValid = name.trim().length >= 2
  const emailValid = EMAIL_RE.test(email)
  const wantsPassword = newPassword.length > 0
  const newPasswordValid = !wantsPassword || newPassword.length >= PASSWORD_MIN
  const currentPasswordValid = !wantsPassword || currentPassword.length > 0
  const formValid = nameValid && emailValid && newPasswordValid && currentPasswordValid

  const nameError = name && !nameValid ? t('editErrName') : null
  const emailError = email && !emailValid ? t('authInvalidEmail') : null
  const newPasswordError = wantsPassword && newPassword.length < PASSWORD_MIN ? t('authPasswordTooShort') : null
  const currentPasswordError = wantsPassword && !currentPasswordValid ? t('editErrCurrentRequired') : null

  const submit = async (e) => {
    e.preventDefault()
    if (!formValid || busy) return
    setBusy(true)
    setServerError(null)

    const payload = { email: email.trim(), name: name.trim(), bio: bio.trim(), track }
    if (wantsPassword) {
      payload.currentPassword = currentPassword
      payload.newPassword = newPassword
    }

    try {
      const updated = await usersUpdate(payload)
      onSaved(updated)
      onClose()
    } catch (err) {
      setServerError(messageFor(err, t))
    } finally {
      setBusy(false)
    }
  }

  const initial = (name || user?.name || '').charAt(0).toUpperCase()

  return createPortal(
    <div className="edit-overlay" onMouseDown={onClose}>
      <div onMouseDown={(e) => e.stopPropagation()} className="edit-card">
        <div className="auth-head">
          <h2 className="auth-title">{t('editTitle')}</h2>
          <button aria-label={t('authClose')} className="auth-close" onClick={onClose} type="button">
            <X aria-hidden="true" size={17} />
          </button>
        </div>

        <div className="edit-avatar-row">
          <span className="profile-avatar edit-avatar">{initial}</span>
          <div className="edit-avatar-actions">
            <button onClick={() => fileRef.current?.click()} className="edit-upload-btn" type="button">
              <Camera aria-hidden="true" size={15} /> {t('editUploadPhoto')}
            </button>
            <span className="edit-photo-hint">{t('editPhotoHint')}</span>
            <input className="edit-file-input" onChange={() => {}} accept="image/*" ref={fileRef} type="file" />
          </div>
        </div>

        <form className="auth-form" onSubmit={submit}>
          <div className="auth-field">
            <label className="auth-label">{t('authName')}</label>
            <input
              onChange={(e) => setName(e.target.value)}
              placeholder={t('authNamePlaceholder')}
              className="auth-input"
              autoComplete="name"
              value={name}
              required
            />
            {nameError && <span className="auth-error">{nameError}</span>}
          </div>

          <div className="auth-field">
            <label className="auth-label">{t('editTrack')}</label>
            <select onChange={(e) => setTrack(e.target.value)} className="auth-input edit-select" value={track}>
              <option value="">{t('editTrackNone')}</option>
              {TRACKS.map((tr) => (
                <option value={tr} key={tr}>
                  {tr}
                </option>
              ))}
            </select>
          </div>

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
            {emailError && <span className="auth-error">{emailError}</span>}
          </div>

          <div className="auth-field">
            <label className="auth-label">{t('editBio')}</label>
            <textarea
              onChange={(e) => setBio(e.target.value)}
              placeholder={t('editBioPlaceholder')}
              className="auth-input edit-textarea"
              value={bio}
              rows={3}
            />
          </div>

          <div className="edit-password-section">
            <span className="edit-section-label">{t('editPasswordSection')}</span>
            <p className="edit-photo-hint">{t('editPasswordHint')}</p>
            <div className="auth-field">
              <label className="auth-label">{t('editCurrentPassword')}</label>
              <input
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={t('authPasswordPlaceholder')}
                autoComplete="current-password"
                value={currentPassword}
                className="auth-input"
                type="password"
              />
              {currentPasswordError && <span className="auth-error">{currentPasswordError}</span>}
            </div>
            <div className="auth-field">
              <label className="auth-label">{t('editNewPassword')}</label>
              <input
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('authPasswordPlaceholder')}
                autoComplete="new-password"
                className="auth-input"
                value={newPassword}
                type="password"
              />
              {newPasswordError && <span className="auth-error">{newPasswordError}</span>}
            </div>
          </div>

          {serverError && <p className="auth-error">{serverError}</p>}

          <div className="edit-actions">
            <button className="edit-cancel-btn" onClick={onClose} type="button">
              {t('editCancel')}
            </button>
            <button className="auth-submit edit-save-btn" disabled={!formValid || busy} type="submit">
              {busy ? t('authWorking') : t('editSave')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
