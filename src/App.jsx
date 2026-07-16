import { useEffect } from 'react'

import { useTheme } from './hooks/useTheme'
import PrepView from './components/PrepView'
import { useSpeech } from './hooks/useSpeech'
import AppHeader from './components/AppHeader'
import AppFooter from './components/AppFooter'
import { useAuthState } from './hooks/useAuth'
import { AuthContext } from './auth/AuthContext'
import { useHashRoute } from './hooks/useHashRoute'
import CourseSelect from './components/CourseSelect'
import { LanguageContext } from './i18n/LanguageContext'
import { getDictionaryCategory } from './data/dictionary'
import DictionarySelect from './components/DictionarySelect'
import { useLanguageState, useLanguage } from './hooks/useLanguage'
import DictionaryCategoryPage from './components/DictionaryCategoryPage'
import { getLocalizedCourses, getLocalizedCourse, getCourse } from './data/courses'

const COURSE_STORAGE_KEY = 'interviewPrepCourse'

function loadSelectedCourseId() {
  try {
    const id = localStorage.getItem(COURSE_STORAGE_KEY)
    if (id === 'dictionary') return id
    return getCourse(id)?.questions?.length > 0 ? id : null
  } catch {
    return null
  }
}

function AppContent() {
  const { language, t } = useLanguage()
  const { toggleTheme, theme } = useTheme()
  const { voices } = useSpeech()
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
  const isDictionary = courseId === 'dictionary'
  const course = courseId && !isDictionary ? getLocalizedCourse(courseId, language) : null
  const validCourse = course?.questions?.length > 0 ? course : null
  const dictionaryCategory = isDictionary ? getDictionaryCategory(jumpToId) : null
  const showDictionaryCategory = isDictionary && dictionaryCategory

  return (
    <>
      <AppHeader
        onSelectQuestion={selectCourse}
        toggleTheme={toggleTheme}
        onHome={backToCourses}
        courses={courses}
        theme={theme}
      />
      {showDictionaryCategory ? (
        <DictionaryCategoryPage onNavigate={navigate} categoryId={jumpToId} voices={voices} />
      ) : validCourse ? (
        <PrepView
          key={language + ':' + validCourse.id}
          onNavigate={navigate}
          course={validCourse}
          jumpToId={jumpToId}
          courses={courses}
          voices={voices}
        />
      ) : (
        <main className="home">
          <div className="home-eyebrow">{t('homeEyebrow', { n: courses.length })}</div>
          <h1 className="home-heading">{t('homeHeading')}</h1>
          <p className="home-subtitle">{t('homeSubtitle')}</p>
          <div className="segmented home-tabs">
            <button className={'segmented-btn' + (isDictionary ? '' : ' active')} onClick={backToCourses}>
              {t('tabCourses')}
            </button>
            <button
              className={'segmented-btn' + (isDictionary ? ' active' : '')}
              onClick={() => selectCourse('dictionary')}
            >
              {t('tabDictionary')}
            </button>
          </div>
          {isDictionary ? (
            <DictionarySelect onSelect={(id) => navigate('dictionary', id)} />
          ) : (
            <CourseSelect onSelect={selectCourse} courses={courses} />
          )}
          <AppFooter onNavigate={navigate} />
        </main>
      )}
    </>
  )
}

export default function App() {
  const languageState = useLanguageState()
  const authState = useAuthState()

  return (
    <LanguageContext.Provider value={languageState}>
      <AuthContext.Provider value={authState}>
        <AppContent />
      </AuthContext.Provider>
    </LanguageContext.Provider>
  )
}
