import Logo from './Logo'
import AccountMenu from './AccountMenu'
import GlobalSearch from './GlobalSearch'
import NotificationBell from './NotificationBell'
import { useLanguage } from '../hooks/useLanguage'

export default function AppHeader({ onSelectQuestion, onViewProfile, toggleTheme, courses, onHome, theme }) {
  const { t } = useLanguage()

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <button aria-label={t('brandAria')} className="brand" onClick={onHome}>
          <Logo size={30} />
          <span className="brand-name">Level Up</span>
        </button>
        <div className="header-search-zone">
          <GlobalSearch onSelectQuestion={onSelectQuestion} courses={courses} />
        </div>
        <div className="header-cluster">
          <NotificationBell />
          <AccountMenu onViewProfile={onViewProfile} toggleTheme={toggleTheme} theme={theme} />
        </div>
      </div>
    </header>
  )
}
