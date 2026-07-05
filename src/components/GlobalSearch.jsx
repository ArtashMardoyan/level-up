import { useMemo } from 'react'
import CourseIcon from './CourseIcon'

const MAX_RESULTS = 30

export default function GlobalSearch({ courses, term, onTermChange, onSelectQuestion }) {
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

  return (
    <div className="global-search">
      <input
        type="text"
        className="search-box"
        placeholder="Search across all courses... e.g. redis, hooks, kubernetes"
        value={term}
        onChange={(e) => onTermChange(e.target.value)}
      />
      {query && (
        <div className="global-search-results">
          {shown.length === 0 && <p className="empty">No questions match your search.</p>}
          {shown.map((q) => (
            <button
              key={q.courseId + ':' + q.id}
              className="global-search-result"
              onClick={() => onSelectQuestion(q.courseId, q.id)}
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
