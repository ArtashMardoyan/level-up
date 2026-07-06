import { useEffect, useState } from 'react'
import { COURSES, getCourse } from './data/courses'
import { useTheme } from './hooks/useTheme'
import { useSpeech } from './hooks/useSpeech'
import { useHashRoute } from './hooks/useHashRoute'
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
  const { voices, voiceName, setVoiceName } = useSpeech()
  const { courseId, jumpToId, navigate } = useHashRoute()
  const [searchTerm, setSearchTerm] = useState('')

  // No course in the URL yet (fresh visit with no shared link) - resume the last one.
  useEffect(() => {
    if (!courseId) {
      const saved = loadSelectedCourseId()
      if (saved) navigate(saved)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    try {
      if (courseId) localStorage.setItem(COURSE_STORAGE_KEY, courseId)
      else localStorage.removeItem(COURSE_STORAGE_KEY)
    } catch { /* ignore */ }
  }, [courseId])

  const selectCourse = (id, questionId = null) => navigate(id, questionId)
  const backToCourses = () => navigate(null)

  const course = courseId ? getCourse(courseId) : null
  const validCourse = course?.questions?.length > 0 ? course : null

  const settings = (
    <SettingsPanel
      theme={theme}
      toggleTheme={toggleTheme}
      voices={voices}
      voiceName={voiceName}
      setVoiceName={setVoiceName}
    />
  )

  if (!validCourse) {
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
        course={validCourse}
        onBack={backToCourses}
        voices={voices}
        voiceName={voiceName}
        jumpToId={jumpToId}
      />
    </>
  )
}
