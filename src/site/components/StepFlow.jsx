// The goal → interview-ready journey, rendered as an ordered, connected step flow.
// `key` steps (the concrete mock interview + feedback) are emphasized; `done` marks
// the final "interview-ready" node.
export default function StepFlow({ steps }) {
  return (
    <ol className="mkt-steps">
      {steps.map((step, index) => (
        <li className={'mkt-step' + (step.key ? ' key' : '') + (step.done ? ' done' : '')} key={step.title}>
          <span className="mkt-step-num" aria-hidden="true">
            {step.done ? '✓' : index + 1}
          </span>
          <div className="mkt-step-body">
            <h3 className="mkt-step-title">{step.title}</h3>
            {step.goal && <p className="mkt-step-goal">{step.goal}</p>}
            {step.body && <p className="mkt-step-desc">{step.body}</p>}
          </div>
        </li>
      ))}
    </ol>
  )
}
