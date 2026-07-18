import { useEffect, useState } from 'react'
import { TriangleAlert, ArrowLeft, RotateCw, Award, Check } from 'lucide-react'

import { useLanguage } from '../hooks/useLanguage'
import { interviewReport } from '../services/endpoints'

const RING_CIRCUMFERENCE = 339.29 // 2 * pi * 54

// Score band → color (also used for the per-question chips). Bands mirror the
// backend verdict thresholds (docs/interview/report.go).
function scoreColor(n) {
  if (n >= 85) return '#4ade80'
  if (n >= 70) return '#818cf8'
  if (n >= 50) return '#fbbf24'
  return '#fb7185'
}

export default function InterviewResults({ sessionId, course, onBack, onNew }) {
  const { t } = useLanguage()

  const [data, setData] = useState(null)
  const [status, setStatus] = useState('loading')
  const [showReview, setShowReview] = useState(false)

  useEffect(() => {
    let active = true
    interviewReport(sessionId)
      .then((d) => {
        if (!active) return
        setData(d)
        setStatus('ready')
      })
      .catch(() => {
        if (active) setStatus('error')
      })
    return () => {
      active = false
    }
  }, [sessionId])

  if (status === 'loading') {
    return (
      <main className="aic">
        <div className="aic-loading">
          <div className="skeleton aic-skel-line" />
          <div className="skeleton aic-skel-block" />
        </div>
      </main>
    )
  }

  if (status === 'error' || !data) {
    return (
      <main className="aic">
        <button className="profile-back" onClick={onBack} type="button">
          <ArrowLeft aria-hidden="true" size={16} /> {t('interviewBackResults')}
        </button>
        <div className="profile-empty-state">
          <h1>{t('interviewErrorTitle')}</h1>
          <p>{t('interviewErrorBody')}</p>
        </div>
      </main>
    )
  }

  const { report, review } = data
  const difficultyLabel = t('difficulty_' + data.session.difficulty)
  const courseTitle = course?.title || ''

  if (showReview) {
    return (
      <main className="aic">
        <button onClick={() => setShowReview(false)} className="profile-back" type="button">
          <ArrowLeft aria-hidden="true" size={16} /> {t('interviewBackResults')}
        </button>
        <h1 className="aic-title small">{t('interviewReviewTitle')}</h1>
        <p className="aic-subtitle">
          {courseTitle} · {difficultyLabel} · {t('interviewQuestionsTotal', { n: data.session.questionCount })}
        </p>
        <div className="aic-review-list">
          {review.map((r) => (
            <div className="aic-review-card" key={r.questionId}>
              <div className="aic-review-top">
                <span className="aic-review-num">{t('interviewQLabel', { n: r.index + 1 })}</span>
                <div className="aic-review-question">{r.question}</div>
                <span style={{ '--aic-score': scoreColor(r.score) }} className="aic-review-score">
                  {t('interviewScore', { n: r.score })}
                </span>
              </div>
              <div className="aic-review-label">{t('interviewYourAnswer')}</div>
              <div className="aic-review-answer">{r.skipped ? <em>{t('interviewSkipped')}</em> : r.userAnswer}</div>
              <div className="aic-review-cols">
                <div className="aic-review-col good">
                  <div className="aic-review-col-head">
                    <Check aria-hidden="true" size={13} /> {t('interviewStrengths')}
                  </div>
                  <ul>
                    {(r.strengths || []).map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div className="aic-review-col bad">
                  <div className="aic-review-col-head">
                    <TriangleAlert aria-hidden="true" size={13} /> {t('interviewToImprove')}
                  </div>
                  <ul>
                    {(r.weaknesses || []).map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="aic-review-label brand">{t('interviewModelAnswer')}</div>
              <div className="aic-review-model">{r.modelAnswer}</div>
            </div>
          ))}
        </div>
      </main>
    )
  }

  const rubric = [
    { label: t('interviewRubricCorrectness'), value: report.correctness },
    { label: t('interviewRubricDepth'), value: report.depth },
    { label: t('interviewRubricCommunication'), value: report.communication },
    { label: t('interviewRubricStructure'), value: report.structure }
  ]
  const dashoffset = RING_CIRCUMFERENCE * (1 - report.overallScore / 100)

  return (
    <main className="aic">
      <div className="aic-eyebrow">
        <Award aria-hidden="true" size={14} /> {t('interviewSessionComplete')}
      </div>
      <h1 className="aic-title">{t('interviewResultsTitle')}</h1>

      <div className="aic-results-summary">
        <div className="aic-score-card">
          <div className="aic-ring">
            <svg viewBox="0 0 120 120" height="140" width="140">
              <circle stroke="var(--border)" strokeWidth="10" fill="none" cx="60" cy="60" r="54" />
              <circle
                stroke={scoreColor(report.overallScore)}
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={dashoffset}
                strokeLinecap="round"
                strokeWidth="10"
                fill="none"
                cx="60"
                cy="60"
                r="54"
              />
            </svg>
            <div className="aic-ring-center">
              <span className="aic-ring-score">{report.overallScore}</span>
              <span className="aic-ring-outof">{t('interviewOutOf100')}</span>
            </div>
          </div>
          <div style={{ color: scoreColor(report.overallScore) }} className="aic-verdict">
            {report.verdict}
          </div>
          <div className="aic-verdict-sub">
            {courseTitle} · {difficultyLabel}
          </div>
        </div>

        <div className="aic-breakdown">
          <div className="aic-breakdown-title">{t('interviewBreakdown')}</div>
          {rubric.map((row) => (
            <div className="aic-breakdown-row" key={row.label}>
              <div className="aic-breakdown-label">
                <span>{row.label}</span>
                <span style={{ color: scoreColor(row.value) }}>{row.value}</span>
              </div>
              <div className="aic-breakdown-track">
                <div
                  style={{ background: scoreColor(row.value), width: row.value + '%' }}
                  className="aic-breakdown-fill"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="aic-lists">
        <div className="aic-list-card good">
          <div className="aic-list-head">{t('interviewWentWell')}</div>
          <ul>
            {(report.strengths || []).map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
        <div className="aic-list-card bad">
          <div className="aic-list-head">{t('interviewFocusAreas')}</div>
          <ul>
            {(report.weaknesses || []).map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="aic-recs">
        <div className="aic-list-head">{t('interviewNextSteps')}</div>
        <div className="aic-recs-list">
          {(report.recommendations || []).map((rec, i) => (
            <div className="aic-rec-row" key={i}>
              <span className="aic-rec-num">{i + 1}</span>
              <span>{rec}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="aic-results-actions">
        <button onClick={() => setShowReview(true)} className="aic-ghost-btn" type="button">
          {t('interviewReviewAll')}
        </button>
        <button className="aic-primary-btn" onClick={onNew} type="button">
          <RotateCw aria-hidden="true" size={16} /> {t('interviewNew')}
        </button>
      </div>
    </main>
  )
}
