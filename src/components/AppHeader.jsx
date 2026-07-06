import Logo from './Logo'
import GlobalSearch from './GlobalSearch'
import SettingsPanel from './SettingsPanel'

export default function AppHeader({
  courses, onSelectQuestion, onHome,
  theme, toggleTheme, voices, voiceName, setVoiceName,
}) {
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <button className="brand" onClick={onHome} aria-label="Level Up — all courses">
          <Logo size={30} />
          <span className="brand-name">Level Up</span>
        </button>
        <GlobalSearch courses={courses} onSelectQuestion={onSelectQuestion} />
        <SettingsPanel
          theme={theme}
          toggleTheme={toggleTheme}
          voices={voices}
          voiceName={voiceName}
          setVoiceName={setVoiceName}
        />
      </div>
    </header>
  )
}