import { useLanguage } from '../hooks/useLanguage'
import { useReviewState } from '../hooks/useReviewState'
import { getDictionaryDayRowIds, DICTIONARY_DAYS } from '../data/dictionary'

export default function DictionarySelect({ onSelect }) {
  const { t } = useLanguage()
  const { state } = useReviewState('dictionary')

  return (
    <div className="course-grid">
      {DICTIONARY_DAYS.map((day) => {
        const ids = getDictionaryDayRowIds(day)
        const done = ids.filter((id) => state.reviewed.includes(id)).length
        return (
          <button onClick={() => onSelect(day.day)} className="course-card" key={day.day}>
            <div className="course-emoji">📖</div>
            <div className="course-title">{t('dictionaryDayLabel', { n: day.day })}</div>
            <div className="course-subtitle">{t('dictionaryNewDaily')}</div>
            <div className="course-count">{t('dictionaryLearnedProgress', { total: ids.length, done })}</div>
          </button>
        )
      })}
    </div>
  )
}
