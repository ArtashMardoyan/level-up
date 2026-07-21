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

// The backend wraps success in { data } and errors in { error }. formData (when
// given) is sent as-is with no Content-Type — the browser sets the multipart
// boundary; JSON is used otherwise.
async function request(method, path, { formData, json } = {}) {
  const headers = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let body
  if (formData) {
    body = formData
  } else if (json !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(json)
  }

  let res
  try {
    res = await fetch(`${BASE_URL}${path}`, { headers, method, body })
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
export const apiPost = (path, body) => request('POST', path, { json: body })
export const apiPatch = (path, body) => request('PATCH', path, { json: body })
export const apiDelete = (path) => request('DELETE', path)
export const apiUpload = (path, formData) => request('POST', path, { formData })

// Parse one Server-Sent Events frame ("event: <name>\ndata: <json>") into
// { event, data }, or null if it carries no data line. data is JSON-parsed.
function parseSSEFrame(frame) {
  let event = 'message'
  const dataLines = []
  for (const line of frame.split('\n')) {
    if (line.startsWith('event:')) event = line.slice(6).trim()
    else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim())
  }
  if (dataLines.length === 0) return null

  let data = null
  try {
    data = JSON.parse(dataLines.join('\n'))
  } catch {
    /* non-JSON data — leave data null */
  }
  return { event, data }
}

// Streaming counterpart to request(): POSTs JSON with the same Bearer auth and
// base URL, but reads the response body as a Server-Sent Events stream and calls
// onEvent({ event, data }) per frame. Resolves when the stream ends. A pre-stream
// failure — the backend returns a normal JSON { error } before streaming starts —
// rejects with ApiError, so callers handle it exactly like a one-shot request
// (docs/ai-chat/006/007). Pass an AbortSignal to cancel; an abort rejects with the
// DOMException, which callers can detect via signal.aborted.
export async function requestStream(path, { onEvent, signal, json } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${BASE_URL}${path}`, { body: JSON.stringify(json), method: 'POST', headers, signal })
  } catch (err) {
    if (err?.name === 'AbortError') throw err
    throw new ApiError(0, 'network error')
  }

  if (!res.ok || !res.body) {
    let payload
    try {
      payload = await res.json()
    } catch {
      payload = null
    }
    throw new ApiError(res.status, payload?.error || `request failed (${res.status})`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    // Frames are separated by a blank line; flush every complete one.
    let sep
    while ((sep = buffer.indexOf('\n\n')) !== -1) {
      const frame = buffer.slice(0, sep)
      buffer = buffer.slice(sep + 2)
      const evt = parseSSEFrame(frame)
      if (evt) onEvent?.(evt)
    }
  }
}
