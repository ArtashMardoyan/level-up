import { useLanguage } from '../hooks/useLanguage'

export default function DictionaryGoalList({ onToggleReviewed, reviewed, activeId, onSpeak, title, items }) {
  const { t } = useLanguage()

  return (
    <div className="dictionary-section">
      <h2 className="dictionary-section-title">{title}</h2>
      <ul className="dictionary-goal-list">
        {items.map((item) => {
          const done = reviewed.includes(item.id)
          const active = item.id === activeId
          return (
            <li
              className={'dictionary-goal-item' + (done ? ' done' : '') + (active ? ' dictionary-row-active' : '')}
              key={item.id}
              id={item.id}
            >
              <input
                onChange={() => onToggleReviewed(item.id)}
                aria-label={t('dictionaryMarkLearned')}
                className="dictionary-learn-toggle"
                type="checkbox"
                checked={done}
              />
              <span>{item.en}</span>
              <span
                aria-label={t('dictionarySpeakAria')}
                onClick={() => onSpeak(item.id)}
                className="speak-btn"
                role="button"
              >
                🔊
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
