import { useEffect, useState } from 'react'
import { MessageSquare, ChevronRight, ArrowRight, Sparkles, Target, Check, Plus, Bot, Zap } from 'lucide-react'

import CourseIcon from './CourseIcon'
import { useAuth } from '../hooks/useAuth'
import { scoreColor } from '../utils/interview'
import { useLanguage } from '../hooks/useLanguage'
import { interviewsInsights, interviewsList } from '../services/endpoints'

// Language codes match the interview setup's ENG/RUS/ARM labels (InterviewSetup.jsx).
const LANG_FLAG = { en: '🇺🇸', ru: '🇷🇺', hy: '🇦🇲' }
const LANG_LABEL = { en: 'ENG', ru: 'RUS', hy: 'ARM' }

// The three "how it works" steps (guest + new-user states).
function HowItWorks({ t }) {
  const steps = [
    { body: t('interviewHowStep1Body'), title: t('interviewHowStep1'), icon: <Sparkles size={18} /> },
    { icon: <MessageSquare size={18} />, body: t('interviewHowStep2Body'), title: t('interviewHowStep2') },
    { body: t('interviewHowStep3Body'), title: t('interviewHowStep3'), icon: <Check size={18} /> }
  ]
  return (
    <>
      <div className="aic-step-label">{t('interviewHowTitle')}</div>
      <div className="aic-howto">
        {steps.map((s, i) => (
          <div className="aic-howto-tile" key={i}>
            <span className="aic-howto-icon">{s.icon}</span>
            <div className="aic-howto-step">{s.title}</div>
            <p className="aic-howto-body">{s.body}</p>
          </div>
        ))}
      </div>
    </>
  )
}

function Hero({ children, body, t }) {
  return (
    <div className="aic-hero">
      <div className="aic-eyebrow">
        <Bot aria-hidden="true" size={14} /> {t('interviewCoachTitle')}
      </div>
      <h1 className="aic-title">{t('interviewHeroTitle')}</h1>
      <p className="aic-subtitle">{body}</p>
      <div className="aic-hero-actions">{children}</div>
    </div>
  )
}

