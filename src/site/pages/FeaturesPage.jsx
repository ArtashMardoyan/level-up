import Cta from '../components/Cta'
import Hero from '../components/Hero'
import { FEATURES } from '../content'
import Section from '../components/Section'
import LoopDiagram from '../components/LoopDiagram'

export default function FeaturesPage() {
  const c = FEATURES

  return (
    <>
      <Hero eyebrow={c.hero.eyebrow} title={c.hero.title} sub={c.hero.sub} />

      <Section>
        <div className="mkt-cap-list">
          {c.capabilities.map((cap) => (
            <article className="mkt-cap" key={cap.title}>
              <h2 className="mkt-cap-title">{cap.title}</h2>
              <p className="mkt-cap-body">{cap.body}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section title={c.loop.title} tone="alt">
        <LoopDiagram
          takeaway={c.loop.takeaway}
          caption={c.loop.caption}
          stages={c.loop.stages}
          center={c.loop.center}
        />
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
