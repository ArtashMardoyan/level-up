import Cta from './components/Cta'
import Hero from './components/Hero'
import Section from './components/Section'
import FaqList from './components/FaqList'
import HeroCard from './components/HeroCard'
import CardGrid from './components/CardGrid'
import StepFlow from './components/StepFlow'
import WhoCards from './components/WhoCards'
import LoopDiagram from './components/LoopDiagram'
import { useSiteStrings } from './hooks/useSiteStrings'
import LanguageSection from './components/LanguageSection'

// In-page smooth scroll to a section id (honors reduced motion).
function scrollToId(id) {
  const el = document.getElementById(id)
  if (!el) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
}

// The whole marketing site as one scrolling page, in the Claude Design section order.
export default function SitePage() {
  const s = useSiteStrings()

  return (
    <>
      <Hero
        secondary={{ onClick: () => scrollToId('how'), label: s.ui.seeHow }}
        primary={{ href: '#interview', label: s.ui.cta }}
        media={<HeroCard card={s.heroCard} />}
        eyebrow={s.hero.eyebrow}
        title={s.hero.title}
        sub={s.hero.sub}
        note={s.ui.free}
      />

      <Section>
        <p className="mkt-gap-lead">
          {s.gap.lead} <span className="mkt-fade">{s.gap.leadFade}</span>
        </p>
        <div className="mkt-gap-grid">
          {s.gap.items.map((item) => (
            <div className="mkt-gap-item" key={item.title}>
              <h2 className="mkt-gap-title">{item.title}</h2>
              <p className="mkt-gap-body">{item.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section eyebrow={s.roadmap.eyebrow} title={s.roadmap.title} lead={s.roadmap.lead} id="how">
        <StepFlow steps={s.roadmap.steps} />
        <div className="mkt-center">
          <Cta href="#interview">{s.roadmap.cta}</Cta>
        </div>
      </Section>

      <Section eyebrow={s.inside.eyebrow} title={s.inside.title} id="features" tone="alt">
        <CardGrid cards={s.inside.cards} />
      </Section>

      <LanguageSection language={s.language} />

      <Section title={s.loop.title} tone="center">
        <LoopDiagram
          takeaway={s.loop.takeaway}
          caption={s.loop.caption}
          stages={s.loop.stages}
          center={s.loop.center}
        />
      </Section>

      <Section eyebrow={s.who.eyebrow} title={s.who.title}>
        <p className="mkt-who-lead">{s.who.lead}</p>
        <WhoCards who={s.who} />
      </Section>

      <Section eyebrow={s.vision.eyebrow} title={s.vision.title} id="vision" tone="alt">
        <div className="mkt-vision-head">
          <p className="mkt-body mkt-strong">{s.vision.lead}</p>
          <p className="mkt-body">{s.vision.body}</p>
        </div>
        <div className="mkt-belief-list">
          {s.vision.beliefs.map((b) => (
            <div className="mkt-belief" key={b.title}>
              <h3 className="mkt-belief-title">{b.title}</h3>
              <p className="mkt-belief-body">{b.body}</p>
            </div>
          ))}
        </div>
        <p className="mkt-body mkt-vision-closing">{s.vision.closing}</p>
      </Section>

      <Section eyebrow={s.faq.eyebrow} title={s.faq.title} lead={s.faq.intro} id="faq">
        <FaqList items={s.faq.items} />
      </Section>

      <Section tone="center">
        <div className="mkt-final-glow" aria-hidden="true" />
        <div className="mkt-final-inner">
          <h2 className="mkt-final-title">{s.finalCta.title}</h2>
          <p className="mkt-final-sub">{s.finalCta.sub}</p>
          <div className="mkt-center">
            <Cta href="#interview">{s.finalCta.cta}</Cta>
          </div>
          <p className="mkt-note mkt-note-center">{s.finalCta.free}</p>
        </div>
      </Section>
    </>
  )
}
