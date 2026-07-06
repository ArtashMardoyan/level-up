import { useCallback, useEffect, useState } from 'react'

function parseHash() {
  const raw = window.location.hash.replace(/^#/, '')
  if (!raw) return { courseId: null, jumpToId: null }
  const [courseId, questionId] = raw.split('/').map((s) => decodeURIComponent(s))
  return { jumpToId: questionId || null, courseId: courseId || null }
}

export function useHashRoute() {
  const [route, setRoute] = useState(parseHash)

  useEffect(() => {
    const handleHashChange = () => setRoute(parseHash())
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const navigate = useCallback((courseId, questionId = null) => {
    const nextHash = courseId
      ? '#' + encodeURIComponent(courseId) + (questionId ? '/' + encodeURIComponent(questionId) : '')
      : '#'
    if (window.location.hash === nextHash) {
      setRoute({ jumpToId: questionId, courseId })
    } else {
      window.location.hash = nextHash
    }
  }, [])

  return { courseId: route.courseId, jumpToId: route.jumpToId, navigate }
}
