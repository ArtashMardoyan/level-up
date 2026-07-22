import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'

import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../hooks/useLanguage'
import { notificationMeta, relativeTime } from '../data/notifications'
import {
  notificationsMarkAllSeen,
  notificationsMarkAllRead,
  notificationsMarkRead,
  notificationsList
} from '../services/endpoints'

const PAGE_SIZE = 15

export default function ActivityPage({ onNavigate }) {
  const { language, t } = useLanguage()
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  // First page + mark everything seen (opening the screen counts as seen).
  // `loading` starts true and flips off in the async callback (synchronous
  // setState in an effect is barred by lint).
  useEffect(() => {
    if (!user) return
    let active = true
    notificationsMarkAllSeen().catch(() => {})
    notificationsList(1, PAGE_SIZE)
      .then((res) => {
        if (!active) return
        setItems(res?.items || [])
        setTotal(res?.meta?.total || 0)
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [user])

  const backHome = () => onNavigate('interview')

  const loadMore = () => {
    const next = page + 1
    setLoadingMore(true)
    notificationsList(next, PAGE_SIZE)
      .then((res) => {
        setItems((prev) => [...prev, ...(res?.items || [])])
        setPage(next)
        if (res?.meta?.total != null) setTotal(res.meta.total)
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false))
  }

  const markAll = () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
    notificationsMarkAllRead().catch(() => {})
  }

  const markOne = (n) => {
    if (n.read) return
    setItems((prev) => prev.map((it) => (it.id === n.id ? { ...it, read: true } : it)))
    notificationsMarkRead(n.id).catch(() => {})
  }

  const hasMore = items.length < total
  const hasUnread = items.some((n) => !n.read)

  return (
    <main className="activity-page">
      <button className="profile-back" onClick={backHome} type="button">
        <ArrowLeft aria-hidden="true" size={16} /> {t('profileBack')}
      </button>

      <div className="activity-head">
        <h1 className="activity-title">{t('activityTitle')}</h1>
        {user && hasUnread && (
          <button className="notif-markall" onClick={markAll} type="button">
            {t('notifMarkAll')}
          </button>
        )}
      </div>

      {!user ? (
        <p className="profile-empty">{t('notifSignedOut')}</p>
      ) : loading ? (
        <div className="activity-list">
          {[0, 1, 2, 3, 4].map((i) => (
            <span className="skeleton activity-skel" key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="profile-empty">{t('activityEmpty')}</p>
      ) : (
        <>
          <div className="activity-list">
            {items.map((n) => {
              const meta = notificationMeta(n.type)
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
            })}
          </div>
          {hasMore && (
            <button className="activity-more" disabled={loadingMore} onClick={loadMore} type="button">
              {loadingMore ? t('notifLoading') : t('activityLoadMore')}
            </button>
          )}
        </>
      )}
    </main>
  )
}
