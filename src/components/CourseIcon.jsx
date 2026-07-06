function BackendIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" height="32" width="32">
      <rect fill="var(--accent)" width="18" height="6" rx="1.5" x="3" y="4" />
      <rect fill="var(--accent)" opacity="0.55" width="18" height="6" rx="1.5" y="14" x="3" />
      <circle fill="var(--card-bg)" cx="7" cy="7" r="1" />
      <circle fill="var(--card-bg)" cy="17" cx="7" r="1" />
    </svg>
  )
}

function FrontendIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" height="32" width="32">
      <rect stroke="var(--accent)" strokeWidth="1.6" height="16" fill="none" width="19" x="2.5" rx="2" y="4" />
      <line stroke="var(--accent)" strokeWidth="1.6" x2="21.5" x1="2.5" y1="8.5" y2="8.5" />
      <circle fill="var(--accent)" cy="6.25" cx="5.5" r="0.7" />
      <circle fill="var(--accent)" cy="6.25" cx="7.7" r="0.7" />
      <circle fill="var(--accent)" cy="6.25" cx="9.9" r="0.7" />
    </svg>
  )
}

function DevOpsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" height="32" width="32">
      <path
        d="M7 8a4 4 0 1 0 0 8c2.5 0 4-2 5-4s2.5-4 5-4a4 4 0 1 1 0 8c-2.5 0-4-2-5-4s-2.5-4-5-4Z"
        stroke="var(--accent)"
        strokeLinecap="round"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  )
}

function QaIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" height="32" width="32">
      <g strokeWidth="1.4" stroke="#7a2a26">
        <line x2="2.5" y1="10" x1="6" y2="8" />
        <line x2="2.5" y1="14" y2="14" x1="6" />
        <line x2="2.5" y1="18" y2="20" x1="6" />
        <line x2="21.5" x1="18" y1="10" y2="8" />
        <line x2="21.5" x1="18" y1="14" y2="14" />
        <line x2="21.5" x1="18" y1="18" y2="20" />
      </g>
      <ellipse fill="#e0554f" cy="13.5" cx="12" rx="6" ry="7" />
      <line stroke="#7a2a26" strokeWidth="1" x1="12" x2="12" y2="20" y1="7" />
      <circle fill="#e0554f" cy="6.5" cx="12" r="2.2" />
      <circle fill="#7a2a26" cx="10.8" r="0.5" cy="6" />
      <circle fill="#7a2a26" cx="13.2" r="0.5" cy="6" />
    </svg>
  )
}

function NodeJsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" height="32" width="32">
      <path d="M12 2 20.66 7 20.66 17 12 22 3.34 17 3.34 7Z" fill="#539E43" />
    </svg>
  )
}

function GoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" height="32" width="32">
      <circle fill="#00ADD8" cx="8.5" r="2.2" cy="8" />
      <circle fill="#00ADD8" cx="15.5" r="2.2" cy="8" />
      <circle fill="#00ADD8" cx="12" cy="13" r="9" />
      <ellipse fill="#fff" cy="11.7" cx="8.7" ry="2.6" rx="2" />
      <ellipse fill="#fff" cx="15.3" cy="11.7" ry="2.6" rx="2" />
      <circle fill="#111" cy="12.4" cx="8.9" r="0.9" />
      <circle fill="#111" cx="15.1" cy="12.4" r="0.9" />
    </svg>
  )
}

function ReactIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" height="32" width="32">
      <circle fill="#61dafb" cx="12" cy="12" r="2.2" />
      <g strokeWidth="1.4" stroke="#61dafb" fill="none">
        <ellipse ry="4.2" cx="12" cy="12" rx="10" />
        <ellipse transform="rotate(60 12 12)" ry="4.2" cx="12" cy="12" rx="10" />
        <ellipse transform="rotate(120 12 12)" ry="4.2" cx="12" cy="12" rx="10" />
      </g>
    </svg>
  )
}

function NextJsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" height="32" width="32">
      <circle fill="var(--text)" cx="12" cy="12" r="11" />
      <path d="M8.5 7.5v9h1.6v-6.4l6 6.4h1.7l-7.6-9H8.5Z" fill="var(--card-bg)" />
      <rect fill="var(--card-bg)" height="6.5" width="1.5" x="14.7" y="7.5" />
    </svg>
  )
}

const LOGO_ICONS = {
  frontend: FrontendIcon,
  backend: BackendIcon,
  devops: DevOpsIcon,
  nodejs: NodeJsIcon,
  nextjs: NextJsIcon,
  react: ReactIcon,
  qa: QaIcon,
  go: GoIcon
}

export default function CourseIcon({ courseId, emoji }) {
  const LogoIcon = LOGO_ICONS[courseId]
  if (LogoIcon) return <LogoIcon />
  return <>{emoji}</>
}
