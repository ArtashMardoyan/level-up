import { useCallback, useEffect, useState, useMemo } from 'react'

import { useAuth } from './useAuth'
import { courseProgress, progressUpsert, progressBulk } from '../services/endpoints'

// Progress is keyed by question `ref` (q1) in the UI/localStorage. Signed-in
// users persist to the backend (keyed by question uuid), anonymous users keep
// using localStorage exactly as before. `questions` carries both ids so we can
// translate ref <-> uuid at the API boundary.

function storageKey(courseId) {
  return 'interviewPrepState:' + courseId
}

function loadLocal(courseId) {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey(courseId)))
    return {
      favorites: Array.isArray(parsed?.favorites) ? parsed.favorites : [],
      reviewed: Array.isArray(parsed?.reviewed) ? parsed.reviewed : []
    }
  } catch {
    return { favorites: [], reviewed: [] }
  }
}

function saveLocal(courseId, state) {
  try {
    localStorage.setItem(storageKey(courseId), JSON.stringify(state))
  } catch {
    // ignore write failures (e.g. storage disabled)
  }
}

function initialState(courseId, signedIn) {
  return signedIn ? { favorites: [], reviewed: [] } : loadLocal(courseId)
}

export function useReviewState(courseId, questions) {
  const { user } = useAuth()
  const signedIn = !!user

  const uuidByRef = useMemo(() => {
    const map = new Map()
    for (const q of questions || []) map.set(q.id, q.uuid)
    return map
  }, [questions])

  const refByUuid = useMemo(() => {
    const map = new Map()
    for (const q of questions || []) map.set(q.uuid, q.id)
    return map
  }, [questions])

  const [state, setState] = useState(() => initialState(courseId, signedIn))
  const [key, setKey] = useState(courseId + ':' + signedIn)

  // Reset to the right baseline during render when the course or auth changes
  // (prev !== next guard). Anonymous reads localStorage synchronously; signed-in
  // starts empty and the effect below hydrates from the backend.
  const currentKey = courseId + ':' + signedIn
  if (key !== currentKey) {
    setKey(currentKey)
    setState(initialState(courseId, signedIn))
  }

  // Hydrate from the backend (async → allowed in the effect callback).
  useEffect(() => {
    if (!signedIn) return

    let active = true
    courseProgress(courseId)
      .then((data) => {
        if (!active) return
        const reviewed = (data?.reviewedIds || []).map((u) => refByUuid.get(u)).filter(Boolean)
        const favorites = (data?.favoriteIds || []).map((u) => refByUuid.get(u)).filter(Boolean)
        setState({ favorites, reviewed })
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [courseId, signedIn, refByUuid])

  const toggleFavorite = useCallback(
    (id) => {
      const isFav = state.favorites.includes(id)
      const favorites = isFav ? state.favorites.filter((x) => x !== id) : [...state.favorites, id]
      const next = { ...state, favorites }
      setState(next)
      if (signedIn) {
        const uuid = uuidByRef.get(id)
        if (uuid) progressUpsert(uuid, { favorite: !isFav }).catch(() => {})
      } else {
        saveLocal(courseId, next)
      }
    },
    [state, courseId, signedIn, uuidByRef]
  )

  const toggleReviewed = useCallback(
    (id) => {
      const isReviewed = state.reviewed.includes(id)
      const reviewed = isReviewed ? state.reviewed.filter((x) => x !== id) : [...state.reviewed, id]
      const next = { ...state, reviewed }
      setState(next)
      if (signedIn) {
        const uuid = uuidByRef.get(id)
        if (uuid) progressUpsert(uuid, { reviewed: !isReviewed }).catch(() => {})
      } else {
        saveLocal(courseId, next)
      }
    },
    [state, courseId, signedIn, uuidByRef]
  )

  const markReviewed = useCallback(
    (id) => {
      if (state.reviewed.includes(id)) return
      const next = { ...state, reviewed: [...state.reviewed, id] }
      setState(next)
      if (signedIn) {
        const uuid = uuidByRef.get(id)
        if (uuid) progressUpsert(uuid, { reviewed: true }).catch(() => {})
      } else {
        saveLocal(courseId, next)
      }
    },
    [state, courseId, signedIn, uuidByRef]
  )

  // Batch mark (e.g. "expand all") — one request instead of N.
  const markManyReviewed = useCallback(
    (ids) => {
      const seen = new Set(state.reviewed)
      const added = ids.filter((id) => !seen.has(id))
      if (!added.length) return
      const next = { ...state, reviewed: [...state.reviewed, ...added] }
      setState(next)
      if (signedIn) {
        const reviewedIds = added.map((id) => uuidByRef.get(id)).filter(Boolean)
        if (reviewedIds.length) progressBulk({ favoriteIds: [], reviewedIds }).catch(() => {})
      } else {
        saveLocal(courseId, next)
      }
    },
    [state, courseId, signedIn, uuidByRef]
  )

  return { markManyReviewed, toggleFavorite, toggleReviewed, markReviewed, state }
}
