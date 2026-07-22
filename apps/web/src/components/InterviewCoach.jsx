import { useEffect, useState } from 'react'

import { useAuth } from '../hooks/useAuth'
import InterviewChat from './InterviewChat'
import InterviewHome from './InterviewHome'
import InterviewSetup from './InterviewSetup'
import InterviewResults from './InterviewResults'
import InterviewHistory from './InterviewHistory'
import { interviewGet } from '../services/endpoints'

// Loads a single session and shows Chat or Results based on its status. Mounted
// with key={sessionId} so each session gets fresh state (no sync setState in an
// effect — the repo bars that; state changes happen only in async callbacks).
function SessionRunner({ sessionId, goHistory, courses, goSetup }) {
  const [view, setView] = useState(null)
  const [status, setStatus] = useState('loading')
  const [showResults, setShowResults] = useState(false)
  const [newBadges, setNewBadges] = useState([])

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
    return <InterviewHistory courses={courses} onBack={goSetup} onOpen={goSetup} onNew={goSetup} />
  }

  const course = courses.find((c) => c.uuid === view.session.courseId || c.id === view.session.courseId) || null

  if (showResults) {
    return (
      <InterviewResults
        sessionId={sessionId}
        newBadges={newBadges}
        onBack={goHistory}
        onNew={goSetup}
        course={course}
      />
    )
  }

  const onComplete = (badges) => {
    setNewBadges(badges || [])
    setShowResults(true)
  }

  return <InterviewChat onComplete={onComplete} sessionId={sessionId} course={course} initial={view} />
}

// Container for the AI Interview Coach. Routing is hash-based via `sessionId`
// (the second hash segment): none = Home dashboard, "new" = Setup, "history" =
// History, otherwise a real session id (Chat/Results). Guests see the home's
// signed-out state.
export default function InterviewCoach({ onRequireAuth, onNavigate, sessionId, courses }) {
  const { user } = useAuth()

  const goHome = () => onNavigate('interview')
  const goSetup = () => onNavigate('interview', 'new')
  const goHistory = () => onNavigate('interview', 'history')
  const openSession = (id) => onNavigate('interview', id)
  const browseCourses = () => onNavigate('courses')

  if (!user) {
    return <InterviewHome onRequireAuth={onRequireAuth} courses={courses} />
  }

  if (sessionId === 'new') {
    return <InterviewSetup onStarted={openSession} onHistory={goHistory} courses={courses} onBack={goHome} />
  }

  if (sessionId === 'history') {
    return <InterviewHistory onOpen={openSession} courses={courses} onBack={goHome} onNew={goSetup} />
  }

  if (sessionId) {
    return (
      <SessionRunner sessionId={sessionId} goHistory={goHistory} courses={courses} goSetup={goSetup} key={sessionId} />
    )
  }

  return (
    <InterviewHome
      onBrowseCourses={browseCourses}
      onOpenSession={openSession}
      onContinue={openSession}
      onHistory={goHistory}
      onStartNew={goSetup}
      courses={courses}
    />
  )
}
