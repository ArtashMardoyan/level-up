import { useEffect, useState, useMemo } from 'react'

import CourseIcon from './CourseIcon'
import ProgressBar from './ProgressBar'
import DictionaryTable from './DictionaryTable'
import DictionarySingle from './DictionarySingle'
import DictionaryPlayer from './DictionaryPlayer'
import { useLanguage } from '../hooks/useLanguage'
import { useReviewState } from '../hooks/useReviewState'
import { isDictionaryCategoryLearnable, getDictionaryCategoryItemIds, getDictionaryCategory } from '../data/dictionary'

export default function DictionaryCategoryPage({ categoryId, voiceName, voices }) {
  const { t } = useLanguage()
  const { toggleReviewed, state } = useReviewState('dictionary')
  const category = getDictionaryCategory(categoryId)

  const [playerOpen, setPlayerOpen] = useState(false)
  const [playerStartRequest, setPlayerStartRequest] = useState(null)
  const [activeId, setActiveId] = useState(null)

  const isSingle = category?.layout === 'single'
  const learnable = category ? isDictionaryCategoryLearnable(category) : false

  const allIds = useMemo(() => (category ? getDictionaryCategoryItemIds(category) : []), [category])
  const speakItems = useMemo(() => {
    if (!category) return []
    const source = isSingle ? category.items.slice(0, 1) : category.items
    return source.map((item) => ({ id: item.id, ...category.speak(item) }))
  }, [category, isSingle])

  const doneCount = allIds.filter((id) => state.reviewed.includes(id)).length

  const playRow = (id) => {
    setPlayerStartRequest({ id })
    setPlayerOpen(true)
  }

  useEffect(() => {
    if (!activeId) return
    document.getElementById(activeId)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [activeId])

  if (!category) return null

  const columns = category.columns?.map((col) => ({ label: t(col.labelKey), prefix: col.prefix, key: col.key }))
  const tableProps = { onToggleReviewed: toggleReviewed, reviewed: state.reviewed, onSpeak: playRow, activeId }

  return (
    <div className="wrap">
      <div className="page-title-row">
        <div className="page-title-icon">
          <CourseIcon emoji={category.emoji} courseId="dictionary" />
        </div>
        <div>
          <h1>{t(category.titleKey)}</h1>
          <div className="subtitle">{t('dictionaryTitle')}</div>
        </div>
      </div>

      {learnable && <ProgressBar labelKey="dictionaryLearnedProgress" total={allIds.length} done={doneCount} />}

      <div className="mode-bar">
        <button className={'mode-btn' + (playerOpen ? ' active' : '')} onClick={() => setPlayerOpen((v) => !v)}>
          🔊 {t('listen')}
        </button>
      </div>

      {isSingle ? (
        <DictionarySingle item={category.items[0]} activeId={activeId} onSpeak={playRow} />
      ) : (
        <DictionaryTable rows={category.items} columns={columns} {...tableProps} />
      )}

      {playerOpen && (
        <DictionaryPlayer
          onClose={() => setPlayerOpen(false)}
          startRequest={playerStartRequest}
          onActiveChange={setActiveId}
          voiceName={voiceName}
          items={speakItems}
          voices={voices}
        />
      )}
    </div>
  )
}
