import { useEffect, useState, useRef } from 'react'
import { Sparkles, Hexagon, Trophy, Target, Flame, Bell } from 'lucide-react'

import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../hooks/useLanguage'
import {
  notificationsUnreadCount,
  notificationsMarkAllRead,
  notificationsMarkRead,
  notificationsList
} from '../services/endpoints'

// Maps a backend notification `type` to its icon, accent, and i18n keys. The
// server sends type + params (never localized text), so the wording lives here.
const TYPE_META = {
  new_questions: {
    titleKey: 'notifNewQuestionsTitle',
    bodyKey: 'notifNewQuestionsBody',
    accent: '#4ade80',
    Icon: Hexagon
  },
  review_milestone: { titleKey: 'notifMilestoneTitle', bodyKey: 'notifMilestoneBody', accent: '#4ade80', Icon: Trophy },
  welcome: { titleKey: 'notifWelcomeTitle', bodyKey: 'notifWelcomeBody', accent: '#818cf8', Icon: Sparkles },
  streak: { titleKey: 'notifStreakTitle', bodyKey: 'notifStreakBody', accent: '#fbbf24', Icon: Flame },
  daily: { titleKey: 'notifDailyTitle', bodyKey: 'notifDailyBody', accent: '#818cf8', Icon: Target }
}
const FALLBACK = { titleKey: 'notifGenericTitle', bodyKey: 'notifGenericBody', accent: '#818cf8', Icon: Bell }

// Localized relative time from an ISO timestamp ("2 hours ago" / "вчера").
function relativeTime(iso, language) {
  const diffSec = Math.round((new Date(iso).getTime() - Date.now()) / 1000)
  const abs = Math.abs(diffSec)
  const rtf = new Intl.RelativeTimeFormat(language, { numeric: 'auto' })
  if (abs < 60) return rtf.format(Math.round(diffSec), 'second')
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour')
  if (abs < 604800) return rtf.format(Math.round(diffSec / 86400), 'day')
  return rtf.format(Math.round(diffSec / 604800), 'week')
}

export default function NotificationBell() {
  const { language, t } = useLanguage()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const wrapRef = useRef(null)

  // Badge count: fetch on mount and whenever the signed-in user changes. When
  // signed out we simply stop fetching — rendering is gated on `user`, so any
  // stale count/items from a previous session never show.
  useEffect(() => {
    if (!user) return
    let active = true
    notificationsUnreadCount()
      .then((data) => {
        if (active) setUnread(data?.count || 0)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [user])

  // Load the list when the panel opens (loading flag is flipped in the click
  // handler, not here — synchronous setState in an effect is barred by lint).
  useEffect(() => {
    if (!open || !user) return
    let active = true
    notificationsList()
      .then((res) => {
        if (active) setItems(res?.items || [])
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [open, user])

  useEffect(() => {
    if (!open) return
    const handleOutsideClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    // Close on page scroll (non-capturing → the dropdown's own list scroll,
    // which doesn't bubble to window, keeps it open).
    const closeOnScroll = () => setOpen(false)
    document.addEventListener('mousedown', handleOutsideClick)
    window.addEventListener('scroll', closeOnScroll)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      window.removeEventListener('scroll', closeOnScroll)
    }
  }, [open])

  const toggle = () => {
    const next = !open
    if (next && user) setLoading(true)
    setOpen(next)
  }

  const markAll = () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnread(0)
    notificationsMarkAllRead().catch(() => {})
  }

  const markOne = (n) => {
    if (n.read) return
    setItems((prev) => prev.map((it) => (it.id === n.id ? { ...it, read: true } : it)))
    setUnread((u) => Math.max(0, u - 1))
    notificationsMarkRead(n.id).catch(() => {})
  }

  return (
    <div className="notif-wrap" ref={wrapRef}>
      <button aria-label={t('notifAria')} className="notif-btn" aria-expanded={open} onClick={toggle}>
        <Bell aria-hidden="true" strokeWidth={1.9} size={18} />
        {user && unread > 0 && <span className="notif-badge">{unread}</span>}
      </button>

      {open && (
        <div className="notif-menu">
          <div className="notif-head">
            <span className="notif-head-title">{t('notifTitle')}</span>
            {user && items.some((n) => !n.read) && (
              <button className="notif-markall" onClick={markAll}>
                {t('notifMarkAll')}
              </button>
            )}
          </div>
          <div className="notif-list">
            {!user ? (
              <p className="notif-empty">{t('notifSignedOut')}</p>
            ) : loading ? (
              <p className="notif-empty">{t('notifLoading')}</p>
            ) : items.length === 0 ? (
              <p className="notif-empty">{t('notifEmpty')}</p>
            ) : (
              items.map((n) => {
                const meta = TYPE_META[n.type] || FALLBACK
                const Icon = meta.Icon
                const body = t(meta.bodyKey, n.params || {})
                return (
                  <button
                    className={'notif-item' + (n.read ? '' : ' unread')}
                    onClick={() => markOne(n)}
                    type="button"
                    key={n.id}
                  >
                    <span style={{ '--row-accent': meta.accent }} className="notif-tile">
                      <Icon aria-hidden="true" strokeWidth={1.9} size={17} />
                    </span>
                    <span className="notif-item-text">
                      <span className="notif-item-title">{t(meta.titleKey)}</span>
                      {body && <span className="notif-item-body">{body}</span>}
                      <span className="notif-item-time">{relativeTime(n.createdAt, language)}</span>
                    </span>
                    {!n.read && <span className="notif-dot" aria-hidden="true" />}
                  </button>
                )
              })
            )}
          </div>
          <button onClick={() => setOpen(false)} className="notif-viewall">
            {t('notifViewAll')}
          </button>
        </div>
      )}
    </div>
  )
}
