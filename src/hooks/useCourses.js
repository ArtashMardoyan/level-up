import { useCallback, useEffect, useState } from 'react'

import { fetchCourses } from '../data/courses'

// Cache the assembled course list per language so switching back and forth (or
// remounting) doesn't refetch. Module-level so it survives component unmounts.
const cache = new Map()

function resolve(language) {
  return cache.has(language)
    ? { courses: cache.get(language), status: 'ready', error: null }
    : { status: 'loading', courses: [], error: null }
}

export function useCourses(language) {
  const [state, setState] = useState(() => resolve(language))
  const [shownLang, setShownLang] = useState(language)
  const [nonce, setNonce] = useState(0)

  // Sync to the current language during render (prev !== next guard) instead of
  // in an effect, so a cache hit shows instantly without a cascading render.
  if (shownLang !== language) {
    setShownLang(language)
    setState(resolve(language))
  }

  // Fetch only when the language isn't cached yet. setState happens in the async
  // callback, never synchronously in the effect body.
  useEffect(() => {
    if (cache.has(language)) return

    let active = true
    fetchCourses(language)
      .then((data) => {
        if (!active) return
        cache.set(language, data)
        setState({ status: 'ready', courses: data, error: null })
      })
      .catch((error) => {
        if (active) setState({ status: 'error', courses: [], error })
      })

    return () => {
      active = false
    }
  }, [language, nonce])

  const reload = useCallback(() => {
    cache.delete(language)
    setState({ status: 'loading', courses: [], error: null })
    setNonce((n) => n + 1)
  }, [language])

  return { courses: state.courses, status: state.status, error: state.error, reload }
}
