import { useState } from 'react'
import { Moon, Menu, Sun } from 'lucide-react'

import Logo from '../components/Logo'
import { useLanguage } from '../hooks/useLanguage'
import { useSiteStrings } from './hooks/useSiteStrings'

// In-page smooth scroll (honors reduced motion).
function scrollToId(id) {
  const el = document.getElementById(id)
  if (!el) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
}

const LANGS = [
  { label: 'EN', code: 'en' },
  { label: 'RU', code: 'ru' },
  { label: 'HY', code: 'hy' }
]

// Marketing header: inline nav (desktop) + a menu button that opens a panel with
// theme + language controls and the CTAs. On mobile the panel also holds the nav.
export default function SiteHeader({ setTheme, theme }) {
  const s = useSiteStrings()
  const { setLanguage, language } = useLanguage()
  const [open, setOpen] = useState(false)

  const nav = [
    { label: s.nav.how, id: 'how' },
    { label: s.nav.features, id: 'features' },
    { label: s.nav.vision, id: 'vision' },
    { label: s.nav.faq, id: 'faq' }
  ]

  const go = (id) => {
    setOpen(false)
    scrollToId(id)
  }

  return (
    <header className="mkt-header">
      <div className="mkt-wrap mkt-header-inner">
        <a onClick={() => setOpen(false)} aria-label="Level Up" className="mkt-brand" href="#">
          <Logo className="mkt-brand-logo" size={28} />
          <span className="mkt-brand-name">Level Up</span>
        </a>

        <nav aria-label="Primary" className="mkt-nav">
          {nav.map((item) => (
            <button onClick={() => go(item.id)} className="mkt-nav-link" type="button" key={item.id}>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mkt-menu-wrap">
          <button
            onClick={() => setOpen((v) => !v)}
            className="mkt-icon-btn"
            aria-label={s.ui.menu}
            aria-expanded={open}
            type="button"
          >
            <Menu size={19} />
          </button>

          {open && (
            <>
              <div onClick={() => setOpen(false)} className="mkt-menu-scrim" aria-hidden="true" />
              <div className="mkt-menu" role="menu">
                <nav className="mkt-menu-nav" aria-label="Sections">
                  {nav.map((item) => (
                    <button className="mkt-menu-navlink" onClick={() => go(item.id)} type="button" key={item.id}>
                      {item.label}
                    </button>
                  ))}
                </nav>

                <p className="mkt-menu-label">{s.ui.theme}</p>
                <div className="mkt-seg">
                  <button
                    className={'mkt-seg-btn' + (theme !== 'dark' ? ' active' : '')}
                    onClick={() => setTheme('light')}
                    type="button"
                  >
                    <Sun size={15} /> {s.ui.light}
                  </button>
                  <button
                    className={'mkt-seg-btn' + (theme === 'dark' ? ' active' : '')}
                    onClick={() => setTheme('dark')}
                    type="button"
                  >
                    <Moon size={15} /> {s.ui.dark}
                  </button>
                </div>

                <p className="mkt-menu-label">{s.ui.language}</p>
                <div className="mkt-seg">
                  {LANGS.map((l) => (
                    <button
                      className={'mkt-seg-btn' + (language === l.code ? ' active' : '')}
                      onClick={() => setLanguage(l.code)}
                      type="button"
                      key={l.code}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>

                <a className="mkt-btn mkt-btn-primary mkt-menu-cta" onClick={() => setOpen(false)} href="#interview">
                  {s.ui.cta}
                </a>
                <a onClick={() => setOpen(false)} className="mkt-menu-signin" href="#interview">
                  {s.ui.signIn}
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
