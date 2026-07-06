import { useEffect } from 'react'

import { useTheme } from './hooks/useTheme'
import PrepView from './components/PrepView'
import { useSpeech } from './hooks/useSpeech'
import AppHeader from './components/AppHeader'
import { useHashRoute } from './hooks/useHashRoute'
import CourseSelect from './components/CourseSelect'
import { LanguageContext } from './i18n/LanguageContext'
import { useLanguageState, useLanguage } from './hooks/useLanguage'
import { getLocalizedCourses, getLocalizedCourse, getCourse } from './data/courses'

const COURSE_STORAGE_KEY = 'interviewPrepCourse'

function loadSelectedCourseId() {
  try {
    const id = localStorage.getItem(COURSE_STORAGE_KEY)
    return getCourse(id)?.questions?.length > 0 ? id : null
  } catch {
    return null
  }
}

function AppContent() {
  const { language, t } = useLanguage()
  const { toggleTheme, theme } = useTheme()
  const { setVoiceName, voiceName, voices } = useSpeech(language)
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
    } catch {
      /* ignore */
    }
  }, [courseId])

  const selectCourse = (id, questionId = null) => navigate(id, questionId)
  const backToCourses = () => navigate(null)

  const courses = getLocalizedCourses(language)
  const course = courseId ? getLocalizedCourse(courseId, language) : null
  const validCourse = course?.questions?.length > 0 ? course : null

  return (
    <>
      <AppHeader
        onSelectQuestion={selectCourse}
        setVoiceName={setVoiceName}
        toggleTheme={toggleTheme}
        onHome={backToCourses}
        voiceName={voiceName}
        courses={courses}
        voices={voices}
        theme={theme}
      />
      {validCourse ? (
        <PrepView
          key={language + ':' + validCourse.id}
          voiceName={voiceName}
          course={validCourse}
          jumpToId={jumpToId}
          voices={voices}
        />
      ) : (
        <div className="wrap">
          <h1 className="home-heading">{t('homeHeading')}</h1>
          <CourseSelect onSelect={selectCourse} courses={courses} />
          <footer>{t('footer')}</footer>
        </div>
      )}
    </>
  )
}

export default function App() {
  const languageState = useLanguageState()

  return (
    <LanguageContext.Provider value={languageState}>
      <AppContent />
    </LanguageContext.Provider>
  )
}
