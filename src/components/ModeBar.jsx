const MODES = [
  { key: 'list', label: 'List view' },
  { key: 'quiz', label: 'Quiz mode' },
  { key: 'interview', label: 'Interview mode' },
]

export default function ModeBar({ mode, onModeChange, favoritesOnly, onToggleFavorites, playerActive, onTogglePlayer }) {
  return (
    <div className="mode-bar">
      {MODES.map((m) => (
        <button
          key={m.key}
          className={'mode-btn' + (mode === m.key ? ' active' : '')}
          onClick={() => onModeChange(m.key)}
        >
          {m.label}
        </button>
      ))}
      <button
        className={'mode-btn' + (favoritesOnly ? ' active' : '')}
        onClick={onToggleFavorites}
      >
        &#9733; Favorites only
      </button>
      <button
        className={'mode-btn' + (playerActive ? ' active' : '')}
        onClick={onTogglePlayer}
      >
        🎧 Listen
      </button>
    </div>
  )
}
