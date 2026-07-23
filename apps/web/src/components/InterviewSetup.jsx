import { useState } from 'react'
import { ArrowRight, Sparkles, History, Clock, Check } from 'lucide-react'

import CourseIcon from './CourseIcon'
import { useLanguage } from '../hooks/useLanguage'
import { interviewsCreate } from '../services/endpoints'

const DIFFICULTIES = ['easy', 'medium', 'hard']
const COUNTS = [3, 5, 10]
// Interview language (ENG/RUS/ARM). Codes match the app locales / backend `hy`.
const LANGUAGES = [
  { label: 'ENG', flag: '🇺🇸', code: 'en' },
  { label: 'RUS', flag: '🇷🇺', code: 'ru' },
  { label: 'ARM', flag: '🇦🇲', code: 'hy' }
]

export default function InterviewSetup({ adaptive = false, initialCourseId, onHistory, onStarted, courses, onBack }) {
  const { language, t } = useLanguage()

  const available = courses.filter((c) => c.questions?.length > 0)
  // A "Practice weak areas" deep-link preselects the weakest course; otherwise the
  // candidate picks one (docs/product/interview/009).
  const [courseId, setCourseId] = useState(() =>
    initialCourseId && available.some((c) => c.id === initialCourseId) ? initialCourseId : null
  )
  const [difficulty, setDifficulty] = useState('medium')
  const [count, setCount] = useState(5)
  const [lang, setLang] = useState(['en', 'ru', 'hy'].includes(language) ? language : 'en')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const selected = available.find((c) => c.id === courseId) || null
  const accent = selected?.accent || '#818cf8'

  const start = () => {
    if (!selected || submitting) return
    setSubmitting(true)
    setError(null)
    interviewsCreate({ courseSlug: selected.id, questionCount: count, language: lang, difficulty, adaptive })
      .then((view) => onStarted(view.session.id))
      .catch((e) => {
        setError(e?.status === 409 ? t('interviewActiveError') : t('interviewStartError'))
        setSubmitting(false)
        setConfirmOpen(false)
      })
  }

  return (
    <main className="aic">
      <div className="aic-breadcrumb">
        <button onClick={onBack} type="button">
          Level Up
        </button>
        <span>/</span>
        <span>{t('interviewCoachTitle')}</span>
      </div>

      <div className="aic-eyebrow">
        <span className="aic-eyebrow-dot" /> {t('interviewNewSession')}
      </div>
      <h1 className="aic-title">{t('interviewSetupTitle')}</h1>
      <p className="aic-subtitle">{t('interviewSetupSubtitle')}</p>
      {adaptive && <p className="aic-focus-body">{t('interviewAdaptiveNote')}</p>}

      <div className="aic-step-label">{t('interviewStepCourse')}</div>
      <div className="aic-course-grid">
        {available.map((c) => (
          <button
            className={'aic-course-tile' + (c.id === courseId ? ' selected' : '')}
            style={{ '--aic-accent': c.accent || '#818cf8' }}
            onClick={() => setCourseId(c.id)}
            type="button"
            key={c.id}
          >
            <span className="aic-course-tile-icon">
              <CourseIcon courseId={c.id} emoji={c.emoji} size={20} />
            </span>
            <span className="aic-course-tile-title">{c.title}</span>
            <span className="aic-course-tile-count">{t('questionsCount', { n: c.questions.length })}</span>
          </button>
        ))}
      </div>

      <div className="aic-setup-grid">
        <div>
          <div className="aic-step-label">{t('interviewStepDifficulty')}</div>
          <div className="aic-seg">
            {DIFFICULTIES.map((d) => (
              <button
                className={'aic-seg-btn' + (d === difficulty ? ' active' : '')}
                onClick={() => setDifficulty(d)}
                type="button"
                key={d}
              >
                {t('difficulty_' + d)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="aic-step-label">{t('interviewStepCount')}</div>
          <div className="aic-seg">
            {COUNTS.map((n) => (
              <button
                className={'aic-seg-btn' + (n === count ? ' active' : '')}
                onClick={() => setCount(n)}
                type="button"
                key={n}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="aic-step-label">{t('interviewStepLanguage')}</div>
          <div className="aic-seg">
            {LANGUAGES.map((l) => (
              <button
                className={'aic-seg-btn aic-lang-btn' + (lang === l.code ? ' active' : '')}
                onClick={() => setLang(l.code)}
                type="button"
                key={l.code}
              >
                <span aria-hidden="true">{l.flag}</span> {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <div className="aic-error-note">{error}</div>}

      <div className="aic-setup-actions">
        <button onClick={() => setConfirmOpen(true)} className="aic-primary-btn" disabled={!selected} type="button">
          <Sparkles aria-hidden="true" size={18} /> {t('interviewStart')}
        </button>
        <button className="aic-ghost-btn" onClick={onHistory} type="button">
          <History aria-hidden="true" size={16} /> {t('interviewHistory')}
        </button>
        <span className="aic-hint">
          {selected
            ? t('interviewSetupSummary', {
                difficulty: t('difficulty_' + difficulty).toLowerCase(),
                lang: LANGUAGES.find((l) => l.code === lang)?.label,
                course: selected.title,
                n: count
              })
            : t('interviewPickCourseHint')}
        </span>
      </div>

      {confirmOpen && (
        <div onMouseDown={() => !submitting && setConfirmOpen(false)} className="aic-modal-overlay">
          <div onMouseDown={(e) => e.stopPropagation()} style={{ '--aic-accent': accent }} className="aic-modal">
            <div className="aic-modal-icon">
              <CourseIcon courseId={selected.id} emoji={selected.emoji} size={22} />
            </div>
            <h2 className="aic-modal-title">{t('interviewConfirmTitle')}</h2>
            <p className="aic-modal-body">
              {t('interviewConfirmBody', {
                difficulty: t('difficulty_' + difficulty),
                course: selected.title,
                n: count
              })}
            </p>
            <ul className="aic-modal-list">
              <li>
                <Clock aria-hidden="true" size={16} /> {t('interviewConfirmNoTimer')}
              </li>
              <li>
                <Check aria-hidden="true" size={16} /> {t('interviewConfirmFeedback')}
              </li>
              <li>
                <Sparkles aria-hidden="true" size={16} /> {t('interviewConfirmScore')}
              </li>
            </ul>
            <div className="aic-modal-actions">
              <button
                onClick={() => setConfirmOpen(false)}
                className="aic-ghost-btn"
                disabled={submitting}
                type="button"
              >
                {t('interviewCancel')}
              </button>
              <button className="aic-primary-btn" disabled={submitting} onClick={start} type="button">
                {submitting ? t('interviewStarting') : t('interviewBegin')}
                <ArrowRight aria-hidden="true" size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
