// The small mono uppercase label that opens a section.
export default function Eyebrow({ children }) {
  return (
    <p className="mkt-eyebrow">
      <span className="mkt-dot" aria-hidden="true" />
      {children}
    </p>
  )
}
