import Logo from './Logo'
import AccountMenu from './AccountMenu'
import GlobalSearch from './GlobalSearch'
import { useLanguage } from '../hooks/useLanguage'

export default function AppHeader({ onSelectQuestion, toggleTheme, courses, onHome, theme }) {
  const { t } = useLanguage()

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <button aria-label={t('brandAria')} className="brand" onClick={onHome}>
          <Logo size={30} />
          <span className="brand-name">Level Up</span>
        </button>
        <GlobalSearch onSelectQuestion={onSelectQuestion} courses={courses} />
        <AccountMenu toggleTheme={toggleTheme} theme={theme} />
      </div>
    </header>
  )
}
