import { useEffect } from 'react'

import { useTheme } from './hooks/useTheme'
import PrepView from './components/PrepView'
import { useSpeech } from './hooks/useSpeech'
import AppHeader from './components/AppHeader'
import AppFooter from './components/AppFooter'
import { useCourses } from './hooks/useCourses'
import { AuthContext } from './auth/AuthContext'
import ProfilePage from './components/ProfilePage'
import { progressBulk } from './services/endpoints'
import { useHashRoute } from './hooks/useHashRoute'
import ActivityPage from './components/ActivityPage'
import CourseSelect from './components/CourseSelect'
import { useAuthState, useAuth } from './hooks/useAuth'
import { LanguageContext } from './i18n/LanguageContext'
import { getDictionaryCategory } from './data/dictionary'
import DictionarySelect from './components/DictionarySelect'
import CourseGridSkeleton from './components/CourseGridSkeleton'
import { useLanguageState, useLanguage } from './hooks/useLanguage'
import DictionaryCategoryPage from './components/DictionaryCategoryPage'

const COURSE_STORAGE_KEY = 'interviewPrepCourse'
const PROGRESS_KEY_PREFIX = 'interviewPrepState:'

// One-time push of any anonymous (localStorage) progress to the backend after
// the first sign-in. localStorage keys progress by question ref (q1); the API
// keys it by uuid, so map ref -> uuid using the loaded courses. Best-effort:
// on failure we keep the local data and the flag unset so it retries next time.
async function migrateLocalProgress(courses, userId) {
  const flag = 'interviewPrepMigrated:' + userId
  const uuidByRefByCourse = new Map()
  for (const c of courses) {
    const refs = new Map()
    for (const q of c.questions) refs.set(q.id, q.uuid)
    uuidByRefByCourse.set(c.id, refs)
  }

  const reviewedIds = []
  const favoriteIds = []
  const keys = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key || !key.startsWith(PROGRESS_KEY_PREFIX)) continue
      keys.push(key)
      const refs = uuidByRefByCourse.get(key.slice(PROGRESS_KEY_PREFIX.length))
      if (!refs) continue
      const parsed = JSON.parse(localStorage.getItem(key))
      for (const ref of parsed?.reviewed || []) if (refs.get(ref)) reviewedIds.push(refs.get(ref))
      for (const ref of parsed?.favorites || []) if (refs.get(ref)) favoriteIds.push(refs.get(ref))
    }
  } catch {
    return
  }

  try {
    if (reviewedIds.length || favoriteIds.length) await progressBulk({ reviewedIds, favoriteIds })
    localStorage.setItem(flag, '1')
    for (const key of keys) localStorage.removeItem(key)
  } catch {
    /* leave local data intact; retry on next sign-in */
  }
}

function AppContent() {
  const { language, t } = useLanguage()
  const { toggleTheme, theme } = useTheme()
  const { voices } = useSpeech()
  const { courseId, jumpToId, navigate } = useHashRoute()
  const { courses, status, reload } = useCourses(language)
  const { status: authStatus, user } = useAuth()

  // No course in the URL yet (fresh visit) - resume the last one, once courses
  // are loaded so we can validate the saved id.
  useEffect(() => {
    if (status !== 'ready' || courseId) return
    let saved = null
    try {
      saved = localStorage.getItem(COURSE_STORAGE_KEY)
    } catch {
      /* ignore */
    }
    if (!saved) return
    if (saved === 'dictionary' || courses.some((c) => c.id === saved && c.questions.length > 0)) navigate(saved)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  useEffect(() => {
    try {
      if (courseId) localStorage.setItem(COURSE_STORAGE_KEY, courseId)
      else localStorage.removeItem(COURSE_STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }, [courseId])

  // Migrate anonymous progress to the account on first sign-in.
  useEffect(() => {
    if (authStatus !== 'authed' || !user || status !== 'ready') return
    let done = false
    try {
      done = localStorage.getItem('interviewPrepMigrated:' + user.id) === '1'
    } catch {
      /* ignore */
    }
    if (!done) migrateLocalProgress(courses, user.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus, user, status])

  const selectCourse = (id, questionId = null) => navigate(id, questionId)
  const backToCourses = () => navigate(null)

  const isDictionary = courseId === 'dictionary'
  const isProfile = courseId === 'profile'
  const isActivity = courseId === 'activity'
  const course = courseId && !isDictionary ? courses.find((c) => c.id === courseId) || null : null
  const validCourse = course?.questions?.length > 0 ? course : null
  const dictionaryCategory = isDictionary ? getDictionaryCategory(jumpToId) : null
  const showDictionaryCategory = isDictionary && dictionaryCategory

  return (
    <>
      <AppHeader
        onViewActivity={() => navigate('activity')}
        onViewProfile={() => navigate('profile')}
        onSelectQuestion={selectCourse}
        toggleTheme={toggleTheme}
        onHome={backToCourses}
        courses={courses}
        theme={theme}
      />
      {showDictionaryCategory ? (
        <DictionaryCategoryPage onNavigate={navigate} categoryId={jumpToId} voices={voices} />
      ) : isActivity ? (
        <ActivityPage onNavigate={navigate} />
      ) : isProfile ? (
        <ProfilePage onNavigate={navigate} courses={courses} />
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
          ) : status === 'loading' ? (
            <CourseGridSkeleton />
          ) : status === 'error' ? (
            <div className="empty">
              <p>{t('coursesError')}</p>
              <button className="plain-btn" onClick={reload}>
                {t('retry')}
              </button>
            </div>
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
