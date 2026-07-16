import { createPortal } from 'react-dom'
import { HelpCircle, Search } from 'lucide-react'
import { useEffect, useState, useMemo, useRef } from 'react'

import Highlight from './Highlight'
import CourseIcon from './CourseIcon'
import { scoreMatch } from '../utils/fuzzy'
import DictionaryIcon from './DictionaryIcon'
import { useLanguage } from '../hooks/useLanguage'
import { DICTIONARY_CATEGORIES } from '../data/dictionary'

const MAX_PER_GROUP = 6

export default function GlobalSearch({ onSelectQuestion, courses }) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [term, setTerm] = useState('')
  const inputRef = useRef(null)

  // Open with ⌘K / Ctrl+K anywhere; close with Esc.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setTerm('')
        setOpen((v) => !v)
      } else if (e.key === 'Escape') {
        setTerm('')
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const close = () => {
    setTerm('')
    setOpen(false)
  }

  const availableCourses = useMemo(() => courses.filter((c) => c.questions?.length > 0), [courses])

  const questionIndex = useMemo(
    () => availableCourses.flatMap((c) => c.questions.map((q) => ({ ...q, courseTitle: c.title, courseId: c.id }))),
    [availableCourses]
  )

  const query = term.trim()

  const groups = useMemo(() => {
    const out = []

    // Fuzzy-rank by title, then sort best-first; empty query shows defaults.
    const rank = (list, getTitle, getBody) =>
      query
        ? list
            .map((entry) => ({ m: scoreMatch(query, getTitle(entry), getBody(entry)), entry }))
            .filter((x) => x.m)
            .sort((a, b) => b.m.score - a.m.score)
        : list.map((entry) => ({ m: { ranges: [] }, entry }))

    const courseItems = rank(
      availableCourses,
      (c) => c.title,
      (c) => c.subtitle
    )
      .slice(0, MAX_PER_GROUP)
      .map(({ entry: c, m }) => ({
        icon: <CourseIcon courseId={c.id} emoji={c.emoji} size={20} />,
        badge: t('questionsCount', { n: c.questions.length }),
        onPick: () => onSelectQuestion(c.id),
        accent: c.accent || '#818cf8',
        ranges: m.ranges,
        sub: c.subtitle,
        kind: 'course',
        title: c.title
      }))
    if (courseItems.length) out.push({ label: t('searchGroupCourses'), items: courseItems })

    const questionList = query ? questionIndex : questionIndex.slice(0, 3)
    const qItems = rank(
      questionList,
      (q) => q.question,
      (q) => q.module + ' ' + q.answer
    )
      .slice(0, MAX_PER_GROUP)
      .map(({ entry: q, m }) => ({
        icon: <HelpCircle aria-hidden="true" size={18} />,
        onPick: () => onSelectQuestion(q.courseId, q.id),
        sub: q.module + ' · ' + q.courseTitle,
        accent: '#818cf8',
        title: q.question,
        kind: 'question',
        ranges: m.ranges,
        badge: ''
      }))
    if (qItems.length) out.push({ label: query ? t('searchGroupQuestions') : t('searchPopular'), items: qItems })

    if (query) {
      const terms = DICTIONARY_CATEGORIES.flatMap((cat) => cat.items.map((item) => ({ item, cat })))
      const termItems = rank(
        terms,
        ({ item }) => item.en || item.wrong || item.instead || '',
        ({ item }) => Object.values(item).join(' ')
      )
        .slice(0, MAX_PER_GROUP)
        .map(({ entry: { item, cat }, m }) => ({
          sub: item.ru || item.right || item.tryThis || item.example || '',
          icon: <DictionaryIcon categoryId={cat.id} size={18} />,
          onPick: () => onSelectQuestion('dictionary', cat.id),
          title: item.en || item.wrong || item.instead || '',
          accent: cat.accent || '#818cf8',
          badge: t(cat.titleKey),
          ranges: m.ranges,
          kind: 'term'
        }))
      if (termItems.length) out.push({ label: t('searchGroupDictionary'), items: termItems })
    }

    return out
  }, [query, availableCourses, questionIndex, onSelectQuestion, t])

  const noResults = !!query && groups.length === 0

  const pick = (onPick) => {
    close()
    onPick()
  }

  return (
    <>
      <button aria-label={t('searchOpenAria')} onClick={() => setOpen(true)} className="search-trigger">
        <Search className="search-trigger-icon" aria-hidden="true" size={17} />
        <span className="search-trigger-label">{t('searchTrigger')}</span>
        <kbd className="search-trigger-kbd">⌘K</kbd>
      </button>

      {open &&
        createPortal(
          <div onClick={(e) => e.target === e.currentTarget && close()} className="cmdk-overlay">
            <div className="cmdk-panel">
              <div className="cmdk-input-row">
                <Search className="cmdk-input-icon" aria-hidden="true" size={20} />
                <input
                  onChange={(e) => setTerm(e.target.value)}
                  aria-label={t('globalSearchAria')}
                  placeholder={t('searchTrigger')}
                  className="cmdk-input"
                  ref={inputRef}
                  value={term}
                  type="text"
                />
                <kbd className="cmdk-esc" onClick={close}>
                  Esc
                </kbd>
              </div>

              <div className="cmdk-results">
                {!query && <div className="cmdk-hint">{t('searchJumpHint')}</div>}
                {groups.map((group) => (
                  <div key={group.label}>
                    <div className="cmdk-group-label">{group.label}</div>
                    {group.items.map((item, i) => (
                      <button onClick={() => pick(item.onPick)} key={item.kind + ':' + i} className="cmdk-row">
                        <span style={{ '--row-accent': item.accent }} className="cmdk-tile">
                          {item.icon}
                        </span>
                        <span className="cmdk-row-text">
                          <span className="cmdk-row-title">
                            <Highlight ranges={item.ranges} text={item.title} />
                          </span>
                          <span className="cmdk-row-sub">{item.sub}</span>
                        </span>
                        {item.badge && <span className="cmdk-row-badge">{item.badge}</span>}
                      </button>
                    ))}
                  </div>
                ))}
                {noResults && (
                  <div className="cmdk-empty">
                    <div className="cmdk-empty-title">{t('searchNoMatch', { q: term })}</div>
                    <div className="cmdk-empty-hint">{t('searchNoMatchHint')}</div>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
