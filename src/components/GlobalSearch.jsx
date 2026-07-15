import { createPortal } from 'react-dom'
import { HelpCircle, Search } from 'lucide-react'
import { useEffect, useState, useMemo, useRef } from 'react'

import CourseIcon from './CourseIcon'
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

  const query = term.toLowerCase().trim()

  const groups = useMemo(() => {
    const out = []

    const courseMatches = query
      ? availableCourses.filter((c) => (c.title + ' ' + c.subtitle).toLowerCase().includes(query))
      : availableCourses
    const courseItems = courseMatches.slice(0, MAX_PER_GROUP).map((c) => ({
      icon: <CourseIcon courseId={c.id} emoji={c.emoji} size={20} />,
      badge: t('questionsCount', { n: c.questions.length }),
      onPick: () => onSelectQuestion(c.id),
      accent: c.accent || '#818cf8',
      sub: c.subtitle,
      kind: 'course',
      title: c.title
    }))
    if (courseItems.length) out.push({ label: t('searchGroupCourses'), items: courseItems })

    const qMatches = query
      ? questionIndex.filter((q) => (q.question + ' ' + q.module + ' ' + q.answer).toLowerCase().includes(query))
      : questionIndex.slice(0, 3)
    const qItems = qMatches.slice(0, MAX_PER_GROUP).map((q) => ({
      icon: <HelpCircle aria-hidden="true" size={18} />,
      onPick: () => onSelectQuestion(q.courseId, q.id),
      sub: q.module + ' · ' + q.courseTitle,
      accent: '#818cf8',
      title: q.question,
      kind: 'question',
      badge: ''
    }))
    if (qItems.length) out.push({ label: query ? t('searchGroupQuestions') : t('searchPopular'), items: qItems })

    if (query) {
      const termItems = []
      for (const cat of DICTIONARY_CATEGORIES) {
        for (const item of cat.items) {
          if (!Object.values(item).join(' ').toLowerCase().includes(query)) continue
          termItems.push({
            sub: item.ru || item.right || item.tryThis || item.example || '',
            icon: <DictionaryIcon categoryId={cat.id} size={18} />,
            onPick: () => onSelectQuestion('dictionary', cat.id),
            title: item.en || item.wrong || item.instead || '',
            accent: cat.accent || '#818cf8',
            badge: t(cat.titleKey),
            kind: 'term'
          })
          if (termItems.length >= MAX_PER_GROUP) break
        }
        if (termItems.length >= MAX_PER_GROUP) break
      }
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
                          <span className="cmdk-row-title">{item.title}</span>
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
