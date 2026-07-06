export default function Logo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Level Up logo">
      <defs>
        <linearGradient id="logo-g" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#6f9bd8" />
          <stop offset="1" stopColor="#4caf6f" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="#1f2228" />
      <path d="M18 50 L32 36 L46 50" fill="none" stroke="url(#logo-g)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" opacity="0.45" />
      <path d="M18 30 L32 16 L46 30" fill="none" stroke="url(#logo-g)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}