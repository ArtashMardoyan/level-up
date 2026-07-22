import SiteFooter from './SiteFooter'
import SiteHeader from './SiteHeader'

// Shared chrome for every marketing page: header + <main> + footer.
export default function SiteLayout({ toggleTheme, children, theme }) {
  return (
    <div className="mkt">
      <div className="mkt-glow" aria-hidden="true" />
      <SiteHeader toggleTheme={toggleTheme} theme={theme} />
      <main className="mkt-main">{children}</main>
      <SiteFooter />
    </div>
  )
}
