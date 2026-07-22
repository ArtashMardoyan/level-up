import Logo from '../components/Logo'
import { useSiteStrings } from './hooks/useSiteStrings'

// In-page smooth scroll (honors reduced motion).
function scrollToId(id) {
  const el = document.getElementById(id)
  if (!el) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
}

// Quiet marketing footer. Section links scroll the single page; About / Privacy /
// Terms render as plain (non-link) text because those pages aren't built yet.
export default function SiteFooter() {
  const s = useSiteStrings()

  return (
    <footer className="mkt-footer">
      <div className="mkt-wrap mkt-footer-grid">
        <div className="mkt-footer-brand">
          <a aria-label="Level Up" className="mkt-brand" href="#">
            <Logo className="mkt-brand-logo" size={26} />
            <span className="mkt-brand-name">Level Up</span>
          </a>
          <p className="mkt-footer-tag">{s.footer.tag}</p>
        </div>
        <nav aria-label={s.footer.explore} className="mkt-footer-col">
          <p className="mkt-footer-head">{s.footer.explore}</p>
          <button onClick={() => scrollToId('features')} className="mkt-footer-link" type="button">
            {s.nav.features}
          </button>
          <button onClick={() => scrollToId('vision')} className="mkt-footer-link" type="button">
            {s.nav.vision}
          </button>
        </nav>
        <nav aria-label={s.footer.company} className="mkt-footer-col">
          <p className="mkt-footer-head">{s.footer.company}</p>
          <button onClick={() => scrollToId('faq')} className="mkt-footer-link" type="button">
            {s.nav.faq}
          </button>
          <span className="mkt-footer-soon">{s.footer.about}</span>
        </nav>
        <div className="mkt-footer-col">
          <p className="mkt-footer-head">{s.footer.legal}</p>
          <span className="mkt-footer-soon">{s.footer.privacy}</span>
          <span className="mkt-footer-soon">{s.footer.terms}</span>
        </div>
      </div>
      <div className="mkt-wrap mkt-footer-bottom">
        <span>{s.footer.copyright}</span>
        <a href="#interview">{s.ui.signIn}</a>
      </div>
    </footer>
  )
}
