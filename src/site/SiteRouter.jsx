import FaqPage from './pages/FaqPage'
import SiteLayout from './SiteLayout'
import HomePage from './pages/HomePage'
import VisionPage from './pages/VisionPage'
import FeaturesPage from './pages/FeaturesPage'
import { useScrollReveal } from './hooks/useScrollReveal'

const PAGES = {
  features: FeaturesPage,
  vision: VisionPage,
  home: HomePage,
  faq: FaqPage
}

// Renders one marketing page (chosen by the hash router) inside the shared layout.
export default function SiteRouter({ toggleTheme, theme, page }) {
  const Page = PAGES[page] ?? HomePage

  useScrollReveal(page)

  return (
    <SiteLayout toggleTheme={toggleTheme} theme={theme}>
      <Page />
    </SiteLayout>
  )
}
