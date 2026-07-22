import { Volume2 } from 'lucide-react'
import { useEffect, useState, useMemo } from 'react'

import ProgressBar from './ProgressBar'
import PageSwitcher from './PageSwitcher'
import DictionaryIcon from './DictionaryIcon'
import DictionaryTable from './DictionaryTable'
import DictionarySingle from './DictionarySingle'
import DictionaryPlayer from './DictionaryPlayer'
import { useLanguage } from '../hooks/useLanguage'
import { useReviewState } from '../hooks/useReviewState'
import {
  isDictionaryCategoryLearnable,
  getDictionaryCategoryItemIds,
  getDictionaryCategory,
  DICTIONARY_CATEGORIES
} from '../data/dictionary'

export default function DictionaryCategoryPage({ onNavigate, categoryId, voices }) {
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
  const crumbItems = useMemo(
    () =>
      DICTIONARY_CATEGORIES.map((cat) => ({
        icon: <DictionaryIcon categoryId={cat.id} size={18} />,
        label: t(cat.titleKey),
        id: cat.id
      })),
    [t]
  )

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
    <div style={{ '--page-accent': category.accent || '#818cf8' }} className="wrap wrap-dict">
      <PageSwitcher
        icon={<DictionaryIcon categoryId={category.id} size={24} />}
        onSelect={(id) => onNavigate('dictionary', id)}
        onBack={() => onNavigate('dictionary')}
        backLabel={t('dictionaryBack')}
        subtitle={t('dictionaryTitle')}
        title={t(category.titleKey)}
        currentId={category.id}
        items={crumbItems}
      />

      {learnable && <ProgressBar labelKey="learnedLabel" total={allIds.length} done={doneCount} />}

      <div className="mode-bar">
        <button className={'chip-btn' + (playerOpen ? ' active' : '')} onClick={() => setPlayerOpen((v) => !v)}>
          <Volume2 aria-hidden="true" size={16} /> {t('listen')}
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
          items={speakItems}
          voices={voices}
        />
      )}
    </div>
  )
}
