import Logo from './Logo'
import { useLanguage } from '../hooks/useLanguage'

// Brand marks aren't in lucide — inline the exact paths from the design.
const GithubIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" height="17" width="17">
    <path d="M12 2C6.5 2 2 6.6 2 12.3c0 4.5 2.9 8.3 6.8 9.7.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.4-3.4-1.4-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.6-1.4-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1a9.3 9.3 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.3 4.7-4.6 5 .4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5 4-1.4 6.8-5.2 6.8-9.7C22 6.6 17.5 2 12 2z" />
  </svg>
)
const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" height="15" width="15">
    <path d="M18.2 2h3.3l-7.2 8.3L23 22h-6.6l-5.2-6.8L5.3 22H2l7.7-8.8L1.5 2h6.8l4.7 6.2L18.2 2zm-1.2 18h1.8L7.1 3.9H5.2L17 20z" />
  </svg>
)
const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" height="17" width="17">
    <path d="M21.9 4.3 18.5 20c-.2 1.1-.9 1.4-1.8.9l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.3-4.9L17.6 6c.4-.3-.1-.5-.6-.2L5.9 12.7l-4.8-1.5c-1-.3-1-1 .2-1.5l18.7-7.2c.9-.3 1.6.2 1.3 1.8z" />
  </svg>
)

export default function AppFooter({ onNavigate }) {
  const { t } = useLanguage()

  const columns = [
    {
      links: [
        { labelKey: 'footerLinkAllCourses', onClick: () => onNavigate(null) },
        { onClick: () => onNavigate('dictionary'), labelKey: 'footerLinkDictionary' },
        { onClick: () => onNavigate('dictionary', 'todaysChallenge'), labelKey: 'footerLinkDaily' },
        { labelKey: 'footerLinkSaved' }
      ],
      headingKey: 'footerColPractice'
    },
    {
      links: [
        { labelKey: 'footerLinkStudyGuide' },
        { labelKey: 'footerLinkRoadmaps' },
        { labelKey: 'footerLinkChangelog' }
      ],
      headingKey: 'footerColResources'
    },
    {
      links: [{ labelKey: 'footerLinkAbout' }, { labelKey: 'footerLinkContact' }, { labelKey: 'footerLinkFeedback' }],
      headingKey: 'footerColCompany'
    }
  ]

  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-brand">
          <div className="footer-brand-row">
            <Logo size={28} />
            <span className="footer-brand-name">Level Up</span>
          </div>
          <p className="footer-tagline">{t('footerTagline')}</p>
          <div className="footer-social">
            <a onClick={(e) => e.preventDefault()} className="footer-social-btn" aria-label="GitHub" href="#">
              <GithubIcon />
            </a>
            <a onClick={(e) => e.preventDefault()} className="footer-social-btn" aria-label="X" href="#">
              <XIcon />
            </a>
            <a onClick={(e) => e.preventDefault()} className="footer-social-btn" aria-label="Telegram" href="#">
              <TelegramIcon />
            </a>
          </div>
        </div>
        <div className="footer-cols">
          {columns.map((col) => (
            <div className="footer-col" key={col.headingKey}>
              <div className="footer-col-head">{t(col.headingKey)}</div>
              <div className="footer-col-links">
                {col.links.map((link) => (
                  <button disabled={!link.onClick} className="footer-link" onClick={link.onClick} key={link.labelKey}>
                    {t(link.labelKey)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="footer-bottom">
        <span className="footer-copy">{t('footerCopyright')}</span>
        <div className="footer-legal">
          <button className="footer-link">{t('footerPrivacy')}</button>
          <button className="footer-link">{t('footerTerms')}</button>
        </div>
      </div>
    </footer>
  )
}
