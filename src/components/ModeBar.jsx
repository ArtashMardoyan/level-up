const MODES = [
  { label: 'List view', key: 'list' },
  { label: 'Quiz mode', key: 'quiz' },
  { label: 'Interview mode', key: 'interview' }
]

export default function ModeBar({
  onToggleFavorites,
  onTogglePlayer,
  favoritesOnly,
  onModeChange,
  playerActive,
  mode
}) {
  return (
    <div className="mode-bar">
      {MODES.map((m) => (
        <button
          className={'mode-btn' + (mode === m.key ? ' active' : '')}
          onClick={() => onModeChange(m.key)}
          key={m.key}
        >
          {m.label}
        </button>
      ))}
      <button className={'mode-btn' + (favoritesOnly ? ' active' : '')} onClick={onToggleFavorites}>
        &#9733; Favorites only
      </button>
      <button className={'mode-btn' + (playerActive ? ' active' : '')} onClick={onTogglePlayer}>
        🎧 Listen
      </button>
    </div>
  )
}
