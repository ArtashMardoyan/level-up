import { useCallback, useEffect, useState } from 'react'

import { fetchCourses } from '../data/courses'
import { coursesVersion } from '../services/endpoints'

// Stale-while-revalidate cache for course content, keyed per language:
// render the last-saved copy instantly, then cheaply check the content version
// and only refetch the (heavy) payload when it actually changed (e.g. a reseed).
// - memCache: in-memory, avoids re-parsing/refetching within a session.
// - localStorage: survives reloads.
const memCache = new Map()

function storageKey(language) {
  return 'interviewPrepCourses:' + language
}

function loadStored(language) {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey(language)))
    if (parsed && typeof parsed.version === 'string' && Array.isArray(parsed.courses)) return parsed
  } catch {
    // ignore parse/read failures
  }
  return null
}

function saveStored(language, entry) {
  try {
    localStorage.setItem(storageKey(language), JSON.stringify(entry))
  } catch {
    // ignore write failures (quota, storage disabled)
  }
}

function cached(language) {
  return memCache.get(language) || loadStored(language)
}

function resolve(language) {
  const entry = cached(language)
  return entry
    ? { courses: entry.courses, status: 'ready', error: null }
    : { status: 'loading', courses: [], error: null }
}

export function useCourses(language) {
  const [state, setState] = useState(() => resolve(language))
  const [shownLang, setShownLang] = useState(language)
  const [nonce, setNonce] = useState(0)

  // Show the current language's cached copy during render (prev !== next guard).
  if (shownLang !== language) {
    setShownLang(language)
    setState(resolve(language))
  }

  useEffect(() => {
    let active = true
    const entry = cached(language)

    // Version check is best-effort: null means "couldn't determine" (e.g. an
    // older backend without /courses/version), which never blocks content.
    async function currentVersion() {
      try {
        return (await coursesVersion()).version
      } catch {
        return null
      }
    }

    async function sync() {
      if (entry) {
        const version = await currentVersion()
        if (!active) return
        // Same version (or can't check) → keep the cached copy, no heavy fetch.
        if (version === null || version === entry.version) {
          memCache.set(language, entry)
          return
        }
        try {
          const courses = await fetchCourses(language)
          if (!active) return
          store(language, version, courses)
          setState({ status: 'ready', error: null, courses })
        } catch {
          // Refresh failed — keep showing the cached copy.
        }
        return
      }

      // Cold: content is required; version is stored opportunistically for later gating.
      try {
        const courses = await fetchCourses(language)
        if (!active) return
        store(language, (await currentVersion()) || '', courses)
        setState({ status: 'ready', error: null, courses })
      } catch (error) {
        if (active) setState({ status: 'error', courses: [], error })
      }
    }

    sync()
    return () => {
      active = false
    }
  }, [language, nonce])

  const reload = useCallback(() => {
    memCache.delete(language)
    try {
      localStorage.removeItem(storageKey(language))
    } catch {
      // ignore
    }
    setState({ status: 'loading', courses: [], error: null })
    setNonce((n) => n + 1)
  }, [language])

  return { courses: state.courses, status: state.status, error: state.error, reload }
}

function store(language, version, courses) {
  const entry = { version, courses }
  memCache.set(language, entry)
  saveStored(language, entry)
}
