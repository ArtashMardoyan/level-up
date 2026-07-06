import { useState, useMemo } from 'react'

import { useLanguage } from '../hooks/useLanguage'

function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function InterviewMode({ questions }) {
  const { t } = useLanguage()
  const [queue, setQueue] = useState(() => shuffle(questions))
  const [index, setIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)

  const restart = () => {
    setQueue(shuffle(questions))
    setIndex(0)
    setShowAnswer(false)
  }

  const next = () => {
    setIndex((i) => i + 1)
    setShowAnswer(false)
  }

  const current = queue[index]
  const done = index >= queue.length

  const content = useMemo(() => {
    if (done) return null
    return current
  }, [current, done])

  if (done) {
    return (
      <div className="interview-stage">
        <div className="qtext">{t('interviewDone')}</div>
        <button onClick={restart}>{t('restart')}</button>
      </div>
    )
  }

  return (
    <div className="interview-stage">
      <div className="qnum">{t('questionOf', { total: queue.length, n: index + 1 })}</div>
      <div className="qtext">{content.question}</div>
      <button onClick={() => setShowAnswer(true)}>{t('showAnswer')}</button>
      <button onClick={next}>{t('skipNext')}</button>
      {showAnswer && (
        <div className="a-inner">
          <div style={{ whiteSpace: 'pre-line' }}>{content.answer}</div>
          {content.bonus && (
            <div className="bonus-box">
              <span className="bonus-tag">{t('bonus')}</span>
              <div style={{ whiteSpace: 'pre-line' }}>{content.bonus}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
