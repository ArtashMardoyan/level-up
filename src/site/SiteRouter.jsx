import { useEffect } from 'react'

import SitePage from './SitePage'
import SiteLayout from './SiteLayout'
import { useScrollReveal } from './hooks/useScrollReveal'

// The marketing site is a single scrolling page. `section` comes from the hash
// (home / features / vision / faq) and is used only to scroll a deep link to the
// right section on load; nav within the page scrolls smoothly without changing it.
export default function SiteRouter({ toggleTheme, setTheme, section, theme }) {
  useScrollReveal('home')

  useEffect(() => {
    if (!section || section === 'home') return
    const el = document.getElementById(section)
    if (el) el.scrollIntoView({ block: 'start' })
  }, [section])

  return (
    <SiteLayout toggleTheme={toggleTheme} setTheme={setTheme} theme={theme}>
      <SitePage />
    </SiteLayout>
  )
}
