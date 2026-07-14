import { useLanguage } from '../hooks/useLanguage'

export default function Logo({ size = 30 }) {
  const { t } = useLanguage()

  return (
    <svg aria-label={t('logoAria')} className="brand-logo" viewBox="0 0 30 30" height={size} width={size} role="img">
      <defs>
        <linearGradient id="logo-g" x1="0.1" x2="0.9" y1="0" y2="1">
          <stop stopColor="#818cf8" offset="0" />
          <stop stopColor="#6366f1" offset="1" />
        </linearGradient>
      </defs>
      <rect fill="url(#logo-g)" height="30" width="30" rx="9" />
      <g
        transform="translate(9 9) scale(0.5)"
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeWidth="2.4"
        stroke="#fff"
        fill="none"
      >
        <path d="m17 11-5-5-5 5" />
        <path d="m17 18-5-5-5 5" />
      </g>
    </svg>
  )
}
