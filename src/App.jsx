import { useState } from 'react'
import { COURSES, getCourse } from './data/courses'
import { useTheme } from './hooks/useTheme'
import { useSpeech } from './hooks/useSpeech'
import CourseSelect from './components/CourseSelect'
import GlobalSearch from './components/GlobalSearch'
import PrepView from './components/PrepView'
import SettingsPanel from './components/SettingsPanel'

const COURSE_STORAGE_KEY = 'interviewPrepCourse'

function loadSelectedCourseId() {
  try {
    const id = localStorage.getItem(COURSE_STORAGE_KEY)
    return getCourse(id)?.questions?.length > 0 ? id : null
  } catch {
    return null
  }
}

export default function App() {
  const { theme, toggleTheme } = useTheme()
  const { speak, speakingId, voices, voiceName, setVoiceName } = useSpeech()
  const [courseId, setCourseId] = useState(loadSelectedCourseId)
  const [jumpToId, setJumpToId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  const selectCourse = (id, questionId = null) => {
    setCourseId(id)
    setJumpToId(questionId)
    try { localStorage.setItem(COURSE_STORAGE_KEY, id) } catch { /* ignore */ }
  }

  const backToCourses = () => {
    setCourseId(null)
    setJumpToId(null)
    try { localStorage.removeItem(COURSE_STORAGE_KEY) } catch { /* ignore */ }
  }

  const course = courseId ? getCourse(courseId) : null

  const settings = (
    <SettingsPanel
      theme={theme}
      toggleTheme={toggleTheme}
      voices={voices}
      voiceName={voiceName}
      setVoiceName={setVoiceName}
    />
  )

  if (!course) {
    return (
      <div className="wrap">
        {settings}
        <h1>Level Up</h1>
        <div className="subtitle">Choose your path to interview-ready</div>
        <GlobalSearch
          courses={COURSES}
          term={searchTerm}
          onTermChange={setSearchTerm}
          onSelectQuestion={selectCourse}
        />
        {!searchTerm.trim() && <CourseSelect courses={COURSES} onSelect={selectCourse} />}
        <footer>Made for interview practice &middot; works fully offline</footer>
      </div>
    )
  }

  return (
    <>
      {settings}
      <PrepView
        course={course}
        onBack={backToCourses}
        speak={speak}
        speakingId={speakingId}
        voices={voices}
        voiceName={voiceName}
        jumpToId={jumpToId}
      />
    </>
  )
}
