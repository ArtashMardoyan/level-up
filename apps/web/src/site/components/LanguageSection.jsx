import { useEffect, useState } from 'react'

import Section from './Section'

// "Speak your language": three language cards. One is highlighted at a time, cycling
// every 2s to echo the trilingual interview. Cycling pauses under reduced motion
// (the first card stays highlighted).
export default function LanguageSection({ language }) {
  const [active, setActive] = useState(0)
  const count = language.langs.length

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => setActive((i) => (i + 1) % count), 2000)
    return () => clearInterval(id)
  }, [count])

  return (
    <Section eyebrow={language.eyebrow} title={language.title} tone="center-glow">
      <p className="mkt-lang-lead">{language.lead}</p>
      <div className="mkt-langgrid">
        {language.langs.map((l, index) => (
          <div className={'mkt-langcard' + (index === active ? ' active' : '')} key={l.code}>
            <div className="mkt-langcard-flag">{l.flag}</div>
            <div className="mkt-langcard-word">{l.word}</div>
            <div className="mkt-langcard-meta">
              <span className="mkt-langcard-name">{l.name}</span>
              <span className="mkt-langcard-code">{l.code}</span>
            </div>
          </div>
        ))}
      </div>
      <p className="mkt-lang-note">{language.note}</p>
    </Section>
  )
}
