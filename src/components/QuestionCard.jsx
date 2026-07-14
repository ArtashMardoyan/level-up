import { useEffect, useState, useRef } from 'react'
import { ChevronDown, Volume2, Check, Star } from 'lucide-react'

import { useLanguage } from '../hooks/useLanguage'

export default function QuestionCard({
  onToggleFavorite,
  isFavorite,
  isReviewed,
  forceOpen,
  quizMode,
  autoOpen,
  onOpen,
  onPlay,
  item
}) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [answerVisible, setAnswerVisible] = useState(false)
  const [bonusVisible, setBonusVisible] = useState(false)
  const [copied, setCopied] = useState(false)
  const [prevForceOpen, setPrevForceOpen] = useState(forceOpen)
  const [prevAutoOpen, setPrevAutoOpen] = useState(false)
  const cardRef = useRef(null)

  // Sync with "Expand/Collapse all" by adjusting state during render
  // (https://react.dev/learn/you-might-not-need-an-effect).
  if (forceOpen !== prevForceOpen) {
    setPrevForceOpen(forceOpen)
    setOpen(forceOpen)
    if (!forceOpen) {
      setAnswerVisible(false)
      setBonusVisible(false)
    }
  }

  if (autoOpen !== prevAutoOpen) {
    setPrevAutoOpen(autoOpen)
    if (autoOpen) setOpen(true)
  }

  useEffect(() => {
    if (!autoOpen) return
    if (!isReviewed) onOpen(item.id)
    cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpen])

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
    navigator.clipboard
      .writeText(item.answer)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1200)
      })
      .catch(() => {})
  }

  return (
    <div className="card" ref={cardRef}>
      <button onClick={handleToggle} className="q-header">
        <div className="q-header-row">
          <span className="q-title">
            {item.question}
            {isReviewed && <Check aria-hidden="true" className="check" size={15} />}
          </span>
          <span
            onClick={(e) => {
              e.stopPropagation()
              onPlay(item.id)
            }}
            aria-label={t('playQuestionAria')}
            className="speak-btn"
            role="button"
          >
            <Volume2 aria-hidden="true" size={17} />
          </span>
          <span
            onClick={(e) => {
              e.stopPropagation()
              onToggleFavorite(item.id)
            }}
            className={'star-btn' + (isFavorite ? ' active' : '')}
            aria-label={t('favoriteAria')}
            role="button"
          >
            <Star fill={isFavorite ? 'currentColor' : 'none'} aria-hidden="true" size={17} />
          </span>
          <ChevronDown className={'arrow' + (open ? ' open' : '')} aria-hidden="true" size={18} />
        </div>
      </button>
      <div style={{ maxHeight: open ? '3000px' : '0px' }} className="a-body">
        <div className="a-inner">
          {quizMode ? (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setAnswerVisible((v) => !v)
                }}
                className="copy-btn"
              >
                {answerVisible ? t('hideAnswer') : t('showAnswer')}
              </button>
              {answerVisible && <div style={{ whiteSpace: 'pre-line' }}>{item.answer}</div>}
            </>
          ) : (
            <div style={{ whiteSpace: 'pre-line' }}>{item.answer}</div>
          )}
          <div className="a-actions">
            <button className="copy-btn" onClick={handleCopy}>
              {copied ? t('copied') : t('copyAnswer')}
            </button>
            {item.bonus && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setBonusVisible((v) => !v)
                }}
                className="copy-btn"
              >
                {bonusVisible ? t('hideBonus') : t('showBonus')}
              </button>
            )}
          </div>
          {item.bonus && bonusVisible && (
            <div className="bonus-box">
              <span className="bonus-tag">{t('bonus')}</span>
              <div style={{ whiteSpace: 'pre-line' }}>{item.bonus}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
