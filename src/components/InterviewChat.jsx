import { useEffect, useState, useRef } from 'react'
import { ArrowRight, Sparkles, Square, Send, Bot, Mic } from 'lucide-react'

import CourseIcon from './CourseIcon'
import { useLanguage } from '../hooks/useLanguage'
import { interviewSubmitAnswer, interviewTranscribe, interviewComplete } from '../services/endpoints'

// A real interviewer doesn't grade out loud mid-chat — the AI's natural, score-free
// reaction to the previous answer is folded into the same bubble as the next
// question, instead of a separate "feedback" message. Empty for question 1.
function questionText(q) {
  return q.reaction ? q.reaction + '\n\n' + q.question : q.question
}

// Build the initial chat bubbles from a resumed session view.
function initialMessages(view) {
  const msgs = []
  for (const turn of view.history || []) {
    msgs.push({ id: turn.question.questionId + ':q', text: questionText(turn.question), kind: 'question', role: 'ai' })
    msgs.push({
      text: turn.result.skipped ? '' : turn.result.userAnswer,
      id: turn.question.questionId + ':a',
      skipped: turn.result.skipped,
      kind: 'answer',
      role: 'user'
    })
  }
  if (view.current) {
    msgs.push({ id: view.current.questionId + ':q', text: questionText(view.current), kind: 'question', role: 'ai' })
  }
  return msgs
}

// Height of the app header, so the chat can fill exactly the space below it.
function headerHeight() {
  if (typeof document === 'undefined') return 68
  return document.querySelector('.app-header')?.offsetHeight || 68
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
  const [chatHeight, setChatHeight] = useState(() => `calc(100dvh - ${headerHeight()}px)`)
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)

  const logRef = useRef(null)
  const inputRef = useRef(null)
  const stickRef = useRef(true)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])

  const total = initial.session.questionCount
  const answered = current ? current.index : total
  const currentNumber = current ? current.index + 1 : total
  const pct = total ? Math.round((answered / total) * 100) : 0
  const accent = course?.accent || '#818cf8'
  const courseTitle = course?.title || ''

  // Keep the chat sized to the viewport below the (variable-height) header.
  useEffect(() => {
    const measure = () => setChatHeight(`calc(100dvh - ${headerHeight()}px)`)
    const raf = requestAnimationFrame(measure)
    window.addEventListener('resize', measure)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', measure)
    }
  }, [])

  // Auto-scroll the message list to the newest bubble — but only when the user
  // is already near the bottom, so scrolling up to re-read isn't interrupted.
  useEffect(() => {
    const el = logRef.current
    if (el && stickRef.current) el.scrollTop = el.scrollHeight
  }, [messages, thinking])

  // Focus the answer box whenever a new question is shown.
  useEffect(() => {
    if (current && !thinking) inputRef.current?.focus()
  }, [current, thinking])

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

  // Release the mic if the component unmounts mid-recording (e.g. navigating away).
  useEffect(() => {
    return () => {
      recorderRef.current?.stream?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  const onLogScroll = () => {
    const el = logRef.current
    if (el) stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120
  }

  const submit = (skipped) => {
    if (!current || thinking) return
    const text = skipped ? '' : answer.trim()
    if (!skipped && !text) return

    const q = current
    stickRef.current = true
    setMessages((prev) => [...prev, { id: q.questionId + ':a', kind: 'answer', role: 'user', skipped, text }])
    setAnswer('')
    setThinking(true)
    setError(null)

    interviewSubmitAnswer(sessionId, q.questionId, { skipped: Boolean(skipped), answer: text })
      .then((res) => {
        if (res.next) {
          setMessages((prev) => [
            ...prev,
            { id: res.next.questionId + ':q', text: questionText(res.next), kind: 'question', role: 'ai' }
          ])
          setCurrent(res.next)
        } else {
          setCurrent(null)
          setFinished(true)
        }
      })
      .catch(() => setError(t('interviewSubmitError')))
      .finally(() => setThinking(false))
  }

  const onKeyDown = (e) => {
    // Enter sends, Shift+Enter makes a new line (standard chat behaviour).
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit(false)
    }
  }

  // Voice answers transcribe to text (Whisper) rather than attach raw audio —
  // grading is text-based either way, and this lets the candidate review/edit
  // the transcript in the composer before submitting like any typed answer.
  const startRecording = async () => {
    setError(null)
    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setError(t('interviewMicError'))
      return
    }

    const recorder = new MediaRecorder(stream)
    chunksRef.current = []
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop())
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType })
      setTranscribing(true)
      interviewTranscribe(blob)
        .then((res) => setAnswer((prev) => (prev ? prev + ' ' : '') + res.transcript))
        .catch(() => setError(t('interviewTranscribeError')))
        .finally(() => setTranscribing(false))
    }

    recorderRef.current = recorder
    recorder.start()
    setRecording(true)
  }

  const stopRecording = () => {
    recorderRef.current?.stop()
    setRecording(false)
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
    <main style={{ '--aic-accent': accent, height: chatHeight }} className="aic aic-chat">
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

      <div className="aic-chat-log" onScroll={onLogScroll} ref={logRef}>
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
      </div>

      {error && <div className="aic-error-note aic-chat-error">{error}</div>}

      {current && !finished && (
        <div className="aic-composer">
          <textarea
            placeholder={transcribing ? t('interviewTranscribing') : t('interviewAnswerPlaceholder')}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={thinking || transcribing}
            className="aic-composer-input"
            onKeyDown={onKeyDown}
            value={answer}
            ref={inputRef}
            rows={3}
          />
          <div className="aic-composer-actions">
            <button
              onClick={() => setAnswer(current.modelAnswer || '')}
              disabled={thinking || recording || transcribing}
              className="aic-ghost-btn small"
              type="button"
            >
              <Sparkles aria-hidden="true" size={14} /> {t('interviewSample')}
            </button>
            <div className="aic-composer-right">
              <button
                disabled={thinking || recording || transcribing}
                className="aic-ghost-btn small"
                onClick={() => submit(true)}
                type="button"
              >
                {t('interviewSkip')}
              </button>
              <button
                className={'aic-ghost-btn small aic-record-btn' + (recording ? ' recording' : '')}
                aria-label={recording ? t('interviewStopRecording') : t('interviewRecord')}
                onClick={recording ? stopRecording : startRecording}
                disabled={thinking || transcribing}
                type="button"
              >
                {recording ? (
                  <>
                    <Square aria-hidden="true" size={14} />{' '}
                    <span className="aic-record-btn-label">{t('interviewStopRecording')}</span>
                  </>
                ) : (
                  <>
                    <Mic aria-hidden="true" size={14} />{' '}
                    <span className="aic-record-btn-label">{t('interviewRecord')}</span>
                  </>
                )}
              </button>
              <button
                disabled={thinking || recording || transcribing || !answer.trim()}
                className="aic-primary-btn aic-submit-btn"
                aria-label={t('interviewSubmit')}
                onClick={() => submit(false)}
                type="button"
              >
                <span className="aic-submit-btn-label">{t('interviewSubmit')}</span>{' '}
                <Send aria-hidden="true" size={15} />
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
