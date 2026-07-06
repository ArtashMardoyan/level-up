import Logo from './Logo'
import GlobalSearch from './GlobalSearch'
import SettingsPanel from './SettingsPanel'
import { useLanguage } from '../hooks/useLanguage'

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
  const { t } = useLanguage()

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <button aria-label={t('brandAria')} className="brand" onClick={onHome}>
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
