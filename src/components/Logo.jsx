export default function Logo({ size = 40 }) {
  return (
    <svg aria-label="Level Up logo" viewBox="0 0 64 64" height={size} width={size} role="img">
      <defs>
        <linearGradient id="logo-g" x1="0" y1="1" x2="0" y2="0">
          <stop stopColor="#6f9bd8" offset="0" />
          <stop stopColor="#4caf6f" offset="1" />
        </linearGradient>
      </defs>
      <rect fill="#1f2228" height="64" width="64" rx="14" />
      <path
        d="M18 50 L32 36 L46 50"
        strokeLinejoin="round"
        stroke="url(#logo-g)"
        strokeLinecap="round"
        strokeWidth="8"
        opacity="0.45"
        fill="none"
      />
      <path
        d="M18 30 L32 16 L46 30"
        strokeLinejoin="round"
        stroke="url(#logo-g)"
        strokeLinecap="round"
        strokeWidth="8"
        fill="none"
      />
    </svg>
  )
}