export default function InterviewHome({
  onBrowseCourses,
  onRequireAuth,
  onOpenSession,
  onStartNew,
  onContinue,
  onHistory,
  courses
}) {
  const { language, t } = useLanguage()
  const { user } = useAuth()

  const [sessions, setSessions] = useState([])
  const [total, setTotal] = useState(0)
  const [insights, setInsights] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    if (!user) return
    let active = true
    Promise.all([interviewsList(1, 5), interviewsInsights().catch(() => null)])
      .then(([res, ins]) => {
        if (!active) return
        setSessions(res?.items || [])
        setTotal(res?.meta?.total || 0)
        setInsights(ins)
        setStatus('ready')
      })
      .catch(() => {
        if (active) setStatus('error')
      })
    return () => {
      active = false
    }
  }, [user])

  const courseFor = (s) => courses.find((c) => c.uuid === s.courseId || c.id === s.courseId) || null
  const fmtDate = (s) => {
    const raw = s.completedAt || s.createdAt
    try {
      return raw ? new Date(raw).toLocaleDateString(language, { day: 'numeric', month: 'short' }) : ''
    } catch {
      return ''
    }
  }

  // GUEST
  if (!user) {
    return (
      <main className="aic">
        <Hero body={t('interviewHeroGuestBody')} t={t}>
          <button className="aic-primary-btn" onClick={onRequireAuth} type="button">
            <Zap aria-hidden="true" size={16} /> {t('interviewHeroSignIn')}
          </button>
          <button className="aic-ghost-btn" onClick={onRequireAuth} type="button">
            {t('interviewHeroCreateAccount')}
          </button>
        </Hero>
        <HowItWorks t={t} />
      </main>
    )
  }

  if (status === 'loading') {
    return (
      <main className="aic">
        <div className="aic-loading">
          <div className="skeleton aic-skel-line" />
          <div className="skeleton aic-skel-block" />
          <div className="skeleton aic-skel-row" />
        </div>
      </main>
    )
  }

  // NEW USER (no sessions)
  if (total === 0) {
    return (
      <main className="aic">
        <Hero body={t('interviewHeroNewBody')} t={t}>
          <button className="aic-primary-btn" onClick={onStartNew} type="button">
            <Sparkles aria-hidden="true" size={16} /> {t('interviewHeroStartFirst')}
            <ArrowRight aria-hidden="true" size={15} />
          </button>
        </Hero>
        <HowItWorks t={t} />
      </main>
    )
  }

  // RETURNING USER
  const latest = sessions[0]
  const lastCompleted = sessions.find((s) => s.status === 'completed')
  const lastScore = lastCompleted?.overallScore
  const latestCourse = courseFor(latest)
  const trackLabel = latestCourse
    ? `${latestCourse.title} · ${t('difficulty_' + latest.difficulty)}`
    : t('difficulty_' + latest.difficulty)
  const recommended = courses.find((c) => c.questions?.length > 0) || null
  const focusTopics = (insights?.topics || []).slice(0, 3)
  const weakestSkill = insights?.rubric?.weakest

  return (
    <main className="aic">
      <div className="aic-dash-head">
        <div>
          <div className="aic-eyebrow">
            <Bot aria-hidden="true" size={14} /> {t('interviewCoachTitle')}
          </div>
          <h1 className="aic-title">{t('interviewWelcomeBack', { name: user.name || '' })}</h1>
          <p className="aic-subtitle">{t('interviewWelcomeBody')}</p>
        </div>
        <div className="aic-hero-actions">
          <button onClick={() => onContinue(latest.id)} className="aic-ghost-btn" type="button">
            <ArrowRight aria-hidden="true" size={15} /> {t('interviewContinue', { track: trackLabel })}
          </button>
          <button className="aic-primary-btn" onClick={onStartNew} type="button">
            <Plus aria-hidden="true" size={16} /> {t('interviewNew')}
          </button>
        </div>
      </div>

      <div className="aic-dashstats">
        <div className="aic-stat">
          <div className="aic-stat-label">{t('interviewStatLastScore')}</div>
          <div style={{ color: lastScore != null ? scoreColor(lastScore) : 'var(--text)' }} className="aic-stat-value">
            {lastScore != null ? lastScore : '—'}
            <span className="aic-stat-unit">/ 100</span>
          </div>
        </div>
        <div className="aic-stat">
          <div className="aic-stat-label">{t('interviewStatStreak')}</div>
          <div className="aic-stat-value">🔥 {user.currentStreak || 0}</div>
        </div>
        <div className="aic-stat">
          <div className="aic-stat-label">{t('interviewStatSessions')}</div>
          <div className="aic-stat-value">{total}</div>
        </div>
      </div>

      <div className="aic-two">
        <div className="aic-dash-card">
          <div className="aic-dash-card-label">{t('interviewContinuePracticing')}</div>
          <div className="aic-dash-card-title-row">
            <div className="aic-dash-card-title">{trackLabel}</div>
            <span className="aic-dash-card-lang">
              <span aria-hidden="true">{LANG_FLAG[latest.language] || '🌐'}</span>
              {LANG_LABEL[latest.language] || latest.language}
            </span>
          </div>
          <p className="aic-dash-card-body">{t('interviewContinueBody')}</p>
          <button onClick={() => onContinue(latest.id)} className="aic-primary-btn" type="button">
            {t('interviewResume')} <ArrowRight aria-hidden="true" size={15} />
          </button>
        </div>
        {recommended && (
          <div className="aic-dash-card">
            <div className="aic-dash-card-label">{t('interviewRecommended')}</div>
            <div style={{ '--aic-accent': recommended.accent || '#818cf8' }} className="aic-dash-rec">
              <span className="aic-dash-rec-icon">
                <CourseIcon courseId={recommended.id} emoji={recommended.emoji} size={20} />
              </span>
              <div>
                <div className="aic-dash-rec-title">{recommended.title}</div>
                <div className="aic-dash-rec-count">{t('questionsCount', { n: recommended.questions.length })}</div>
              </div>
            </div>
            <button className="aic-ghost-btn" onClick={onBrowseCourses} type="button">
              {t('interviewBrowseCourses')}
            </button>
          </div>
        )}
      </div>

      {focusTopics.length > 0 && (
        <div className="aic-focus">
          <div className="aic-focus-head">
            <span className="aic-focus-title">
              <Target aria-hidden="true" size={15} /> {t('interviewFocusTitle')}
            </span>
            {weakestSkill && (
              <span className="aic-focus-weakest">
                {t('interviewFocusWeakest', {
                  skill: t('skill' + weakestSkill.charAt(0).toUpperCase() + weakestSkill.slice(1))
                })}
              </span>
            )}
          </div>
          <p className="aic-focus-body">{t('interviewFocusBody')}</p>
          <div className="aic-focus-list">
            {focusTopics.map((tp) => (
              <div className="aic-focus-row" key={tp.courseSlug}>
                <span className="aic-focus-course">{tp.courseTitle}</span>
                <span className="aic-focus-bar">
                  <span
                    style={{ background: scoreColor(tp.avgScore), width: tp.avgScore + '%' }}
                    className="aic-focus-bar-fill"
                  />
                </span>
                <span style={{ color: scoreColor(tp.avgScore) }} className="aic-focus-score">
                  {tp.avgScore}
                </span>
              </div>
            ))}
          </div>
          <button className="aic-ghost-btn" onClick={onStartNew} type="button">
            {t('interviewFocusPractice')} <ArrowRight aria-hidden="true" size={15} />
          </button>
        </div>
      )}

      <div className="aic-recent">
        <div className="aic-recent-head">
          <span>{t('interviewRecentSessions')}</span>
          <button className="aic-recent-viewall" onClick={onHistory} type="button">
            {t('interviewViewAll')}
          </button>
        </div>
        {sessions.map((s) => {
          const c = courseFor(s)
          return (
            <button
              style={{ '--aic-accent': c?.accent || '#818cf8' }}
              onClick={() => onOpenSession(s.id)}
              className="aic-recent-row"
              type="button"
              key={s.id}
            >
              <span className="aic-recent-icon">
                <CourseIcon courseId={c?.id} emoji={c?.emoji} size={18} />
              </span>
              <div className="aic-recent-body">
                <div className="aic-recent-title">{t('interviewChatTitle', { course: c?.title || '' })}</div>
                <div className="aic-recent-meta aic-recent-meta-row">
                  <span>
                    {fmtDate(s)} · {t('difficulty_' + s.difficulty)}
                  </span>
                  <span className="aic-recent-lang">
                    <span aria-hidden="true">{LANG_FLAG[s.language] || '🌐'}</span>
                    {LANG_LABEL[s.language] || s.language}
                  </span>
                </div>
              </div>
              <span
                style={{ color: s.overallScore != null ? scoreColor(s.overallScore) : 'var(--text-3)' }}
                className="aic-recent-score"
              >
                {s.overallScore != null ? s.overallScore : '—'}
              </span>
              <ChevronRight className="aic-recent-chevron" aria-hidden="true" size={16} />
            </button>
          )
        })}
      </div>
    </main>
  )
}
