// A labeled row of track chips (e.g. "By role — Backend · Frontend · …").
export default function TrackChips({ label, items }) {
  return (
    <div className="mkt-chips">
      <span className="mkt-chip-label">{label}</span>
      {items.map((item) => (
        <span className="mkt-chip" key={item}>
          {item}
        </span>
      ))}
    </div>
  )
}
