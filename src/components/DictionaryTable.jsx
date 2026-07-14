import { Volume2 } from 'lucide-react'

import { useLanguage } from '../hooks/useLanguage'

export default function DictionaryTable({ onToggleReviewed, reviewed, activeId, onSpeak, columns, title, rows }) {
  const { t } = useLanguage()

  return (
    <div className="dictionary-section">
      {title && <h2 className="dictionary-section-title">{title}</h2>}
      <div className="dictionary-table-wrap">
        <table className="dictionary-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const learned = reviewed.includes(row.id)
              const active = row.id === activeId
              return (
                <tr
                  className={(learned ? 'dictionary-row-learned' : '') + (active ? ' dictionary-row-active' : '')}
                  key={row.id}
                  id={row.id}
                >
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.prefix}
                      {row[col.key]}
                    </td>
                  ))}
                  <td>
                    <span
                      aria-label={t('dictionarySpeakAria')}
                      onClick={() => onSpeak(row.id)}
                      className="speak-btn"
                      role="button"
                    >
                      <Volume2 aria-hidden="true" size={16} />
                    </span>
                  </td>
                  <td>
                    <input
                      onChange={() => onToggleReviewed(row.id)}
                      aria-label={t('dictionaryMarkLearned')}
                      className="dictionary-learn-toggle"
                      checked={learned}
                      type="checkbox"
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
