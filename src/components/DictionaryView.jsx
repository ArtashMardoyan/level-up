import { useEffect, useState, useMemo } from 'react'

import CourseIcon from './CourseIcon'
import ProgressBar from './ProgressBar'
import DictionaryTable from './DictionaryTable'
import DictionaryPlayer from './DictionaryPlayer'
import { useLanguage } from '../hooks/useLanguage'
import DictionaryGoalList from './DictionaryGoalList'
import { useReviewState } from '../hooks/useReviewState'
import {
  getLatestDictionaryDay,
  getDictionaryDayRowIds,
  getDictionaryDayCount,
  getDictionaryDay
} from '../data/dictionary'

function buildSpeakItems(day) {
  const items = []
  for (const row of day.vocabulary || []) items.push({ secondary: row.ru, primary: row.en, id: row.id })
  for (const row of day.phrases || []) items.push({ secondary: row.ru, primary: row.en, id: row.id })
  for (const row of day.grammarFixes || []) items.push({ primary: row.right, secondary: null, id: row.id })
  for (const row of day.teamLeadSentences || []) items.push({ secondary: row.ru, primary: row.en, id: row.id })
  for (const row of day.wordsToUseMore || []) items.push({ primary: row.tryThis, secondary: null, id: row.id })
  for (const row of day.dailyGoal || []) items.push({ primary: row.en, secondary: null, id: row.id })
  return items
}

export default function DictionaryView({ onNavigateDay, voiceName, dayNumber, voices }) {
  const { t } = useLanguage()
  const { toggleReviewed, state } = useReviewState('dictionary')
  const totalDays = getDictionaryDayCount()
  const day = getDictionaryDay(dayNumber) || getLatestDictionaryDay()

  const [playerOpen, setPlayerOpen] = useState(false)
  const [playerStartRequest, setPlayerStartRequest] = useState(null)
  const [activeId, setActiveId] = useState(null)

  const allIds = useMemo(() => getDictionaryDayRowIds(day), [day])
  const speakItems = useMemo(() => buildSpeakItems(day), [day])

  const doneCount = allIds.filter((id) => state.reviewed.includes(id)).length

  const playRow = (id) => {
    setPlayerStartRequest({ id })
    setPlayerOpen(true)
  }

  useEffect(() => {
    if (!activeId) return
    document.getElementById(activeId)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [activeId])

  const tableProps = { onToggleReviewed: toggleReviewed, reviewed: state.reviewed, onSpeak: playRow, activeId }

  return (
    <div className="wrap">
      <div className="page-title-row">
        <div className="page-title-icon">
          <CourseIcon courseId="dictionary" emoji="📖" />
        </div>
        <div>
          <h1>{t('dictionaryTitle')}</h1>
          <div className="subtitle">{t('dictionaryNewDaily')}</div>
        </div>
      </div>

      <div className="dictionary-day-nav">
        <button
          onClick={() => onNavigateDay(day.day - 1)}
          aria-label={t('dictionaryPrevDay')}
          disabled={day.day <= 1}
          className="plain-btn"
        >
          ‹
        </button>
        <span>{t('dictionaryDayOf', { total: totalDays, n: day.day })}</span>
        <button
          onClick={() => onNavigateDay(day.day + 1)}
          aria-label={t('dictionaryNextDay')}
          disabled={day.day >= totalDays}
          className="plain-btn"
        >
          ›
        </button>
      </div>

      <ProgressBar labelKey="dictionaryLearnedProgress" total={allIds.length} done={doneCount} />

      <div className="mode-bar">
        <button className={'mode-btn' + (playerOpen ? ' active' : '')} onClick={() => setPlayerOpen((v) => !v)}>
          🔊 {t('listen')}
        </button>
      </div>

      {day.vocabulary?.length > 0 && (
        <DictionaryTable
          columns={[
            { label: t('dictionaryColWord'), key: 'en' },
            { label: t('dictionaryColTranslation'), key: 'ru' },
            { label: t('dictionaryColExample'), key: 'example' }
          ]}
          title={t('dictionaryVocabulary')}
          rows={day.vocabulary}
          {...tableProps}
        />
      )}

      {day.phrases?.length > 0 && (
        <DictionaryTable
          columns={[
            { label: t('dictionaryColPhrase'), key: 'en' },
            { label: t('dictionaryColTranslation'), key: 'ru' }
          ]}
          title={t('dictionaryPhrases')}
          rows={day.phrases}
          {...tableProps}
        />
      )}

      {day.grammarFixes?.length > 0 && (
        <DictionaryTable
          columns={[
            { label: t('dictionaryColDontSay'), key: 'wrong' },
            { label: t('dictionaryColSayInstead'), key: 'right' }
          ]}
          title={t('dictionaryGrammarFixes')}
          rows={day.grammarFixes}
          {...tableProps}
        />
      )}

      {day.teamLeadSentences?.length > 0 && (
        <DictionaryTable
          columns={[
            { label: t('dictionaryColPhrase'), key: 'en' },
            { label: t('dictionaryColTranslation'), key: 'ru' }
          ]}
          title={t('dictionaryTeamLeadSentences')}
          rows={day.teamLeadSentences}
          {...tableProps}
        />
      )}

      {day.wordsToUseMore?.length > 0 && (
        <DictionaryTable
          columns={[
            { label: t('dictionaryColInsteadOf'), key: 'instead' },
            { label: t('dictionaryColTrySaying'), key: 'tryThis' }
          ]}
          title={t('dictionaryWordsToUseMore')}
          rows={day.wordsToUseMore}
          {...tableProps}
        />
      )}

      {day.dailyGoal?.length > 0 && (
        <DictionaryGoalList title={t('dictionaryDailyGoal')} items={day.dailyGoal} {...tableProps} />
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
