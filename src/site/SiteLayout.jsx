import SiteFooter from './SiteFooter'
import SiteHeader from './SiteHeader'

// Shared chrome for every marketing page: header + <main> + footer.
export default function SiteLayout({ toggleTheme, children, theme }) {
  return (
    <div className="mkt">
      <SiteHeader toggleTheme={toggleTheme} theme={theme} />
      <main className="mkt-main">{children}</main>
      <SiteFooter />
    </div>
  )
}
