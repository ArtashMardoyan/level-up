import SiteFooter from './SiteFooter'
import SiteHeader from './SiteHeader'

// Shared chrome for the marketing site: header + <main> + footer.
export default function SiteLayout({ toggleTheme, setTheme, children, theme }) {
  return (
    <div className="mkt">
      <div className="mkt-glow" aria-hidden="true" />
      <SiteHeader toggleTheme={toggleTheme} setTheme={setTheme} theme={theme} />
      <main className="mkt-main">{children}</main>
      <SiteFooter />
    </div>
  )
}
