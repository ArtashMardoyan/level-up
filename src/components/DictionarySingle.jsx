import { useLanguage } from '../hooks/useLanguage'

export default function DictionarySingle({ activeId, onSpeak, item }) {
  const { t } = useLanguage()
  const active = item.id === activeId

  return (
    <div className={'dictionary-single' + (active ? ' dictionary-row-active' : '')} id={item.id}>
      <p className="dictionary-single-en">{item.en}</p>
      {item.ru && <p className="dictionary-single-ru">{item.ru}</p>}
      {item.explanation && <p className="dictionary-single-note">{item.explanation}</p>}
      <span aria-label={t('dictionarySpeakAria')} onClick={() => onSpeak(item.id)} className="speak-btn" role="button">
        🔊
      </span>
    </div>
  )
}
