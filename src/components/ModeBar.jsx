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
      {MODES.map((m) => (
        <button
          className={'mode-btn' + (mode === m.key ? ' active' : '')}
          onClick={() => onModeChange(m.key)}
          key={m.key}
        >
          {t(m.labelKey)}
        </button>
      ))}
      <button className={'mode-btn' + (favoritesOnly ? ' active' : '')} onClick={onToggleFavorites}>
        &#9733; {t('favoritesOnly')}
      </button>
      <button className={'mode-btn' + (playerActive ? ' active' : '')} onClick={onTogglePlayer}>
        🎧 {t('listen')}
      </button>
    </div>
  )
}
