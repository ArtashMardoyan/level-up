import { Volume2 } from 'lucide-react'

import { useLanguage } from '../hooks/useLanguage'

export default function DictionarySingle({ activeId, onSpeak, item }) {
  const { t } = useLanguage()
  const active = item.id === activeId

  return (
    <div className={'dictionary-single' + (active ? ' dictionary-row-active' : '')} id={item.id}>
      <span className="dictionary-single-glow" aria-hidden="true" />
      <p className="dictionary-single-en">{item.en}</p>
      {item.ru && <p className="dictionary-single-ru">{item.ru}</p>}
      {item.explanation && <p className="dictionary-single-note">{item.explanation}</p>}
      <button
        aria-label={t('dictionarySpeakAria')}
        className="dictionary-single-listen"
        onClick={() => onSpeak(item.id)}
      >
        <Volume2 aria-hidden="true" size={16} /> {t('listen')}
      </button>
    </div>
  )
}
