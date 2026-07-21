// The Features "payoff": the four parts shown as one loop that turns around the
// user's goal. Presentational and responsive; the sequence is announced to screen
// readers via an aria-label on the ring.
export default function LoopDiagram({ takeaway, caption, stages, center }) {
  const ariaLabel = `A loop: ${stages.join(', then ')}, then back to the start — all around ${center}.`

  return (
    <div className="mkt-loop">
      <div className="mkt-loop-ring" aria-label={ariaLabel} role="img">
        {stages.map((stage, index) => (
          <div className="mkt-loop-stage" key={stage}>
            <span className="mkt-loop-node">{stage}</span>
            <span className="mkt-loop-arrow" aria-hidden="true">
              {index === stages.length - 1 ? '↻' : '→'}
            </span>
          </div>
        ))}
      </div>
      <p className="mkt-loop-center" aria-hidden="true">
        everything turns around <strong>{center}</strong>
      </p>
      <p className="mkt-loop-caption">{caption}</p>
      <p className="mkt-loop-takeaway">{takeaway}</p>
    </div>
  )
}
