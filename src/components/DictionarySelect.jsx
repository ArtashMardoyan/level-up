import { useLanguage } from '../hooks/useLanguage'
import { useReviewState } from '../hooks/useReviewState'
import { isDictionaryCategoryLearnable, getDictionaryCategoryItemIds, DICTIONARY_CATEGORIES } from '../data/dictionary'

export default function DictionarySelect({ onSelect }) {
  const { t } = useLanguage()
  const { state } = useReviewState('dictionary')

  return (
    <div className="course-grid">
      {DICTIONARY_CATEGORIES.map((category) => {
        const learnable = isDictionaryCategoryLearnable(category)
        const ids = getDictionaryCategoryItemIds(category)
        const done = ids.filter((id) => state.reviewed.includes(id)).length
        return (
          <button onClick={() => onSelect(category.id)} className="course-card" key={category.id}>
            <div className="course-emoji">{category.emoji}</div>
            <div className="course-title">{t(category.titleKey)}</div>
            <div className="course-count">
              {learnable ? t('dictionaryLearnedProgress', { total: ids.length, done }) : t('dictionaryUpdatedDaily')}
            </div>
          </button>
        )
      })}
    </div>
  )
}
