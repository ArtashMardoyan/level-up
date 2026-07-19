import { useEffect, useState } from 'react'
import { ChevronRight, TrendingUp, ArrowLeft, History, LogOut, Trophy, Pencil, Trash2, Flame, Star } from 'lucide-react'

import CourseIcon from './CourseIcon'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../hooks/useLanguage'
import EditProfileDialog from './EditProfileDialog'
import { notificationMeta, relativeTime } from '../data/notifications'
import {
  notificationsList,
  interviewsSummary,
  progressSummary,
  interviewsList,
  usersDelete
} from '../services/endpoints'

// Language codes match the interview setup's ENG/RUS/ARM labels (InterviewSetup.jsx).
const IV_LANG_FLAG = { en: '🇬🇧', ru: '🇷🇺', hy: '🇦🇲' }
const IV_LANG_LABEL = { en: 'ENG', ru: 'RUS', hy: 'ARM' }

function ivScoreColor(n) {
  if (n >= 85) return '#4ade80'
  if (n >= 70) return '#818cf8'
  if (n >= 50) return '#fbbf24'
  return '#fb7185'
}

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
  const [ivSummary, setIvSummary] = useState(null)
  const [ivRecent, setIvRecent] = useState([])
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)

  // Load stats + the recent-activity feed together. `loading` starts true and is
  // flipped off in the async callback (synchronous setState-in-effect is barred).
  useEffect(() => {
    if (!user) return
    let active = true
    Promise.all([
      progressSummary().catch(() => null),
      notificationsList(1, 5).catch(() => null),
      interviewsSummary().catch(() => null),
      interviewsList(1, 3).catch(() => null)
    ])
      .then(([summ, notifs, ivSumm, ivList]) => {
        if (!active) return
        if (summ) setSummary(summ)
        if (notifs) setActivity(notifs.items || [])
        if (ivSumm) setIvSummary(ivSumm)
        if (ivList) setIvRecent(ivList.items || [])
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
  const streak = summary?.currentStreak || 0
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

  const achievements = earnedAchievements(reviewed, saved, streak, t)

  const ivTotal = ivSummary?.totalCompleted || 0
  const ivAvg = ivSummary?.avgScore || 0
  const ivBest = ivSummary?.bestScore || 0
  const ivLast = ivSummary?.lastSession || null
  const ivCourseFor = (courseId) => courses.find((c) => c.uuid === courseId || c.id === courseId) || null
  const ivFmtDate = (session) => {
    const raw = session.completedAt || session.createdAt
    if (!raw) return ''
    try {
      return new Date(raw).toLocaleDateString(language, { day: 'numeric', month: 'short' })
    } catch {
      return ''
    }
  }

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
          <span className="profile-stat-value">{loading ? '—' : streak}</span>
          <span className="profile-stat-label">{t('profileStatStreakLabel')}</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat-icon indigo">
            <History aria-hidden="true" size={20} />
          </span>
          <span className="profile-stat-value">{loading ? '—' : ivTotal}</span>
          <span className="profile-stat-label">{t('profileStatInterviewsLabel')}</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat-icon green">
            <TrendingUp aria-hidden="true" size={20} />
          </span>
          <span style={loading ? undefined : { color: ivScoreColor(ivAvg) }} className="profile-stat-value">
            {loading ? '—' : ivAvg}
          </span>
          <span className="profile-stat-label">{t('profileStatAvgScoreLabel')}</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat-icon amber">
            <Trophy aria-hidden="true" size={20} />
          </span>
          <span style={loading ? undefined : { color: ivScoreColor(ivBest) }} className="profile-stat-value">
            {loading ? '—' : ivBest}
          </span>
          <span className="profile-stat-label">{t('profileStatBestScoreLabel')}</span>
        </div>
      </section>

      {/* Interview performance */}
      <section className="profile-card">
        <div className="profile-card-head">
          <h2 className="profile-card-title">{t('profileIvPerformance')}</h2>
          <button onClick={() => onNavigate('interview', 'history')} className="profile-seeall" type="button">
            {t('profileSeeAll')}
          </button>
        </div>
        {loading ? (
          <div className="profile-progress-list">
            {[0, 1, 2].map((i) => (
              <span className="skeleton profile-progress-skel" key={i} />
            ))}
          </div>
        ) : ivLast ? (
          <>
            <div className="profile-iv-latest">
              <div style={{ color: ivScoreColor(ivLast.overallScore) }} className="profile-iv-latest-score">
                {ivLast.overallScore}
              </div>
              <div className="profile-iv-latest-info">
                <div className="profile-iv-latest-label">{t('profileIvLatestLabel')}</div>
                <div className="profile-iv-latest-track">
                  <span className="profile-iv-latest-title">
                    {ivCourseFor(ivLast.courseId)?.title || ''} · {t('difficulty_' + ivLast.difficulty)}
                  </span>
                  <span className="profile-iv-lang">
                    <span aria-hidden="true">{IV_LANG_FLAG[ivLast.language] || '🌐'}</span>
                    {IV_LANG_LABEL[ivLast.language] || ivLast.language}
                  </span>
                </div>
              </div>
            </div>
            <div>
              {ivRecent.map((s) => {
                const c = ivCourseFor(s.courseId)
                return (
                  <button
                    style={{ '--aic-accent': c?.accent || '#818cf8' }}
                    onClick={() => onNavigate('interview', s.id)}
                    className="aic-recent-row"
                    type="button"
                    key={s.id}
                  >
                    <span className="aic-recent-icon">
                      <CourseIcon courseId={c?.id} emoji={c?.emoji} size={18} />
                    </span>
                    <div className="aic-recent-body">
                      <div className="aic-recent-title">{c?.title || ''}</div>
                      <div className="aic-recent-meta aic-recent-meta-row">
                        <span>{ivFmtDate(s)}</span>
                        <span className="aic-recent-lang">
                          <span aria-hidden="true">{IV_LANG_FLAG[s.language] || '🌐'}</span>
                          {IV_LANG_LABEL[s.language] || s.language}
                        </span>
                      </div>
                    </div>
                    <span
                      style={{ color: s.overallScore != null ? ivScoreColor(s.overallScore) : 'var(--text-3)' }}
                      className="aic-recent-score"
                    >
                      {s.overallScore != null ? s.overallScore : '—'}
                    </span>
                    <ChevronRight className="aic-recent-chevron" aria-hidden="true" size={16} />
                  </button>
                )
              })}
            </div>
          </>
        ) : (
          <p className="profile-empty">{t('profileNoInterviews')}</p>
        )}
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
