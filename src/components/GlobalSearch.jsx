import { useEffect, useState, useMemo, useRef } from 'react'

import CourseIcon from './CourseIcon'
import { useLanguage } from '../hooks/useLanguage'

const MAX_RESULTS = 30

export default function GlobalSearch({ onSelectQuestion, courses }) {
  const { t } = useLanguage()
  const [term, setTerm] = useState('')
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handleOutsideClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [open])

  const index = useMemo(() => {
    return courses
      .filter((c) => c.questions?.length > 0)
      .flatMap((c) => c.questions.map((q) => ({ ...q, courseTitle: c.title, courseEmoji: c.emoji, courseId: c.id })))
  }, [courses])

  const query = term.toLowerCase().trim()

  const results = useMemo(() => {
    if (!query) return []
    return index.filter(
      (q) =>
        q.question.toLowerCase().includes(query) ||
        q.answer.toLowerCase().includes(query) ||
        (q.bonus && q.bonus.toLowerCase().includes(query))
    )
  }, [index, query])

  const shown = results.slice(0, MAX_RESULTS)

  const pick = (courseId, questionId) => {
    setOpen(false)
    setTerm('')
    onSelectQuestion(courseId, questionId)
  }

  return (
    <div className="header-search" ref={wrapRef}>
      <input
        onChange={(e) => {
          setTerm(e.target.value)
          setOpen(true)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false)
        }}
        placeholder={t('globalSearchPlaceholder')}
        aria-label={t('globalSearchAria')}
        className="header-search-input"
        onFocus={() => setOpen(true)}
        type="search"
        value={term}
      />
      {open && query && (
        <div className="header-search-dropdown">
          {shown.length === 0 && <p className="empty">{t('noMatches')}</p>}
          {shown.map((q) => (
            <button
              onClick={() => pick(q.courseId, q.id)}
              className="global-search-result"
              key={q.courseId + ':' + q.id}
            >
              <div className="global-search-result-icon">
                <CourseIcon courseId={q.courseId} emoji={q.courseEmoji} />
              </div>
              <div className="global-search-result-text">
                <div className="global-search-result-course">{q.courseTitle}</div>
                <div className="global-search-result-question">{q.question}</div>
              </div>
            </button>
          ))}
          {results.length > MAX_RESULTS && (
            <p className="global-search-more">{t('showingFirst', { total: results.length, max: MAX_RESULTS })}</p>
          )}
        </div>
      )}
    </div>
  )
}
