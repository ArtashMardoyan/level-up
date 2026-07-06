import { useEffect } from 'react'
import { COURSES, getCourse } from './data/courses'
import { useTheme } from './hooks/useTheme'
import { useSpeech } from './hooks/useSpeech'
import { useHashRoute } from './hooks/useHashRoute'
import AppHeader from './components/AppHeader'
import CourseSelect from './components/CourseSelect'
import PrepView from './components/PrepView'

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

  return (
    <>
      <AppHeader
        courses={COURSES}
        onSelectQuestion={selectCourse}
        onHome={backToCourses}
        theme={theme}
        toggleTheme={toggleTheme}
        voices={voices}
        voiceName={voiceName}
        setVoiceName={setVoiceName}
      />
      {validCourse ? (
        <PrepView
          course={validCourse}
          voices={voices}
          voiceName={voiceName}
          jumpToId={jumpToId}
        />
      ) : (
        <div className="wrap">
          <h1 className="home-heading">Choose your path to interview-ready</h1>
          <CourseSelect courses={COURSES} onSelect={selectCourse} />
          <footer>Made for interview practice &middot; works fully offline</footer>
        </div>
      )}
    </>
  )
}