import { HOME } from '../content'
import Cta from '../components/Cta'
import Hero from '../components/Hero'
import Section from '../components/Section'
import CardGrid from '../components/CardGrid'
import StepFlow from '../components/StepFlow'
import TrackChips from '../components/TrackChips'

// In-page scroll (not a hash link, since the hash is the router). Smooth unless the
// user prefers reduced motion.
function scrollToHow() {
  const el = document.getElementById('how')
  if (!el) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
}

export default function HomePage() {
  const c = HOME

  return (
    <>
      <Hero
        secondary={{ label: c.hero.secondary, onClick: scrollToHow }}
        primary={{ label: c.hero.primary, href: '#interview' }}
        eyebrow={c.hero.eyebrow}
        title={c.hero.title}
        note={c.hero.note}
        sub={c.hero.sub}
      />

      <Section>
        <p className="mkt-gap-lead">
          {c.gap.lead} <span className="mkt-fade">{c.gap.leadFade}</span>
        </p>
        <div className="mkt-gap-grid">
          {c.gap.items.map((item) => (
            <div className="mkt-gap-item" key={item.title}>
              <h2 className="mkt-gap-title">{item.title}</h2>
              <p className="mkt-gap-body">{item.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section eyebrow={c.roadmap.eyebrow} title={c.roadmap.title} lead={c.roadmap.lead} id="how">
        <StepFlow steps={c.roadmap.steps} />
        <div className="mkt-center">
          <Cta href="#interview">{c.roadmap.cta}</Cta>
        </div>
      </Section>

      <Section eyebrow={c.inside.eyebrow} title={c.inside.title}>
        <CardGrid cards={c.inside.cards} />
      </Section>

      <Section eyebrow={c.who.eyebrow} title={c.who.title}>
        <p className="mkt-who-lead">{c.who.lead}</p>
        <div className="mkt-who-list">
          <div className="mkt-who-item">
            <h3 className="mkt-who-title">{c.who.tracksTitle}</h3>
            <TrackChips items={c.who.tracks.role} label="By role" />
            <TrackChips items={c.who.tracks.stack} label="By stack" />
          </div>
          <div className="mkt-who-item">
            <h3 className="mkt-who-title">{c.who.levels}</h3>
          </div>
          <div className="mkt-who-item">
            <h3 className="mkt-who-title">{c.who.eslTitle}</h3>
            <p className="mkt-who-body">{c.who.esl}</p>
          </div>
        </div>
      </Section>

      <Section eyebrow={c.visionTeaser.eyebrow} title={c.visionTeaser.title} tone="alt">
        {c.visionTeaser.body.map((paragraph) => (
          <p className="mkt-lead" key={paragraph}>
            {paragraph}
          </p>
        ))}
        <a className="mkt-arrow-link" href="#vision">
          {c.visionTeaser.link} →
        </a>
      </Section>

      <Section tone="center">
        <h2 className="mkt-final-title">{c.finalCta.title}</h2>
        <p className="mkt-final-sub">{c.finalCta.sub}</p>
        <div className="mkt-center">
          <Cta href="#interview">{c.finalCta.primary}</Cta>
        </div>
        <p className="mkt-note mkt-note-center">{c.finalCta.note}</p>
      </Section>
    </>
  )
}
