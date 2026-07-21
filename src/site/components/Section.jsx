import Eyebrow from './Eyebrow'

// A page section with an optional head (eyebrow / heading / lead). `tone` adds a
// visual variant: 'alt' = subtle surface band, 'center' = centered content.
export default function Section({ children, eyebrow, title, lead, tone, id }) {
  const hasHead = eyebrow || title || lead

  return (
    <section className={'mkt-section' + (tone ? ' mkt-tone-' + tone : '')} id={id}>
      <div className="mkt-wrap">
        {hasHead && (
          <div className="mkt-sec-head">
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
            {title && <h2 className="mkt-h2">{title}</h2>}
            {lead && <p className="mkt-lead">{lead}</p>}
          </div>
        )}
        {children}
      </div>
    </section>
  )
}
