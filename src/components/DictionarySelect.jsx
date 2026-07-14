import { ArrowRight } from 'lucide-react'

import DictionaryIcon from './DictionaryIcon'
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
        const pct = ids.length ? Math.round((done / ids.length) * 100) : 0
        return (
          <button
            style={{ '--card-accent': category.accent || '#818cf8' }}
            onClick={() => onSelect(category.id)}
            className="course-card"
            key={category.id}
          >
            <span className="course-card-glow" aria-hidden="true" />
            <span className="course-tile-row">
              <span className="course-tile">
                <DictionaryIcon categoryId={category.id} />
              </span>
              {!learnable && <span className="course-badge daily-badge">{t('dictionaryDailyShort')}</span>}
            </span>
            <span className="course-card-body">
              <span className="course-title">{t(category.titleKey)}</span>
              <span className="course-subtitle">{t(category.descKey)}</span>
            </span>
            {learnable ? (
              <span className="course-card-progress">
                <span className="course-card-footer">
                  <span className="course-count">{t('dictionaryLearnedProgress', { total: ids.length, done })}</span>
                  <ArrowRight className="course-arrow" aria-hidden="true" size={18} />
                </span>
                <span className="mini-progress" aria-hidden="true">
                  <span className="mini-progress-fill" style={{ width: pct + '%' }} />
                </span>
              </span>
            ) : (
              <span className="course-card-footer">
                <span className="course-count">{t('dictionaryStartNow')}</span>
                <ArrowRight className="course-arrow" aria-hidden="true" size={18} />
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
