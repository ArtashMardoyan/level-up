import { useEffect, useState } from 'react'

import { useAuth } from '../hooks/useAuth'
import InterviewChat from './InterviewChat'
import InterviewSetup from './InterviewSetup'
import InterviewResults from './InterviewResults'
import InterviewHistory from './InterviewHistory'
import { useLanguage } from '../hooks/useLanguage'
import { interviewGet } from '../services/endpoints'

// Loads a single session and shows Chat or Results based on its status. Mounted
// with key={sessionId} so each session gets fresh state (no sync setState in an
// effect — the repo bars that; state changes happen only in async callbacks).
function SessionRunner({ sessionId, goHistory, courses, goSetup }) {
  const { t } = useLanguage()
  const [view, setView] = useState(null)
  const [status, setStatus] = useState('loading')
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    let active = true
    interviewGet(sessionId)
      .then((v) => {
        if (!active) return
        setView(v)
        setStatus('ready')
        if (v?.session?.status === 'completed') setShowResults(true)
      })
      .catch(() => {
        if (active) setStatus('error')
      })
    return () => {
      active = false
    }
  }, [sessionId])

  if (status === 'loading') {
    return (
      <main className="aic">
        <div className="aic-loading">
          <div className="skeleton aic-skel-line" />
          <div className="skeleton aic-skel-line" />
          <div className="skeleton aic-skel-block" />
        </div>
      </main>
    )
  }

  if (status === 'error' || !view) {
    return (
      <main className="aic">
        <button className="profile-back" onClick={goSetup} type="button">
          {t('interviewBack')}
        </button>
        <div className="profile-empty-state">
          <h1>{t('interviewErrorTitle')}</h1>
          <p>{t('interviewErrorBody')}</p>
        </div>
      </main>
    )
  }

  const course = courses.find((c) => c.uuid === view.session.courseId || c.id === view.session.courseId) || null

  if (showResults) {
    return <InterviewResults sessionId={sessionId} onBack={goHistory} onNew={goSetup} course={course} />
  }

  return <InterviewChat onComplete={() => setShowResults(true)} sessionId={sessionId} course={course} initial={view} />
}

// Container for the AI Interview Coach. Routing is hash-based via `sessionId`
// (the second hash segment): none = Setup, "history" = History, otherwise a real
// session id. Guests get a sign-in prompt.
export default function InterviewCoach({ onNavigate, sessionId, courses }) {
  const { t } = useLanguage()
  const { user } = useAuth()

  const isHistory = sessionId === 'history'
  const isSession = Boolean(sessionId) && !isHistory

  const backHome = () => onNavigate(null)
  const goSetup = () => onNavigate('interview')
  const goHistory = () => onNavigate('interview', 'history')
  const openSession = (id) => onNavigate('interview', id)

  if (!user) {
    return (
      <main className="aic">
        <button className="profile-back" onClick={backHome} type="button">
          {t('interviewBack')}
        </button>
        <div className="profile-empty-state">
          <h1>{t('interviewSignedOutTitle')}</h1>
          <p>{t('interviewSignedOutBody')}</p>
        </div>
      </main>
    )
  }

  if (isHistory) {
    return <InterviewHistory onOpen={openSession} courses={courses} onBack={goSetup} onNew={goSetup} />
  }

  if (!isSession) {
    return <InterviewSetup onStarted={openSession} onHistory={goHistory} courses={courses} onBack={backHome} />
  }

  return (
    <SessionRunner sessionId={sessionId} goHistory={goHistory} courses={courses} goSetup={goSetup} key={sessionId} />
  )
}
