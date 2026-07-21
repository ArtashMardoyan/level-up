import Cta from '../components/Cta'
import { VISION } from '../content'
import Hero from '../components/Hero'
import Section from '../components/Section'

export default function VisionPage() {
  const c = VISION

  return (
    <>
      <Hero eyebrow={c.hero.eyebrow} title={c.hero.title} sub={c.hero.sub} />

      <Section title={c.why.title}>
        <p className="mkt-lead mkt-strong">{c.why.lead}</p>
        <p className="mkt-body">{c.why.body}</p>
      </Section>

      <Section title={c.believe.title} tone="alt">
        <div className="mkt-belief-list">
          {c.believe.items.map((item) => (
            <div className="mkt-belief" key={item.title}>
              <h3 className="mkt-belief-title">{item.title}</h3>
              <p className="mkt-belief-body">{item.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title={c.going.title}>
        {c.going.body.map((paragraph) => (
          <p className="mkt-body" key={paragraph}>
            {paragraph}
          </p>
        ))}
      </Section>

      <Section tone="center">
        <h2 className="mkt-final-title">{c.close.title}</h2>
        <div className="mkt-center">
          <Cta href="#interview">{c.close.primary}</Cta>
        </div>
        <p className="mkt-note mkt-note-center">{c.close.note}</p>
      </Section>
    </>
  )
}
