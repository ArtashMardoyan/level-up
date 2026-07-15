import { useEffect, useState, useRef } from 'react'
import { Hexagon, Target, Flame, Bell } from 'lucide-react'

import { useLanguage } from '../hooks/useLanguage'

// UI-only notifications. Static seed data — wire to a real activity feed later.
const SEED = [
  {
    titleKey: 'notifStreakTitle',
    bodyKey: 'notifStreakBody',
    timeKey: 'notifStreakTime',
    accent: '#fbbf24',
    id: 'streak',
    Icon: Flame
  },
  {
    titleKey: 'notifDailyTitle',
    bodyKey: 'notifDailyBody',
    timeKey: 'notifDailyTime',
    accent: '#818cf8',
    Icon: Target,
    id: 'daily'
  },
  {
    titleKey: 'notifNewQuestionsTitle',
    bodyKey: 'notifNewQuestionsBody',
    timeKey: 'notifNewQuestionsTime',
    accent: '#4ade80',
    Icon: Hexagon,
    id: 'course'
  }
]

export default function NotificationBell() {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [readIds, setReadIds] = useState(() => new Set())
  const wrapRef = useRef(null)

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

  const unreadCount = SEED.filter((n) => !readIds.has(n.id)).length

  return (
    <div className="notif-wrap" ref={wrapRef}>
      <button onClick={() => setOpen((v) => !v)} aria-label={t('notifAria')} className="notif-btn" aria-expanded={open}>
        <Bell aria-hidden="true" strokeWidth={1.9} size={18} />
        {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
      </button>

      {open && (
        <div className="notif-menu">
          <div className="notif-head">
            <span className="notif-head-title">{t('notifTitle')}</span>
            <button onClick={() => setReadIds(new Set(SEED.map((n) => n.id)))} className="notif-markall">
              {t('notifMarkAll')}
            </button>
          </div>
          <div className="notif-list">
            {SEED.map((n) => {
              const unread = !readIds.has(n.id)
              const Icon = n.Icon
              return (
                <div className={'notif-item' + (unread ? ' unread' : '')} key={n.id}>
                  <span style={{ '--row-accent': n.accent }} className="notif-tile">
                    <Icon aria-hidden="true" strokeWidth={1.9} size={17} />
                  </span>
                  <div className="notif-item-text">
                    <div className="notif-item-title">{t(n.titleKey)}</div>
                    <div className="notif-item-body">{t(n.bodyKey)}</div>
                    <div className="notif-item-time">{t(n.timeKey)}</div>
                  </div>
                  {unread && <span className="notif-dot" aria-hidden="true" />}
                </div>
              )
            })}
          </div>
          <button onClick={() => setOpen(false)} className="notif-viewall">
            {t('notifViewAll')}
          </button>
        </div>
      )}
    </div>
  )
}
