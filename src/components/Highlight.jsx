// Renders `text` with the given [start, end) character ranges wrapped in <mark>.
// Falls back to the plain string when there are no ranges.
export default function Highlight({ ranges, text }) {
  if (!ranges || ranges.length === 0) return text

  const parts = []
  let cursor = 0
  ranges.forEach(([start, end], i) => {
    if (cursor < start) parts.push(text.slice(cursor, start))
    parts.push(
      <mark className="hl" key={i}>
        {text.slice(start, end)}
      </mark>
    )
    cursor = end
  })
  if (cursor < text.length) parts.push(text.slice(cursor))

  return <>{parts}</>
}
