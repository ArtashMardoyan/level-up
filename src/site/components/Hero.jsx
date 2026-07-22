import Cta from './Cta'
import Eyebrow from './Eyebrow'

// The page hero: eyebrow + h1 + sub, with optional primary/secondary CTAs and a
// micro-note. `primary`/`secondary` are { label, href } or { label, onClick }.
// `media` (optional) renders a second column beside the text (used on Home).
export default function Hero({ secondary, eyebrow, primary, title, media, note, sub }) {
  return (
    <section className="mkt-hero">
      <div className={'mkt-wrap mkt-hero-inner' + (media ? ' has-media' : '')}>
        <div className="mkt-hero-text">
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          <h1 className="mkt-h1">{title}</h1>
          {sub && <p className="mkt-hero-sub">{sub}</p>}
          {(primary || secondary) && (
            <div className="mkt-cta-row">
              {primary && (
                <Cta onClick={primary.onClick} href={primary.href}>
                  {primary.label}
                </Cta>
              )}
              {secondary && (
                <Cta onClick={secondary.onClick} href={secondary.href} variant="ghost">
                  {secondary.label}
                </Cta>
              )}
            </div>
          )}
          {note && <p className="mkt-note">{note}</p>}
        </div>
        {media && <div className="mkt-hero-media">{media}</div>}
      </div>
    </section>
  )
}
