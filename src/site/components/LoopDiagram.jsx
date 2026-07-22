// The Features "payoff": the four parts as one loop turning around the user's goal.
// A rotating arc runs the ring; the goal (logo + label) floats at the center; the
// four stages sit N/E/S/W and pulse in sequence. Decorative — the sequence is
// announced once via aria-label; the spinning arc + pulses respect reduced motion.

// Small stroked icon for each stage (paths only; shared svg wrapper).
function StageIcon({ paths }) {
  return (
    <svg
      strokeLinejoin="round"
      stroke="var(--brand)"
      strokeLinecap="round"
      viewBox="0 0 24 24"
      aria-hidden="true"
      strokeWidth="1.9"
      height="20"
      fill="none"
      width="20"
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}

const NODE_ICONS = {
  Practice: ['M9 2h6v12a3 3 0 0 1-6 0z', 'M5 10a7 7 0 0 0 14 0', 'M12 17v4'],
  Feedback: ['M12 2 15 8l6 .5-4.5 4 1.4 6L12 15l-5.9 3.5 1.4-6L3 8.5 9 8z'],
  Progress: ['M3 3v18h18', 'm7 15 3-4 4 3 5-7'],
  Study: ['M4 4h16v14H8l-4 3z', 'M8 9h8']
}

const POSITIONS = ['top', 'right', 'bottom', 'left']

export default function LoopDiagram({ takeaway, caption, stages, center }) {
  const ariaLabel = `A loop: ${stages.join(', then ')}, then back to the start — all turning around ${center}.`

  return (
    <div className="mkt-loop">
      <div className="mkt-loop-ring" aria-label={ariaLabel} role="img">
        <span className="mkt-loop-track" aria-hidden="true" />
        <span className="mkt-loop-arc" aria-hidden="true" />
        <span className="mkt-loop-center" aria-hidden="true">
          <svg className="mkt-loop-logo" viewBox="0 0 30 30" aria-hidden="true" height="38" width="38">
            <rect fill="url(#logo-g)" height="30" width="30" rx="9" />
            <g
              transform="translate(9 9) scale(0.5)"
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeWidth="2.4"
              stroke="#fff"
              fill="none"
            >
              <path d="m17 11-5-5-5 5" />
              <path d="m17 18-5-5-5 5" />
            </g>
          </svg>
          <span className="mkt-loop-goal">{center}</span>
        </span>
        {stages.map((stage, index) => (
          <span
            className={'mkt-loop-node pos-' + POSITIONS[index % 4]}
            style={{ '--mkt-node-delay': index * 1.5 + 's' }}
            key={stage}
          >
            <StageIcon paths={NODE_ICONS[stage] || []} />
            {stage}
          </span>
        ))}
      </div>
      <p className="mkt-loop-caption">{caption}</p>
      <p className="mkt-loop-takeaway">{takeaway}</p>
    </div>
  )
}
