import { BarChart3, Layers, Globe } from 'lucide-react'

import TrackChips from './TrackChips'

// The three "Who it's for" cards, each with an icon and a small supporting visual:
// tracks (role/stack chips), a junior→senior bar chart, and second-language flags.
export default function WhoCards({ who }) {
  return (
    <div className="mkt-who-cards">
      <article className="mkt-whocard">
        <span className="mkt-whocard-icon" aria-hidden="true">
          <Layers size={21} />
        </span>
        <h3 className="mkt-whocard-title">{who.tracksTitle}</h3>
        <TrackChips items={who.tracks.role} label={who.byRole} />
        <TrackChips items={who.tracks.stack} label={who.byStack} />
        <p className="mkt-whocard-note">{who.tracksNote}</p>
      </article>

      <article className="mkt-whocard">
        <span className="mkt-whocard-icon" aria-hidden="true">
          <BarChart3 size={21} />
        </span>
        <h3 className="mkt-whocard-title">{who.levels}</h3>
        <div className="mkt-levelbars" aria-hidden="true">
          {who.levelBars.map((label, index) => (
            <div className="mkt-levelbar" key={label}>
              <div className={'mkt-levelbar-fill lvl-' + index} />
              <span className="mkt-levelbar-label">{label}</span>
            </div>
          ))}
        </div>
      </article>

      <article className="mkt-whocard">
        <span className="mkt-whocard-icon" aria-hidden="true">
          <Globe size={21} />
        </span>
        <h3 className="mkt-whocard-title">{who.eslTitle}</h3>
        <p className="mkt-whocard-body">{who.esl}</p>
        <div className="mkt-flagtiles">
          {who.eslFlags.map((f) => (
            <div className="mkt-flagtile" key={f.code}>
              <span className="mkt-flagtile-flag">{f.flag}</span>
              <span className="mkt-flagtile-code">{f.code}</span>
            </div>
          ))}
        </div>
      </article>
    </div>
  )
}
