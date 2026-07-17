import { useEffect, useState } from 'react'
import { CheckCircle2, ArrowLeft, LogOut, Trophy, Pencil, Trash2, Flame, Star } from 'lucide-react'

import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../hooks/useLanguage'
import EditProfileDialog from './EditProfileDialog'
import { notificationMeta, relativeTime } from '../data/notifications'
import { notificationsList, progressSummary, usersDelete } from '../services/endpoints'

// Placeholder streak until a backend endpoint exists for it (mirrors AccountMenu).
const DEMO_STREAK = 5

// Achievements are derived from the real reviewed/saved/streak numbers — each
// entry unlocks once its threshold is met, so the row only ever shows earned badges.
function earnedAchievements(reviewed, saved, streak, t) {
  const all = [
    { label: t('profileAchFirstReview'), unlocked: reviewed >= 1, key: 'first-review', color: '#4ade80' },
    { label: t('profileAchTenReviews'), unlocked: reviewed >= 10, key: 'ten-reviews', color: '#38bdf8' },
    { label: t('profileAchFiftyReviews'), unlocked: reviewed >= 50, key: 'fifty-reviews', color: '#818cf8' },
    { label: t('profileAchFirstSaved'), unlocked: saved >= 1, key: 'first-save', color: '#fbbf24' },
    { label: t('profileAchCollector'), unlocked: saved >= 10, key: 'collector', color: '#c084fc' },
    { label: t('profileAchStreak', { n: streak }), unlocked: streak >= 5, color: '#fb7185', key: 'streak' }
  ]

  return all.filter((a) => a.unlocked)
}

