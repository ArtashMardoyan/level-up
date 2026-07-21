import { Moon, Sun } from 'lucide-react'

import Logo from '../components/Logo'

// The marketing site's own header — deliberately NOT the app's AppHeader (no search,
// notifications, or account menu). Links use hash navigation; the app is entered at
// #interview. Theme toggle is passed in from the app so there is a single theme owner.
export default function SiteHeader({ toggleTheme, theme }) {
  return (
    <header className="mkt-header">
      <div className="mkt-wrap mkt-header-inner">
        <a aria-label="Level Up — home" className="mkt-brand" href="#">
          <Logo size={28} />
          <span className="mkt-brand-name">Level Up</span>
        </a>
        <nav aria-label="Primary" className="mkt-nav">
          <a className="mkt-nav-link" href="#features">
            Features
          </a>
          <a className="mkt-nav-link" href="#vision">
            Vision
          </a>
        </nav>
        <div className="mkt-header-right">
          <button
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            className="mkt-icon-btn"
            onClick={toggleTheme}
            type="button"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <a className="mkt-signin" href="#interview">
            Sign in
          </a>
          <a className="mkt-btn mkt-btn-primary mkt-btn-sm" href="#interview">
            Start practicing
          </a>
        </div>
      </div>
    </header>
  )
}
