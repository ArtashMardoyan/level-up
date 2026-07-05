function BackendIcon() {
  return (
    <svg viewBox="0 0 24 24" width="32" height="32" aria-hidden="true">
      <rect x="3" y="4" width="18" height="6" rx="1.5" fill="var(--accent)" />
      <rect x="3" y="14" width="18" height="6" rx="1.5" fill="var(--accent)" opacity="0.55" />
      <circle cx="7" cy="7" r="1" fill="var(--card-bg)" />
      <circle cx="7" cy="17" r="1" fill="var(--card-bg)" />
    </svg>
  )
}

function FrontendIcon() {
  return (
    <svg viewBox="0 0 24 24" width="32" height="32" aria-hidden="true">
      <rect x="2.5" y="4" width="19" height="16" rx="2" fill="none" stroke="var(--accent)" strokeWidth="1.6" />
      <line x1="2.5" y1="8.5" x2="21.5" y2="8.5" stroke="var(--accent)" strokeWidth="1.6" />
      <circle cx="5.5" cy="6.25" r="0.7" fill="var(--accent)" />
      <circle cx="7.7" cy="6.25" r="0.7" fill="var(--accent)" />
      <circle cx="9.9" cy="6.25" r="0.7" fill="var(--accent)" />
    </svg>
  )
}

function DevOpsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="32" height="32" aria-hidden="true">
      <path
        d="M7 8a4 4 0 1 0 0 8c2.5 0 4-2 5-4s2.5-4 5-4a4 4 0 1 1 0 8c-2.5 0-4-2-5-4s-2.5-4-5-4Z"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function QaIcon() {
  return (
    <svg viewBox="0 0 24 24" width="32" height="32" aria-hidden="true">
      <g stroke="#7a2a26" strokeWidth="1.4">
        <line x1="6" y1="10" x2="2.5" y2="8" />
        <line x1="6" y1="14" x2="2.5" y2="14" />
        <line x1="6" y1="18" x2="2.5" y2="20" />
        <line x1="18" y1="10" x2="21.5" y2="8" />
        <line x1="18" y1="14" x2="21.5" y2="14" />
        <line x1="18" y1="18" x2="21.5" y2="20" />
      </g>
      <ellipse cx="12" cy="13.5" rx="6" ry="7" fill="#e0554f" />
      <line x1="12" y1="7" x2="12" y2="20" stroke="#7a2a26" strokeWidth="1" />
      <circle cx="12" cy="6.5" r="2.2" fill="#e0554f" />
      <circle cx="10.8" cy="6" r="0.5" fill="#7a2a26" />
      <circle cx="13.2" cy="6" r="0.5" fill="#7a2a26" />
    </svg>
  )
}

function NodeJsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="32" height="32" aria-hidden="true">
      <path d="M12 2 20.66 7 20.66 17 12 22 3.34 17 3.34 7Z" fill="#539E43" />
    </svg>
  )
}

function GoIcon() {
  return (
    <svg viewBox="0 0 24 24" width="32" height="32" aria-hidden="true">
      <circle cx="8.5" cy="8" r="2.2" fill="#00ADD8" />
      <circle cx="15.5" cy="8" r="2.2" fill="#00ADD8" />
      <circle cx="12" cy="13" r="9" fill="#00ADD8" />
      <ellipse cx="8.7" cy="11.7" rx="2" ry="2.6" fill="#fff" />
      <ellipse cx="15.3" cy="11.7" rx="2" ry="2.6" fill="#fff" />
      <circle cx="8.9" cy="12.4" r="0.9" fill="#111" />
      <circle cx="15.1" cy="12.4" r="0.9" fill="#111" />
    </svg>
  )
}

function ReactIcon() {
  return (
    <svg viewBox="0 0 24 24" width="32" height="32" aria-hidden="true">
      <circle cx="12" cy="12" r="2.2" fill="#61dafb" />
      <g stroke="#61dafb" strokeWidth="1.4" fill="none">
        <ellipse cx="12" cy="12" rx="10" ry="4.2" />
        <ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(60 12 12)" />
        <ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(120 12 12)" />
      </g>
    </svg>
  )
}

function NextJsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="32" height="32" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="var(--text)" />
      <path d="M8.5 7.5v9h1.6v-6.4l6 6.4h1.7l-7.6-9H8.5Z" fill="var(--card-bg)" />
      <rect x="14.7" y="7.5" width="1.5" height="6.5" fill="var(--card-bg)" />
    </svg>
  )
}

const LOGO_ICONS = {
  'backend-senior': BackendIcon,
  frontend: FrontendIcon,
  devops: DevOpsIcon,
  qa: QaIcon,
  nodejs: NodeJsIcon,
  go: GoIcon,
  react: ReactIcon,
  nextjs: NextJsIcon,
}

export default function CourseIcon({ courseId, emoji }) {
  const LogoIcon = LOGO_ICONS[courseId]
  if (LogoIcon) return <LogoIcon />
  return <>{emoji}</>
}
