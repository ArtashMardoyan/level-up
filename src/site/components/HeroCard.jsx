import { useEffect, useState } from 'react'

const LANG_PILLS = [
  { flag: '🇬🇧', active: true, code: 'ENG' },
  { flag: '🇷🇺', code: 'RUS' },
  { flag: '🇦🇲', code: 'ARM' }
]

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Counts a number from 0 to `target` once, easing out. When the user prefers reduced
// motion the value starts at `target` (no animation), so the effect never needs to
// set state synchronously.
function useCountUp(target, duration = 1500, delay = 350) {
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0))

  useEffect(() => {
    if (prefersReducedMotion()) return
    let raf = 0
    let start = 0
    const step = (now) => {
      if (!start) start = now
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(eased * target))
      if (t < 1) raf = requestAnimationFrame(step)
    }
    const timer = setTimeout(() => {
      raf = requestAnimationFrame(step)
    }, delay)
    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(raf)
    }
  }, [target, duration, delay])

  return value
}

// A product-truthful mock of the interview experience for the Home hero: language
// pills, a question, a typed answer with a blinking caret, and a live rubric score
// whose ring fills and number counts up on load. Decorative — hidden from AT.
export default function HeroCard({ card }) {
  const score = useCountUp(88)

  return (
    <div className="mkt-herocard" aria-hidden="true">
      <div className="mkt-herocard-bar">
        <span className="mkt-dotr r" />
        <span className="mkt-dotr y" />
        <span className="mkt-dotr g" />
        <span className="mkt-herocard-tab">{card.tab}</span>
      </div>
      <div className="mkt-herocard-body">
        <div className="mkt-herocard-langs">
          {LANG_PILLS.map((l) => (
            <span className={'mkt-herocard-lang' + (l.active ? ' active' : '')} key={l.code}>
              {l.flag} {l.code}
            </span>
          ))}
        </div>
        <div>
          <div className="mkt-herocard-qn">{card.questionLabel}</div>
          <div className="mkt-herocard-q">{card.question}</div>
        </div>
        <div className="mkt-herocard-answer">
          {card.answerPre}
          <code>{card.answerCode}</code>
          {card.answerPost}
          <span className="mkt-caret" />
        </div>
        <div className="mkt-herocard-score">
          <div className="mkt-score-ring">
            <div className="mkt-score-num">{score}</div>
          </div>
          <div className="mkt-score-rows">
            <div className="mkt-score-row">
              <span>{card.correctness}</span>
              <span className="mkt-score-val">{card.correctnessValue}</span>
            </div>
            <div className="mkt-score-row">
              <span>{card.communication}</span>
              <span className="mkt-score-val">{card.communicationValue}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
