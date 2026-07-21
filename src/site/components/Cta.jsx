// A single call-to-action, as a real link (hash navigation) or a button (in-page
// actions like scroll). Variant controls the visual weight.
export default function Cta({ variant = 'primary', children, onClick, href }) {
  const className = 'mkt-btn mkt-btn-' + variant

  if (href) {
    return (
      <a className={className} href={href}>
        {children}
      </a>
    )
  }

  return (
    <button className={className} onClick={onClick} type="button">
      {children}
    </button>
  )
}
