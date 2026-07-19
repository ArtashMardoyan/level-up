import { useEffect, useState } from 'react'
import { ChevronRight, ArrowLeft, History, Plus } from 'lucide-react'

import CourseIcon from './CourseIcon'
import { useLanguage } from '../hooks/useLanguage'
import { interviewsList } from '../services/endpoints'

const PAGE_SIZE = 10
const LANG_FLAG = { en: '🇬🇧', ru: '🇷🇺', hy: '🇦🇲' }

function scoreColor(n) {
  if (n >= 85) return '#4ade80'
  if (n >= 70) return '#818cf8'
  if (n >= 50) return '#fbbf24'
  return '#fb7185'
}

export default function InterviewHistory({ courses, onOpen, onBack, onNew }) {
  const { language, t } = useLanguage()

  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('loading')
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    let active = true
    interviewsList(1, PAGE_SIZE)
      .then((res) => {
        if (!active) return
        setItems(res?.items || [])
        setTotal(res?.meta?.total || 0)
        setStatus('ready')
      })
      .catch(() => {
        if (active) setStatus('error')
      })
    return () => {
      active = false
    }
  }, [])

  const loadMore = () => {
    const next = page + 1
    setLoadingMore(true)
    interviewsList(next, PAGE_SIZE)
      .then((res) => {
        setItems((prev) => [...prev, ...(res?.items || [])])
        setPage(next)
        if (res?.meta?.total != null) setTotal(res.meta.total)
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false))
  }

  const courseFor = (session) => courses.find((c) => c.uuid === session.courseId || c.id === session.courseId) || null

  const fmtDate = (session) => {
    const raw = session.completedAt || session.createdAt
    if (!raw) return ''
    try {
      return new Date(raw).toLocaleDateString(language, { year: 'numeric', day: 'numeric', month: 'short' })
    } catch {
      return ''
    }
  }

  const hasMore = items.length < total

  return (
    <main className="aic">
      <div className="aic-setup-head">
        <div>
          <button className="profile-back" onClick={onBack} type="button">
            <ArrowLeft aria-hidden="true" size={16} /> {t('interviewBack')}
          </button>
          <h1 className="aic-title small">{t('interviewHistoryTitle')}</h1>
          <p className="aic-subtitle">{t('interviewHistorySubtitle')}</p>
        </div>
        <button className="aic-primary-btn" onClick={onNew} type="button">
          <Plus aria-hidden="true" size={16} /> {t('interviewNew')}
        </button>
      </div>

      {status === 'loading' && (
        <div className="aic-loading">
          <div className="skeleton aic-skel-row" />
          <div className="skeleton aic-skel-row" />
          <div className="skeleton aic-skel-row" />
        </div>
      )}

      {status === 'ready' && items.length === 0 && (
        <div className="aic-history-empty">
          <span className="aic-history-empty-icon">
            <History aria-hidden="true" size={28} />
          </span>
          <div className="aic-history-empty-title">{t('interviewHistoryEmptyTitle')}</div>
          <p>{t('interviewHistoryEmptyBody')}</p>
          <button className="aic-primary-btn" onClick={onNew} type="button">
            {t('interviewHistoryEmptyCta')}
          </button>
        </div>
      )}

      {status === 'ready' && items.length > 0 && (
        <div className="aic-history-list">
          {items.map((s) => {
            const c = courseFor(s)
            const score = s.overallScore
            return (
              <button
                style={{ '--aic-accent': c?.accent || '#818cf8' }}
                onClick={() => onOpen(s.id)}
                className="aic-history-row"
                type="button"
                key={s.id}
              >
                <span className="aic-history-icon">
                  <CourseIcon courseId={c?.id} emoji={c?.emoji} size={20} />
                </span>
                <span className="aic-history-body">
                  <span className="aic-history-title">{t('interviewChatTitle', { course: c?.title || '' })}</span>
                  <span className="aic-history-meta">
                    {LANG_FLAG[s.language] || '🌐'} {fmtDate(s)} · {t('difficulty_' + s.difficulty)} ·{' '}
                    {t('interviewQuestionsTotal', { n: s.questionCount })}
                    {s.status !== 'completed' ? ' · ' + t('interviewInProgress') : ''}
                  </span>
                </span>
                <span className="aic-history-score">
                  <span
                    style={{ color: score != null ? scoreColor(score) : 'var(--text-3)' }}
                    className="aic-history-score-num"
                  >
                    {score != null ? score : '—'}
                  </span>
                  <span className="aic-history-score-label">{t('interviewScoreLabel')}</span>
                </span>
                <ChevronRight className="aic-history-chevron" aria-hidden="true" size={18} />
              </button>
            )
          })}
          {hasMore && (
            <button className="aic-ghost-btn" disabled={loadingMore} onClick={loadMore} type="button">
              {loadingMore ? t('interviewLoading') : t('interviewLoadMore')}
            </button>
          )}
        </div>
      )}

      {status === 'error' && (
        <div className="profile-empty-state">
          <h1>{t('interviewErrorTitle')}</h1>
          <p>{t('interviewErrorBody')}</p>
        </div>
      )}
    </main>
  )
}
