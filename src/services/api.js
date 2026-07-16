import { getToken } from './authToken'

// Vite exposes only VITE_-prefixed vars. Falls back to the local backend.
const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '')

// Thrown for every non-2xx response (and network failures, with status 0).
export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

// The backend wraps success in { data } and errors in { error }.
async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      body: body === undefined ? undefined : JSON.stringify(body),
      headers,
      method
    })
  } catch {
    throw new ApiError(0, 'network error')
  }

  if (res.status === 204) return null

  let payload
  try {
    payload = await res.json()
  } catch {
    payload = null
  }

  if (!res.ok) {
    throw new ApiError(res.status, payload?.error || `request failed (${res.status})`)
  }

  return payload?.data
}

export const apiGet = (path) => request('GET', path)
export const apiPost = (path, body) => request('POST', path, body)
export const apiPatch = (path, body) => request('PATCH', path, body)
export const apiDelete = (path) => request('DELETE', path)
