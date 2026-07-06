import { useEffect, useMemo, useRef, useState } from 'react'
import CourseIcon from './CourseIcon'

const MAX_RESULTS = 30

export default function GlobalSearch({ courses, onSelectQuestion }) {
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
      .flatMap((c) => c.questions.map((q) => ({ ...q, courseId: c.id, courseTitle: c.title, courseEmoji: c.emoji })))
  }, [courses])

  const query = term.toLowerCase().trim()

  const results = useMemo(() => {
    if (!query) return []
    return index.filter((q) => (
      q.question.toLowerCase().includes(query)
      || q.answer.toLowerCase().includes(query)
      || (q.bonus && q.bonus.toLowerCase().includes(query))
    ))
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
        type="search"
        className="header-search-input"
        placeholder="Search all courses..."
        aria-label="Search across all courses"
        value={term}
        onChange={(e) => { setTerm(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false) }}
      />
      {open && query && (
        <div className="header-search-dropdown">
          {shown.length === 0 && <p className="empty">No questions match your search.</p>}
          {shown.map((q) => (
            <button
              key={q.courseId + ':' + q.id}
              className="global-search-result"
              onClick={() => pick(q.courseId, q.id)}
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
            <p className="global-search-more">Showing first {MAX_RESULTS} of {results.length} matches — refine your search.</p>
          )}
        </div>
      )}
    </div>
  )
}