import Logo from '../components/Logo'

// Quiet marketing footer. Links that have real pages navigate; About / Privacy /
// Terms render as plain (non-link) text because those pages are intentionally not
// built yet — better an honest label than a broken link.
export default function SiteFooter() {
  return (
    <footer className="mkt-footer">
      <div className="mkt-wrap mkt-footer-grid">
        <div className="mkt-footer-brand">
          <a aria-label="Level Up — home" className="mkt-brand" href="#">
            <Logo className="mkt-brand-logo" size={26} />
            <span className="mkt-brand-name">Level Up</span>
          </a>
          <p className="mkt-footer-tag">Get interview-ready.</p>
        </div>
        <nav className="mkt-footer-col" aria-label="Explore">
          <p className="mkt-footer-head">Explore</p>
          <a href="#features">Features</a>
          <a href="#vision">Vision</a>
        </nav>
        <nav className="mkt-footer-col" aria-label="Company">
          <p className="mkt-footer-head">Company</p>
          <a href="#faq">FAQ</a>
          <span className="mkt-footer-soon">About</span>
        </nav>
        <div className="mkt-footer-col">
          <p className="mkt-footer-head">Legal</p>
          <span className="mkt-footer-soon">Privacy</span>
          <span className="mkt-footer-soon">Terms</span>
        </div>
      </div>
      <div className="mkt-wrap mkt-footer-bottom">
        <span>© Level Up</span>
        <a href="#interview">Sign in</a>
      </div>
    </footer>
  )
}
