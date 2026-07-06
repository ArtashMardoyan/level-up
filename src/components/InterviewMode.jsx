import { useState, useMemo } from 'react'

function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function InterviewMode({ questions }) {
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
        <div className="qtext">Done! You went through all questions.</div>
        <button onClick={restart}>Restart</button>
      </div>
    )
  }

  return (
    <div className="interview-stage">
      <div className="qnum">
        Question {index + 1} of {queue.length}
      </div>
      <div className="qtext">{content.question}</div>
      <button onClick={() => setShowAnswer(true)}>Show answer</button>
      <button onClick={next}>Skip / next</button>
      {showAnswer && (
        <div className="a-inner">
          <div style={{ whiteSpace: 'pre-line' }}>{content.answer}</div>
          {content.bonus && (
            <div className="bonus-box">
              <span className="bonus-tag">Bonus</span>
              <div style={{ whiteSpace: 'pre-line' }}>{content.bonus}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
