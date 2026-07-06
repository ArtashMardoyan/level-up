import { useMemo, useState } from 'react'
import { useReviewState } from '../hooks/useReviewState'
import ProgressBar from './ProgressBar'
import ModeBar from './ModeBar'
import QuestionCard from './QuestionCard'
import InterviewMode from './InterviewMode'
import CoursePlayer from './CoursePlayer'
import CourseIcon from './CourseIcon'

export default function PrepView({ course, voices, voiceName, jumpToId }) {
  const questions = course.questions
  const { state, toggleFavorite, markReviewed } = useReviewState(course.id)
  const [search, setSearch] = useState('')
  const [mode, setMode] = useState('list')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [allOpen, setAllOpen] = useState(false)
  const [collapsedModules, setCollapsedModules] = useState(() => new Set())
  const [playerActive, setPlayerActive] = useState(false)
  const [playerStartRequest, setPlayerStartRequest] = useState(null)

  const playQuestionInPlayer = (id) => {
    setPlayerStartRequest({ id })
    setPlayerActive(true)
  }

  const toggleModule = (moduleName) => {
    setCollapsedModules((prev) => {
      const next = new Set(prev)
      if (next.has(moduleName)) next.delete(moduleName)
      else next.add(moduleName)
      return next
    })
  }

  const term = search.toLowerCase().trim()

  const filtered = useMemo(() => {
    return questions.filter((item) => {
      const matches = !term
        || item.question.toLowerCase().includes(term)
        || item.answer.toLowerCase().includes(term)
        || (item.bonus && item.bonus.toLowerCase().includes(term))
      if (!matches) return false
      if (favoritesOnly && !state.favorites.includes(item.id)) return false
      return true
    })
  }, [questions, term, favoritesOnly, state.favorites])

  const showModuleLabels = !term

  const hintText = mode === 'quiz'
    ? 'Tap question, then "Show answer" to test yourself'
    : 'Tap any question to reveal the answer'

  let lastModule = null

  return (
    <div className="wrap">
      <div className="page-title-row">
        <div className="page-title-icon"><CourseIcon courseId={course.id} emoji={course.emoji} /></div>
        <div>
          <h1>{course.title}</h1>
          <div className="subtitle">{course.subtitle} &middot; {questions.length} questions</div>
        </div>
      </div>

      <ProgressBar done={state.reviewed.length} total={questions.length} />

      <input
        type="text"
        className="search-box"
        placeholder="Search... e.g. redis, jwt, stripe, pagination"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <ModeBar
        mode={mode}
        onModeChange={setMode}
        favoritesOnly={favoritesOnly}
        onToggleFavorites={() => setFavoritesOnly((v) => !v)}
        playerActive={playerActive}
        onTogglePlayer={() => setPlayerActive((v) => !v)}
      />

      {mode === 'interview' ? (
        <InterviewMode questions={questions} />
      ) : (
        <>
          <div className="controls">
            <span>{hintText}</span>
            <div className="controls-right">
              <button className="plain-btn" onClick={() => setAllOpen((v) => !v)}>
                {allOpen ? 'Collapse all' : 'Expand all'}
              </button>
            </div>
          </div>

          <div>
            {filtered.length === 0 && <p className="empty">No questions match your search.</p>}
            {filtered.map((item) => {
              const showLabel = showModuleLabels && item.module !== lastModule
              lastModule = item.module
              const isCollapsed = showModuleLabels && collapsedModules.has(item.module)
              return (
                <div key={item.id}>
                  {showLabel && (
                    <button className="module-label" onClick={() => toggleModule(item.module)}>
                      {item.module}
                      <span className={'arrow' + (isCollapsed ? '' : ' open')}>&#9662;</span>
                    </button>
                  )}
                  {!isCollapsed && (
                    <QuestionCard
                      item={item}
                      isFavorite={state.favorites.includes(item.id)}
                      isReviewed={state.reviewed.includes(item.id)}
                      quizMode={mode === 'quiz'}
                      forceOpen={allOpen}
                      onToggleFavorite={toggleFavorite}
                      onOpen={markReviewed}
                      onPlay={playQuestionInPlayer}
                      autoOpen={item.id === jumpToId}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      <footer>Made for interview practice &middot; works fully offline</footer>

      {playerActive && (
        <CoursePlayer
          questions={questions}
          voices={voices}
          voiceName={voiceName}
          onClose={() => setPlayerActive(false)}
          startRequest={playerStartRequest}
        />
      )}
    </div>
  )
}
