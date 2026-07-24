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

  // A "Practice weak areas" click preselects a course and asks the backend for an
  // adaptive pick (docs/product/interview/007/009). It survives the hash change to
  // #interview/new because this container stays mounted across it. A plain "New"
  // click clears it back to a normal setup.
  const [startIntent, setStartIntent] = useState(null)

  const goHome = () => onNavigate('interview')
  const goSetup = () => {
    setStartIntent(null)
    onNavigate('interview', 'new')
  }
  const practiceWeak = (courseSlug) => {
    setStartIntent({ adaptive: true, courseSlug })
    onNavigate('interview', 'new')
  }
  // Onboarding placement (M3): a short, server-fixed assessment that seeds the new
  // user's Focus areas. Course chosen on the setup screen (no preselect).
  const startPlacement = () => {
    setStartIntent({ placement: true })
    onNavigate('interview', 'new')
  }
  const goHistory = () => onNavigate('interview', 'history')
  const openSession = (id) => onNavigate('interview', id)
  const browseCourses = () => onNavigate('courses')

  if (!user) {
    return <InterviewHome onRequireAuth={onRequireAuth} courses={courses} />
  }

  if (sessionId === 'new') {
    return (
      <InterviewSetup
        placement={startIntent?.placement || false}
        initialCourseId={startIntent?.courseSlug}
        adaptive={startIntent?.adaptive || false}
        onStarted={openSession}
        onHistory={goHistory}
        courses={courses}
        onBack={goHome}
      />
    )
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
      onStartPlacement={startPlacement}
      onBrowseCourses={browseCourses}
      onPracticeWeak={practiceWeak}
      onOpenSession={openSession}
      onContinue={openSession}
      onHistory={goHistory}
      onStartNew={goSetup}
      courses={courses}
    />
  )
}
