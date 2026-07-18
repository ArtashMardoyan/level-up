import { useEffect, useState, useRef } from 'react'
import { ArrowRight, Sparkles, Send, Bot } from 'lucide-react'

import CourseIcon from './CourseIcon'
import { useLanguage } from '../hooks/useLanguage'
import { interviewSubmitAnswer, interviewComplete } from '../services/endpoints'

// Build the initial chat bubbles from a resumed session view.
function initialMessages(view) {
  const msgs = []
  for (const turn of view.history || []) {
    msgs.push({ id: turn.question.questionId + ':q', text: turn.question.question, kind: 'question', role: 'ai' })
    msgs.push({
      text: turn.result.skipped ? '' : turn.result.userAnswer,
      id: turn.question.questionId + ':a',
      skipped: turn.result.skipped,
      kind: 'answer',
      role: 'user'
    })
    msgs.push({
      score: turn.result.skipped ? null : turn.result.score,
      id: turn.question.questionId + ':f',
      text: turn.result.feedback,
      kind: 'feedback',
      role: 'ai'
    })
  }
  if (view.current) {
    msgs.push({ id: view.current.questionId + ':q', text: view.current.question, kind: 'question', role: 'ai' })
  }
  return msgs
}

export default function InterviewChat({ onComplete, sessionId, initial, course }) {
  const { t } = useLanguage()

  const [messages, setMessages] = useState(() => initialMessages(initial))
  const [current, setCurrent] = useState(initial.current || null)
  const [finished, setFinished] = useState(Boolean(initial.finished))
  const [answer, setAnswer] = useState('')
  const [thinking, setThinking] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [error, setError] = useState(null)
  const bottomRef = useRef(null)

  const total = initial.session.questionCount
  const answered = messages.filter((m) => m.kind === 'feedback').length
  const currentNumber = current ? current.index + 1 : total
  const pct = total ? Math.round((answered / total) * 100) : 0
  const accent = course?.accent || '#818cf8'
  const courseTitle = course?.title || ''

  // Auto-scroll to the newest bubble.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, thinking])

  // Warn before leaving an in-progress interview.
  useEffect(() => {
    if (finished) return undefined
    const warn = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [finished])

  const submit = (skipped) => {
    if (!current || thinking) return
    const text = skipped ? '' : answer.trim()
    if (!skipped && !text) return

    const q = current
    setMessages((prev) => [...prev, { id: q.questionId + ':a', kind: 'answer', role: 'user', skipped, text }])
    setAnswer('')
    setThinking(true)
    setError(null)

    interviewSubmitAnswer(sessionId, q.questionId, { skipped: Boolean(skipped), answer: text })
      .then((res) => {
        setMessages((prev) => {
          const next = [
            ...prev,
            {
              score: res.result.skipped ? null : res.result.score,
              text: res.result.feedback,
              id: q.questionId + ':f',
              kind: 'feedback',
              role: 'ai'
            }
          ]
          if (res.next) {
            next.push({ id: res.next.questionId + ':q', text: res.next.question, kind: 'question', role: 'ai' })
          }
          return next
        })
        if (res.next) setCurrent(res.next)
        else {
          setCurrent(null)
          setFinished(true)
        }
      })
      .catch(() => setError(t('interviewSubmitError')))
      .finally(() => setThinking(false))
  }

  const seeResults = () => {
    setCompleting(true)
    setError(null)
    interviewComplete(sessionId)
      .then(() => onComplete())
      .catch(() => {
        setError(t('interviewCompleteError'))
        setCompleting(false)
      })
  }

  return (
    <main style={{ '--aic-accent': accent }} className="aic aic-chat">
      <div className="aic-chat-head">
        <span className="aic-chat-head-icon">
          <CourseIcon courseId={course?.id} emoji={course?.emoji} size={20} />
        </span>
        <div className="aic-chat-head-text">
          <div className="aic-chat-head-title">{t('interviewChatTitle', { course: courseTitle })}</div>
          <div className="aic-chat-head-meta">
            {t('difficulty_' + initial.session.difficulty)} · {t('interviewQuestionOf', { n: currentNumber, total })}
          </div>
        </div>
        <span className="aic-chat-head-pct">{pct}%</span>
      </div>
      <div className="aic-progress">
        <div className="aic-progress-fill" style={{ width: pct + '%' }} />
      </div>

      <div className="aic-chat-log">
        {messages.map((m) => (
          <div className={'aic-bubble-row ' + (m.role === 'user' ? 'user' : 'ai')} key={m.id}>
            {m.role === 'ai' && (
              <span className="aic-bot-avatar">
                <Bot aria-hidden="true" size={17} />
              </span>
            )}
            <div className={'aic-bubble ' + m.kind}>
              {m.kind === 'answer' && m.skipped ? (
                <span className="aic-skipped">{t('interviewSkipped')}</span>
              ) : (
                <span className="aic-bubble-text">{m.text}</span>
              )}
              {m.kind === 'feedback' && m.score != null && (
                <span className="aic-bubble-score">{t('interviewScore', { n: m.score })}</span>
              )}
            </div>
          </div>
        ))}
        {thinking && (
          <div className="aic-bubble-row ai">
            <span className="aic-bot-avatar">
              <Bot aria-hidden="true" size={17} />
            </span>
            <div className="aic-thinking">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && <div className="aic-error-note">{error}</div>}

      {current && !finished && (
        <div className="aic-composer">
          <textarea
            placeholder={t('interviewAnswerPlaceholder')}
            onChange={(e) => setAnswer(e.target.value)}
            className="aic-composer-input"
            disabled={thinking}
            value={answer}
            rows={3}
          />
          <div className="aic-composer-actions">
            <button
              onClick={() => setAnswer(current.modelAnswer || '')}
              className="aic-ghost-btn small"
              disabled={thinking}
              type="button"
            >
              <Sparkles aria-hidden="true" size={14} /> {t('interviewSample')}
            </button>
            <div className="aic-composer-right">
              <button className="aic-ghost-btn small" onClick={() => submit(true)} disabled={thinking} type="button">
                {t('interviewSkip')}
              </button>
              <button onClick={() => submit(false)} className="aic-primary-btn" disabled={thinking} type="button">
                {t('interviewSubmit')} <Send aria-hidden="true" size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {finished && (
        <div className="aic-done-card">
          <div className="aic-done-title">{t('interviewCompleteTitle')}</div>
          <div className="aic-done-body">{t('interviewCompleteBody', { total })}</div>
          <div className="aic-done-actions">
            <button className="aic-primary-btn" disabled={completing} onClick={seeResults} type="button">
              {completing ? t('interviewCompleting') : t('interviewSeeResults')}
              <ArrowRight aria-hidden="true" size={16} />
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
