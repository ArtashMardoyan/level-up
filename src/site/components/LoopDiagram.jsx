// The Features "payoff": the four parts as one loop turning around the user's
// goal — a rotating ring with the goal at the center and the four stages placed
// N/E/S/W. Decorative ring; the sequence is announced via aria-label.
export default function LoopDiagram({ takeaway, caption, stages, center }) {
  const ariaLabel = `A loop: ${stages.join(', then ')}, then back to the start — all turning around ${center}.`
  const positions = ['top', 'right', 'bottom', 'left']

  return (
    <div className="mkt-loop">
      <div className="mkt-loop-ring" aria-label={ariaLabel} role="img">
        <span className="mkt-loop-track" aria-hidden="true" />
        <span className="mkt-loop-goal">{center}</span>
        {stages.map((stage, index) => (
          <span className={'mkt-loop-node pos-' + positions[index % 4]} key={stage}>
            {stage}
          </span>
        ))}
      </div>
      <p className="mkt-loop-caption">{caption}</p>
      <p className="mkt-loop-takeaway">{takeaway}</p>
    </div>
  )
}
