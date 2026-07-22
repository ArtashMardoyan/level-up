import { useLanguage } from '../hooks/useLanguage'

export default function Logo({ className = 'brand-logo', size = 30 }) {
  const { t } = useLanguage()

  return (
    <svg aria-label={t('logoAria')} className={className} viewBox="0 0 32 32" height={size} width={size} role="img">
      <defs>
        <linearGradient id="logo-g" x1="0.1" x2="0.9" y1="0" y2="1">
          <stop stopColor="#818cf8" offset="0" />
          <stop stopColor="#6366f1" offset="1" />
        </linearGradient>
      </defs>
      <rect fill="url(#logo-g)" height="32" width="32" rx="7" />
      <g strokeLinejoin="round" strokeLinecap="round" strokeWidth="3" stroke="#fff" fill="none">
        <path d="M22 15l-6-6-6 6" />
        <path d="M22 23l-6-6-6 6" />
      </g>
    </svg>
  )
}
