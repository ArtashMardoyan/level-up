import { useState, useMemo } from 'react'
import { ChevronDown } from 'lucide-react'

import ModeBar from './ModeBar'
import CourseIcon from './CourseIcon'
import ProgressBar from './ProgressBar'
import QuestionCard from './QuestionCard'
import CoursePlayer from './CoursePlayer'
import PageSwitcher from './PageSwitcher'
import { scoreMatch } from '../utils/fuzzy'
import { useLanguage } from '../hooks/useLanguage'
import { useReviewState } from '../hooks/useReviewState'

export default function PrepView({ onNavigate, jumpToId, courses, course, voices }) {
  const { t } = useLanguage()
  const questions = course.questions
  const crumbItems = useMemo(
    () =>
      courses
        .filter((c) => c.questions.length > 0)
        .map((c) => ({ icon: <CourseIcon courseId={c.id} emoji={c.emoji} />, label: c.title, id: c.id })),
    [courses]
  )
  const { markManyReviewed, toggleFavorite, markReviewed, state } = useReviewState(course.id, questions)
  const [search, setSearch] = useState('')
  const [mode, setMode] = useState('list')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [allOpen, setAllOpen] = useState(false)
  const [collapsedModules, setCollapsedModules] = useState(() => new Set())
  const [playerActive, setPlayerActive] = useState(false)
  const [playerStartRequest, setPlayerStartRequest] = useState(null)
  const [playerActiveId, setPlayerActiveId] = useState(null)

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

  const term = search.trim()

  // Each entry is { item, ranges } — ranges highlight the matched question text.
  // Fuzzy-match on the question (highlightable) with an answer/bonus substring
  // fallback; sort best-first while searching, keep source order otherwise.
  const filtered = useMemo(() => {
    const pool = favoritesOnly ? questions.filter((item) => state.favorites.includes(item.id)) : questions
    if (!term) return pool.map((item) => ({ ranges: [], item }))
    return pool
      .map((item) => {
        const m = scoreMatch(term, item.question, item.answer + ' ' + (item.bonus || ''))
        return m ? { ranges: m.ranges, score: m.score, item } : null
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
  }, [questions, term, favoritesOnly, state.favorites])

  const toggleAllOpen = () => {
    const next = !allOpen
    setAllOpen(next)
    // Opening every card counts as reviewing them (QuestionCard only reports
    // opens the user makes directly). One batched update instead of N.
    if (next) markManyReviewed(filtered.map((f) => f.item.id))
  }

  const showModuleLabels = !term

  const hintText = mode === 'quiz' ? t('hintQuiz') : t('hintList')

  return (
    <div style={{ '--page-accent': course.accent || '#818cf8' }} className="wrap">
      <PageSwitcher
        subtitle={
          <>
            {course.subtitle} &middot; {t('questionsCount', { n: questions.length })}
          </>
        }
        icon={<CourseIcon courseId={course.id} emoji={course.emoji} />}
        onBack={() => onNavigate('interview')}
        onSelect={(id) => onNavigate(id)}
        backLabel={t('tabCourses')}
        currentId={course.id}
        title={course.title}
        items={crumbItems}
      />

      <ProgressBar done={state.reviewed.length} total={questions.length} />

      <input
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t('searchPlaceholder')}
        className="search-box"
        value={search}
        type="text"
      />

      <ModeBar
        onToggleFavorites={() => setFavoritesOnly((v) => !v)}
        onTogglePlayer={() => setPlayerActive((v) => !v)}
        favoritesOnly={favoritesOnly}
        playerActive={playerActive}
        onModeChange={setMode}
        mode={mode}
      />

      <div className="controls">
        <span>{hintText}</span>
        <div className="controls-right">
          <button onClick={toggleAllOpen} className="plain-btn">
            {allOpen ? t('collapseAll') : t('expandAll')}
          </button>
        </div>
      </div>

      <div>
        {filtered.length === 0 && <p className="empty">{t('noMatches')}</p>}
        {filtered.map(({ item }, index) => {
          const showLabel = showModuleLabels && item.module !== filtered[index - 1]?.item.module
          const isCollapsed = showModuleLabels && collapsedModules.has(item.module)
          return (
            <div key={item.id}>
              {showLabel && (
                <button onClick={() => toggleModule(item.module)} className="module-label">
                  {item.module}
                  <ChevronDown className={'arrow' + (isCollapsed ? '' : ' open')} aria-hidden="true" size={14} />
                </button>
              )}
              {!isCollapsed && (
                <QuestionCard
                  autoOpen={item.id === jumpToId || item.id === playerActiveId}
                  isFavorite={state.favorites.includes(item.id)}
                  isReviewed={state.reviewed.includes(item.id)}
                  onToggleFavorite={toggleFavorite}
                  onPlay={playQuestionInPlayer}
                  quizMode={mode === 'quiz'}
                  onOpen={markReviewed}
                  forceOpen={allOpen}
                  item={item}
                />
              )}
            </div>
          )
        })}
      </div>

      <footer>{t('footer')}</footer>

      {playerActive && (
        <CoursePlayer
          onClose={() => {
            setPlayerActive(false)
            setPlayerActiveId(null)
          }}
          onActiveChange={setPlayerActiveId}
          startRequest={playerStartRequest}
          courseTitle={course.title}
          questions={questions}
          courseId={course.id}
          voices={voices}
        />
      )}
    </div>
  )
}
