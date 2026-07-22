import { useCallback, useContext, useEffect, useState } from 'react'

import { AuthContext } from '../auth/AuthContext'
import { clearToken, getToken, setToken } from '../services/authToken'
import { usersCreate, authLogout, authLogin, authMe } from '../services/endpoints'

// Owner side — called exactly once, in App, to create the context value.
// status: 'idle' (signed out) | 'loading' (hydrating from a stored token) | 'authed'
export function useAuthState() {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState(() => (getToken() ? 'loading' : 'idle'))
  const [error, setError] = useState(null)

  // Restore the session from a stored token on first load.
  useEffect(() => {
    if (!getToken()) return
    let active = true
    authMe()
      .then((u) => {
        if (!active) return
        setUser(u)
        setStatus('authed')
      })
      .catch(() => {
        if (!active) return
        clearToken()
        setUser(null)
        setStatus('idle')
      })
    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async ({ password, email }) => {
    setError(null)
    try {
      const result = await authLogin(email, password)
      setToken(result.accessToken)
      setUser(result.user)
      setStatus('authed')
      return result.user
    } catch (e) {
      setError(e.message)
      throw e
    }
  }, [])

  const register = useCallback(
    async ({ password, email, name, age }) => {
      setError(null)
      try {
        await usersCreate({ password, email, name, age })
      } catch (e) {
        setError(e.message)
        throw e
      }
      return login({ password, email })
    },
    [login]
  )

  const logout = useCallback(() => {
    // Optimistic: drop the session immediately so sign-out feels instant. The
    // server-side revoke fires in the background (authLogout reads the token
    // before we clear it), and the token is dropped once it settles.
    setUser(null)
    setStatus('idle')
    setError(null)
    authLogout()
      .catch(() => {})
      .finally(clearToken)
  }, [])

  const clearError = useCallback(() => setError(null), [])

  // Merge freshly-saved fields into the cached user so the header avatar /
  // name and any open profile stay in sync after an edit (e.g. usersUpdate).
  const updateUser = useCallback((next) => {
    setUser((prev) => (prev ? { ...prev, ...next } : prev))
  }, [])

  return { updateUser, clearError, register, status, logout, error, login, user }
}

// Consumer side — any component that needs the auth state or actions.
export function useAuth() {
  return useContext(AuthContext)
}
