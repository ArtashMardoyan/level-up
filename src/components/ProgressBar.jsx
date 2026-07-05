export default function ProgressBar({ done, total }) {
  const pct = total ? Math.round((done / total) * 100) : 0
  return (
    <div className="progress-wrap">
      <div className="progress-bar-bg">
        <div className="progress-bar-fill" style={{ width: pct + '%' }} />
      </div>
      <div className="progress-text">{done} / {total} marked as reviewed</div>
    </div>
  )
}
