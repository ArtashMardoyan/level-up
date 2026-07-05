import { useEffect, useRef, useState } from 'react'

export default function QuestionCard({ item, isFavorite, isReviewed, quizMode, forceOpen, onToggleFavorite, onOpen, speak, speakingId, speechLocked, autoOpen }) {
  const [open, setOpen] = useState(false)
  const [answerVisible, setAnswerVisible] = useState(false)
  const [bonusVisible, setBonusVisible] = useState(false)
  const [copied, setCopied] = useState(false)
  const prevForceOpen = useRef(forceOpen)
  const cardRef = useRef(null)

  useEffect(() => {
    if (!autoOpen) return
    setOpen(true)
    if (!isReviewed) onOpen(item.id)
    cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpen])

  useEffect(() => {
    if (forceOpen !== prevForceOpen.current) {
      prevForceOpen.current = forceOpen
      setOpen(forceOpen)
      if (forceOpen && !isReviewed) onOpen(item.id)
      if (!forceOpen) {
        setAnswerVisible(false)
        setBonusVisible(false)
      }
    }
  }, [forceOpen, isReviewed, item.id, onOpen])

  const handleToggle = () => {
    const next = !open
    setOpen(next)
    if (next && !isReviewed) onOpen(item.id)
    if (!next) {
      setAnswerVisible(false)
      setBonusVisible(false)
    }
  }

  const handleCopy = (e) => {
    e.stopPropagation()
    navigator.clipboard.writeText(item.answer).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    }).catch(() => {})
  }

  const questionSpeakId = item.id + ':q'
  const answerSpeakId = item.id + ':a'
  const isQuestionSpeaking = speakingId === questionSpeakId
  const isAnswerSpeaking = speakingId === answerSpeakId

  return (
    <div className="card" ref={cardRef}>
      <button className="q-header" onClick={handleToggle}>
        <div className="q-header-row">
          <span className="q-title">
            {item.question}
            {isReviewed && <span className="check">&#10003;</span>}
          </span>
          <span
            className={'speak-btn' + (isQuestionSpeaking ? ' active' : '') + (speechLocked ? ' disabled' : '')}
            role="button"
            aria-label="Read question aloud"
            aria-disabled={speechLocked}
            onClick={(e) => {
              e.stopPropagation()
              if (speechLocked) return
              speak(questionSpeakId, item.question)
            }}
          >
            {isQuestionSpeaking ? '⏹' : '🔊'}
          </span>
          <span
            className={'star-btn' + (isFavorite ? ' active' : '')}
            role="button"
            aria-label="Toggle favorite"
            onClick={(e) => {
              e.stopPropagation()
              onToggleFavorite(item.id)
            }}
          >
            {isFavorite ? '★' : '☆'}
          </span>
          <span className={'arrow' + (open ? ' open' : '')}>&#9662;</span>
        </div>
      </button>
      <div className="a-body" style={{ maxHeight: open ? '3000px' : '0px' }}>
        <div className="a-inner">
          {quizMode ? (
            <>
              <button className="copy-btn" onClick={(e) => { e.stopPropagation(); setAnswerVisible((v) => !v) }}>
                {answerVisible ? 'Hide answer' : 'Show answer'}
              </button>
              {answerVisible && <div style={{ whiteSpace: 'pre-line' }}>{item.answer}</div>}
            </>
          ) : (
            <div style={{ whiteSpace: 'pre-line' }}>{item.answer}</div>
          )}
          <div>
            <button className="copy-btn" onClick={handleCopy}>{copied ? 'Copied!' : 'Copy answer'}</button>
            <button
              className="copy-btn"
              disabled={speechLocked}
              onClick={(e) => { e.stopPropagation(); speak(answerSpeakId, item.answer) }}
            >
              {isAnswerSpeaking ? '⏹ Stop' : '🔊 Read answer'}
            </button>
            {item.bonus && (
              <button className="copy-btn" onClick={(e) => { e.stopPropagation(); setBonusVisible((v) => !v) }}>
                {bonusVisible ? 'Hide bonus' : 'Show bonus'}
              </button>
            )}
          </div>
          {item.bonus && bonusVisible && (
            <div className="bonus-box">
              <span className="bonus-tag">Bonus</span>
              <div style={{ whiteSpace: 'pre-line' }}>{item.bonus}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
