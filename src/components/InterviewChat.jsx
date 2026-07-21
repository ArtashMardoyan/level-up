import { useEffect, useState, useRef } from 'react'
import { ArrowRight, Sparkles, Square, Send, Bot, Mic } from 'lucide-react'

import CourseIcon from './CourseIcon'
import { useLanguage } from '../hooks/useLanguage'
import { STREAMING_CHAT } from '../config/features'
import {
  interviewSubmitAnswerStream,
  interviewSubmitAnswer,
  interviewTranscribe,
  interviewComplete,
  interviewGet
} from '../services/endpoints'

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

// Number of bars in the live recording waveform.
const METER_BARS = 24

function formatTime(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function InterviewChat({ onComplete, sessionId, initial, course }) {
  const { t } = useLanguage()

  const [messages, setMessages] = useState(() => initialMessages(initial))
  const [current, setCurrent] = useState(initial.current || null)
  const [finished, setFinished] = useState(Boolean(initial.finished))
  const [answer, setAnswer] = useState('')
  const [thinking, setThinking] = useState(false)
  const [reconnecting, setReconnecting] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [error, setError] = useState(null)
  const [chatHeight, setChatHeight] = useState(() => `calc(100dvh - ${headerHeight()}px)`)
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  const logRef = useRef(null)
  const inputRef = useRef(null)
  const stickRef = useRef(true)
  const abortRef = useRef(null)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const meterRef = useRef(null)
  const audioCtxRef = useRef(null)
  const rafRef = useRef(null)
  const timerRef = useRef(null)

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
  }, [messages, thinking, reconnecting])

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

  // Tears down the live audio meter + elapsed timer started with a recording.
  const stopMeter = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (timerRef.current) clearInterval(timerRef.current)
    audioCtxRef.current?.close().catch(() => {})
    rafRef.current = null
    timerRef.current = null
    audioCtxRef.current = null
  }

  // Release the mic + tear down the meter if the component unmounts mid-recording,
  // and abort any in-flight answer stream (docs/product/ai-chat/009).
  useEffect(() => {
    return () => {
      recorderRef.current?.stream?.getTracks().forEach((track) => track.stop())
      abortRef.current?.abort()
      stopMeter()
    }
  }, [])

  const onLogScroll = () => {
    const el = logRef.current
    if (el) stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120
  }

  // Submit routes to the streaming or blocking path by feature flag (docs/product/ai-chat/012
  // Phase 3). With the flag off, submitBlocking is the original, unchanged behavior.
  const submit = (skipped) => (STREAMING_CHAT ? submitStreaming(skipped) : submitBlocking(skipped))

  const submitBlocking = (skipped) => {
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

  // Recover a dropped or errored stream by rebuilding the chat from the server —
  // the backend is the source of truth, and the transcript always re-derives from
  // GET /interviews/:id (docs/product/ai-chat/009/011). Drops any partial streaming bubble
  // and shows a brief "reconnecting" state instead of recovering silently.
  const recoverViaRefetch = (streamId) => {
    if (streamId) setMessages((prev) => prev.filter((m) => m.id !== streamId))
    setThinking(false)
    setReconnecting(true)
    interviewGet(sessionId)
      .then((view) => {
        setMessages(initialMessages(view))
        setCurrent(view.current || null)
        setFinished(Boolean(view.finished))
      })
      .catch(() => setError(t('interviewSubmitError')))
      .finally(() => setReconnecting(false))
  }

  // Streaming submit (SSE). The next question renders as it arrives — token deltas
  // in Phase 4, a single done today (docs/product/ai-chat/010) — into a live bubble that is
  // reconciled to the canonical server text on completion. Any error recovers via a
  // full re-fetch rather than surfacing a hard failure (docs/product/ai-chat/011).
  const submitStreaming = (skipped) => {
    if (!current || thinking) return
    const text = skipped ? '' : answer.trim()
    if (!skipped && !text) return

    const q = current
    stickRef.current = true
    setMessages((prev) => [...prev, { id: q.questionId + ':a', kind: 'answer', role: 'user', skipped, text }])
    setAnswer('')
    setThinking(true)
    setError(null)

    const controller = new AbortController()
    abortRef.current = controller
    const streamId = q.questionId + ':stream'
    let opened = false

    // Swap the thinking dots for a growing bubble on the first token.
    const openBubble = () => {
      if (opened) return
      opened = true
      setThinking(false)
      setMessages((prev) => [...prev, { kind: 'question', streaming: true, id: streamId, role: 'ai', text: '' }])
    }

    interviewSubmitAnswerStream(
      sessionId,
      q.questionId,
      { skipped: Boolean(skipped), answer: text },
      {
        onDone: (data) => {
          if (data.next) {
            const bubble = {
              id: data.next.questionId + ':q',
              text: questionText(data.next),
              kind: 'question',
              role: 'ai'
            }
            // Replace the streaming bubble with the canonical turn, or append it when
            // no delta ever opened one (single-done backend).
            setMessages((prev) =>
              prev.some((m) => m.id === streamId)
                ? prev.map((m) => (m.id === streamId ? bubble : m))
                : [...prev, bubble]
            )
            setCurrent(data.next)
          } else {
            setMessages((prev) => prev.filter((m) => m.id !== streamId))
            setCurrent(null)
            setFinished(true)
          }
          setThinking(false)
        },
        onDelta: (chunk) => {
          openBubble()
          setMessages((prev) => prev.map((m) => (m.id === streamId ? { ...m, text: m.text + chunk } : m)))
        },
        onError: () => recoverViaRefetch(streamId),
        signal: controller.signal
      }
    )
      .catch(() => {
        if (controller.signal.aborted) return
        recoverViaRefetch(streamId)
      })
      .finally(() => {
        abortRef.current = null
      })
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
      interviewTranscribe(blob, initial.session.language)
        .then((res) => setAnswer((prev) => (prev ? prev + ' ' : '') + res.transcript))
        .catch(() => setError(t('interviewTranscribeError')))
        .finally(() => setTranscribing(false))
    }

    recorderRef.current = recorder
    recorder.start()
    setRecording(true)
    setElapsed(0)
    startMeter(stream)
  }

  // Drives the live waveform + MM:SS timer while recording. The bar heights are
  // written straight to the DOM each animation frame (no per-frame re-render);
  // only the once-a-second elapsed counter goes through React state.
  const startMeter = (stream) => {
    const started = Date.now()
    timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 500)

    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 64
      ctx.createMediaStreamSource(stream).connect(analyser)
      audioCtxRef.current = ctx

      const freq = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        analyser.getByteFrequencyData(freq)
        const bars = meterRef.current?.children
        if (bars) {
          for (let i = 0; i < bars.length; i++) {
            const v = freq[i + 1] / 255 // skip the DC bin; 0..1
            bars[i].style.transform = `scaleY(${Math.max(0.08, v)})`
          }
        }
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    } catch {
      /* Web Audio unavailable — the timer + pulsing dot still show. */
    }
  }

  const stopRecording = () => {
    recorderRef.current?.stop()
    setRecording(false)
    stopMeter()
  }

  const seeResults = () => {
    setCompleting(true)
    setError(null)
    interviewComplete(sessionId)
      .then((res) => onComplete(res?.newBadges || []))
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
            <div className={'aic-bubble ' + m.kind + (m.streaming ? ' streaming' : '')}>
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
        {reconnecting && (
          <div className="aic-bubble-row ai">
            <span className="aic-bot-avatar">
              <Bot aria-hidden="true" size={17} />
            </span>
            <div className="aic-reconnecting" aria-live="polite">
              {t('interviewReconnecting')}
            </div>
          </div>
        )}
      </div>

      {error && <div className="aic-error-note aic-chat-error">{error}</div>}

      {current && !finished && (
        <div className="aic-composer">
          {recording ? (
            <div className="aic-recording" aria-live="polite">
              <span className="aic-recording-dot" aria-hidden="true" />
              <span className="aic-recording-time">{formatTime(elapsed)}</span>
              <div className="aic-recording-meter" aria-hidden="true" ref={meterRef}>
                {Array.from({ length: METER_BARS }).map((_, i) => (
                  <span className="aic-recording-bar" key={i} />
                ))}
              </div>
              <span className="aic-recording-hint">{t('interviewRecordingHint')}</span>
            </div>
          ) : (
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
          )}
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
