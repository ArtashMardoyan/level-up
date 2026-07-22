import { ChevronRight } from 'lucide-react'

// A single call-to-action, as a real link (hash navigation) or a button (in-page
// actions like scroll). The primary variant carries a chevron; the ghost variant
// is a quiet underlined text action.
export default function Cta({ variant = 'primary', children, onClick, href }) {
  const className = 'mkt-btn mkt-btn-' + variant
  const inner = (
    <>
      {children}
      {variant === 'primary' && <ChevronRight aria-hidden="true" size={17} />}
    </>
  )

  if (href) {
    return (
      <a className={className} href={href}>
        {inner}
      </a>
    )
  }

  return (
    <button className={className} onClick={onClick} type="button">
      {inner}
    </button>
  )
}
