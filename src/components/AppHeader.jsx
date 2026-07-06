import Logo from './Logo'
import GlobalSearch from './GlobalSearch'
import SettingsPanel from './SettingsPanel'

export default function AppHeader({
  onSelectQuestion,
  setVoiceName,
  toggleTheme,
  voiceName,
  courses,
  onHome,
  voices,
  theme
}) {
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <button aria-label="Level Up — all courses" className="brand" onClick={onHome}>
          <Logo size={30} />
          <span className="brand-name">Level Up</span>
        </button>
        <GlobalSearch onSelectQuestion={onSelectQuestion} courses={courses} />
        <SettingsPanel
          setVoiceName={setVoiceName}
          toggleTheme={toggleTheme}
          voiceName={voiceName}
          voices={voices}
          theme={theme}
        />
      </div>
    </header>
  )
}
