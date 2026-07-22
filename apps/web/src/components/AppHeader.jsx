import Logo from './Logo'
import AccountMenu from './AccountMenu'
import GlobalSearch from './GlobalSearch'
import NotificationBell from './NotificationBell'
import { useLanguage } from '../hooks/useLanguage'

export default function AppHeader({
  onSelectQuestion,
  onViewActivity,
  onViewProfile,
  activeSection,
  toggleTheme,
  onNavigate,
  courses,
  onHome,
  theme
}) {
  const { t } = useLanguage()

  const nav = [
    { go: () => onNavigate('interview'), label: t('navInterview'), section: 'interview' },
    { go: () => onNavigate('courses'), label: t('navCourses'), section: 'courses' },
    { go: () => onNavigate('dictionary'), label: t('navDictionary'), section: 'dictionary' }
  ]

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
        <nav aria-label={t('navAria')} className="lu-nav">
          {nav.map((item) => (
            <button
              className={'lu-nav-btn' + (activeSection === item.section ? ' active' : '')}
              aria-current={activeSection === item.section ? 'page' : undefined}
              key={item.section}
              onClick={item.go}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="header-cluster">
          <NotificationBell onViewActivity={onViewActivity} />
          <AccountMenu onViewProfile={onViewProfile} toggleTheme={toggleTheme} theme={theme} />
        </div>
      </div>
    </header>
  )
}
