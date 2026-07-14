// Monochrome line icons per course, drawn in `currentColor` so they take the
// accent color of the tinted tile they sit in (see .course-tile in index.css).
const stroke = {
  strokeLinejoin: 'round',
  strokeLinecap: 'round',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  fill: 'none'
}

function BackendIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke} {...props}>
      <rect width="18" height="7" rx="2" x="3" y="4" />
      <rect width="18" height="7" y="13" rx="2" x="3" />
      <path d="M7 7.5h.01M7 16.5h.01" />
    </svg>
  )
}

function FrontendIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke} {...props}>
      <rect height="16" width="18" rx="2" x="3" y="4" />
      <path d="M3 9h18" />
      <path d="M6.5 6.5h.01M9 6.5h.01" />
    </svg>
  )
}

function DevOpsIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke} {...props}>
      <path d="M6 8c-2.2 0-4 1.8-4 4s1.8 4 4 4c3 0 5-8 8-8 2.2 0 4 1.8 4 4s-1.8 4-4 4c-3 0-5-8-8-8z" />
    </svg>
  )
}

function QaIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke} {...props}>
      <path d="M8 6a4 4 0 0 1 8 0" />
      <rect height="10" width="12" rx="6" x="6" y="8" />
      <path d="M12 8v10M6 12H3M21 12h-3M6 16l-2.5 2M18 16l2.5 2M6 9 3.5 7.2M18 9l2.5-2" />
    </svg>
  )
}

function NodeJsIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke} {...props}>
      <path d="M12 2 3.5 7v10L12 22l8.5-5V7L12 2z" />
    </svg>
  )
}

function GoIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <text
        fontFamily="'Space Grotesk', sans-serif"
        letterSpacing="-0.5"
        textAnchor="middle"
        fontWeight="700"
        fontSize="12.5"
        y="16.5"
        x="12"
      >
        Go
      </text>
    </svg>
  )
}

function ReactIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke} strokeWidth="1.7" {...props}>
      <circle cx="12" cy="12" r="1.6" />
      <ellipse cx="12" cy="12" rx="10" ry="4" />
      <ellipse transform="rotate(60 12 12)" cx="12" cy="12" rx="10" ry="4" />
      <ellipse transform="rotate(120 12 12)" cx="12" cy="12" rx="10" ry="4" />
    </svg>
  )
}

function NextJsIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke} {...props}>
      <path d="M12 3 21 19H3L12 3z" />
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

export default function CourseIcon({ size = 24, courseId, emoji }) {
  const LogoIcon = LOGO_ICONS[courseId]
  if (LogoIcon) return <LogoIcon height={size} width={size} />
  return <>{emoji}</>
}