export default function ProfilePage({ onNavigate, courses }) {
  const { updateUser, logout, user } = useAuth()
  const { language, t } = useLanguage()
  const [summary, setSummary] = useState(null)
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)

  // Load stats + the recent-activity feed together. `loading` starts true and is
  // flipped off in the async callback (synchronous setState-in-effect is barred).
  useEffect(() => {
    if (!user) return
    let active = true
    Promise.all([progressSummary().catch(() => null), notificationsList(1, 5).catch(() => null)])
      .then(([summ, notifs]) => {
        if (!active) return
        if (summ) setSummary(summ)
        if (notifs) setActivity(notifs.items || [])
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [user])

  const backHome = () => onNavigate(null)

  if (!user) {
    return (
      <main className="profile-page">
        <button className="profile-back" onClick={backHome} type="button">
          <ArrowLeft aria-hidden="true" size={16} /> {t('profileBack')}
        </button>
        <div className="profile-empty-state">
          <h1>{t('profileSignedOutTitle')}</h1>
          <p>{t('profileSignedOutBody')}</p>
        </div>
      </main>
    )
  }

  const displayName = user.name || ''
  const initial = displayName.charAt(0).toUpperCase()
  const reviewed = summary?.totalReviewed || 0
  const saved = summary?.totalFavorites || 0
  const byCourse = summary?.byCourse || {}

  const withQuestions = courses.filter((c) => c.questions?.length > 0)
  const progressRows = withQuestions
    .map((c) => ({ reviewed: byCourse[c.uuid]?.reviewed || 0, total: c.questions.length, course: c }))
    .filter((row) => row.reviewed > 0)
    .sort((a, b) => b.reviewed - a.reviewed)
  const savedRows = withQuestions
    .map((c) => ({ saved: byCourse[c.uuid]?.favorites || 0, course: c }))
    .filter((row) => row.saved > 0)
    .sort((a, b) => b.saved - a.saved)

  const achievements = earnedAchievements(reviewed, saved, DEMO_STREAK, t)

  const onDelete = () => {
    if (!window.confirm(t('profileDeleteConfirm'))) return
    usersDelete()
      .catch(() => {})
      .finally(() => {
        logout()
        backHome()
      })
  }

  const signOut = () => {
    logout()
    backHome()
  }

  return (
    <main className="profile-page">
      <button className="profile-back" onClick={backHome} type="button">
        <ArrowLeft aria-hidden="true" size={16} /> {t('profileBack')}
      </button>

      {/* Identity */}
      <section className="profile-identity">
        <span className="profile-identity-glow" aria-hidden="true" />
        <span className="profile-avatar">{initial}</span>
        <div className="profile-identity-body">
          <h1 className="profile-name">{displayName}</h1>
          <div className="profile-meta">
            {user.track ? (
              <span className="profile-track-pill">{user.track}</span>
            ) : (
              <span className="profile-track-pill muted">{t('profileNoTrack')}</span>
            )}
            <span className="profile-email">{user.email}</span>
          </div>
          <p className={'profile-bio' + (user.bio ? '' : ' muted')}>{user.bio || t('profileNoBio')}</p>
        </div>
        <button onClick={() => setEditOpen(true)} className="profile-edit-btn" type="button">
          <Pencil aria-hidden="true" size={15} /> {t('profileEditBtn')}
        </button>
      </section>

      {/* Stats */}
      <section className="profile-stats">
        <div className="profile-stat">
          <span className="profile-stat-icon amber">
            <Flame aria-hidden="true" size={20} />
          </span>
          <span className="profile-stat-value">{DEMO_STREAK}</span>
          <span className="profile-stat-label">{t('profileStatStreakLabel')}</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat-icon green">
            <CheckCircle2 aria-hidden="true" size={20} />
          </span>
          <span className="profile-stat-value">{loading ? '—' : reviewed}</span>
          <span className="profile-stat-label">{t('profileStatReviewedLabel')}</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat-icon indigo">
            <Star aria-hidden="true" size={20} />
          </span>
          <span className="profile-stat-value">{loading ? '—' : saved}</span>
          <span className="profile-stat-label">{t('profileStatSavedLabel')}</span>
        </div>
      </section>

      {/* Course progress + Recent activity */}
      <div className="profile-grid">
        <section className="profile-card">
          <h2 className="profile-card-title">{t('profileCourseProgress')}</h2>
          {loading ? (
            <div className="profile-progress-list">
              {[0, 1, 2].map((i) => (
                <span className="skeleton profile-progress-skel" key={i} />
              ))}
            </div>
          ) : progressRows.length ? (
            <div className="profile-progress-list">
              {progressRows.map(({ reviewed: done, course, total }) => (
                <div
                  style={{ '--page-accent': course.accent || '#818cf8' }}
                  className="profile-progress-row"
                  key={course.id}
                >
                  <div className="profile-progress-head">
                    <span className="profile-progress-name">{course.title}</span>
                    <span className="profile-progress-count">
                      {done} / {total}
                    </span>
                  </div>
                  <div className="progress-bar-bg">
                    <div style={{ width: Math.round((done / total) * 100) + '%' }} className="progress-bar-fill" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="profile-empty">{t('profileNoProgress')}</p>
          )}
        </section>

        <section className="profile-card">
          <div className="profile-card-head">
            <h2 className="profile-card-title">{t('profileRecentActivity')}</h2>
            <button onClick={() => onNavigate('activity')} className="profile-seeall" type="button">
              {t('profileSeeAll')}
            </button>
          </div>
          {loading ? (
            <div className="profile-progress-list">
              {[0, 1, 2].map((i) => (
                <span className="skeleton profile-progress-skel" key={i} />
              ))}
            </div>
          ) : activity.length ? (
            <div className="profile-activity-list">
              {activity.map((n) => {
                const meta = notificationMeta(n.type)
                const Icon = meta.Icon
                return (
                  <div className="profile-activity-row" key={n.id}>
                    <span style={{ '--card-accent': meta.accent }} className="profile-activity-icon">
                      <Icon aria-hidden="true" size={17} />
                    </span>
                    <span className="profile-activity-body">
                      <span className="profile-activity-text">{t(meta.titleKey)}</span>
                      <span className="profile-activity-time">{relativeTime(n.createdAt, language)}</span>
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="profile-empty">{t('profileNoActivity')}</p>
          )}
        </section>
      </div>

      {/* Saved questions (real per-course favorite counts) */}
      <section className="profile-card">
        <h2 className="profile-card-title">{t('profileSavedQuestions')}</h2>
        {loading ? (
          <div className="profile-progress-list">
            {[0, 1].map((i) => (
              <span className="skeleton profile-progress-skel" key={i} />
            ))}
          </div>
        ) : savedRows.length ? (
          <ul className="profile-saved-list">
            {savedRows.map(({ saved: count, course }) => (
              <li className="profile-saved-row" key={course.id}>
                <Star className="profile-saved-star" aria-hidden="true" size={16} />
                <span className="profile-saved-title">{course.title}</span>
                <span className="profile-saved-count">{t('profileSavedCount', { n: count })}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="profile-empty">{t('profileNoSaved')}</p>
        )}
      </section>

      {/* Achievements */}
      <section className="profile-card">
        <h2 className="profile-card-title">{t('profileAchievements')}</h2>
        {achievements.length ? (
          <div className="profile-badges">
            {achievements.map((a) => (
              <span style={{ '--badge-accent': a.color }} className="profile-badge" key={a.key}>
                <Trophy aria-hidden="true" size={14} /> {a.label}
              </span>
            ))}
          </div>
        ) : (
          <p className="profile-empty">{t('profileNoAchievements')}</p>
        )}
      </section>

      {/* Danger zone */}
      <section className="profile-danger">
        <div className="profile-danger-head">
          <h2 className="profile-card-title">{t('profileDangerZone')}</h2>
          <p className="profile-danger-hint">{t('profileDangerHint')}</p>
        </div>
        <div className="profile-danger-actions">
          <button className="profile-signout-btn" onClick={signOut} type="button">
            <LogOut aria-hidden="true" size={16} /> {t('accountSignOut')}
          </button>
          <button className="profile-delete-btn" onClick={onDelete} type="button">
            <Trash2 aria-hidden="true" size={16} /> {t('profileDeleteAccount')}
          </button>
        </div>
      </section>

      <EditProfileDialog onClose={() => setEditOpen(false)} onSaved={updateUser} open={editOpen} user={user} />
    </main>
  )
}
