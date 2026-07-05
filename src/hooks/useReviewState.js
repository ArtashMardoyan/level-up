import { useCallback, useState } from 'react'

function storageKey(courseId) {
  return 'interviewPrepState:' + courseId
}

function loadState(courseId) {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey(courseId)))
    return {
      favorites: Array.isArray(parsed?.favorites) ? parsed.favorites : [],
      reviewed: Array.isArray(parsed?.reviewed) ? parsed.reviewed : [],
    }
  } catch {
    return { favorites: [], reviewed: [] }
  }
}

function saveState(courseId, state) {
  try {
    localStorage.setItem(storageKey(courseId), JSON.stringify(state))
  } catch {
    // ignore write failures (e.g. storage disabled)
  }
}

export function useReviewState(courseId) {
  const [state, setState] = useState(() => loadState(courseId))

  const toggleFavorite = useCallback((id) => {
    setState((prev) => {
      const isFav = prev.favorites.includes(id)
      const favorites = isFav
        ? prev.favorites.filter((x) => x !== id)
        : [...prev.favorites, id]
      const next = { ...prev, favorites }
      saveState(courseId, next)
      return next
    })
  }, [courseId])

  const toggleReviewed = useCallback((id) => {
    setState((prev) => {
      const isReviewed = prev.reviewed.includes(id)
      const reviewed = isReviewed
        ? prev.reviewed.filter((x) => x !== id)
        : [...prev.reviewed, id]
      const next = { ...prev, reviewed }
      saveState(courseId, next)
      return next
    })
  }, [courseId])

  const markReviewed = useCallback((id) => {
    setState((prev) => {
      if (prev.reviewed.includes(id)) return prev
      const next = { ...prev, reviewed: [...prev.reviewed, id] }
      saveState(courseId, next)
      return next
    })
  }, [courseId])

  return { state, toggleFavorite, toggleReviewed, markReviewed }
}
