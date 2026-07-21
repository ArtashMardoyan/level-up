import { FAQ } from '../content'
import Cta from '../components/Cta'
import Hero from '../components/Hero'
import Section from '../components/Section'
import FaqList from '../components/FaqList'

export default function FaqPage() {
  const c = FAQ

  return (
    <>
      <Hero title="Questions & answers" eyebrow="FAQ" sub={c.intro} />

      <Section>
        <FaqList items={c.items} />
      </Section>

      <Section tone="center">
        <h2 className="mkt-final-title">{c.cta.title}</h2>
        <div className="mkt-center">
          <Cta href="#interview">{c.cta.primary}</Cta>
        </div>
        <p className="mkt-note mkt-note-center">{c.cta.note}</p>
      </Section>
    </>
  )
}
