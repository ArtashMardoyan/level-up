import { Volume2, Star } from 'lucide-react'

import { useLanguage } from '../hooks/useLanguage'

const MODES = [
  { labelKey: 'listView', key: 'list' },
  { labelKey: 'quizMode', key: 'quiz' },
  { labelKey: 'interviewMode', key: 'interview' }
]

export default function ModeBar({
  onToggleFavorites,
  onTogglePlayer,
  favoritesOnly,
  onModeChange,
  playerActive,
  mode
}) {
  const { t } = useLanguage()

  return (
    <div className="mode-bar">
      <div className="segmented">
        {MODES.map((m) => (
          <button
            className={'segmented-btn' + (mode === m.key ? ' active' : '')}
            onClick={() => onModeChange(m.key)}
            key={m.key}
          >
            {t(m.labelKey)}
          </button>
        ))}
      </div>
      <button className={'chip-btn' + (favoritesOnly ? ' active' : '')} onClick={onToggleFavorites}>
        <Star aria-hidden="true" size={16} /> {t('favoritesOnly')}
      </button>
      <button className={'chip-btn' + (playerActive ? ' active' : '')} onClick={onTogglePlayer}>
        <Volume2 aria-hidden="true" size={16} /> {t('listen')}
      </button>
    </div>
  )
}
