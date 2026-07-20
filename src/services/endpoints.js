import { apiDelete, apiUpload, apiPatch, apiPost, apiGet } from './api'

// One thin wrapper per backend route. The UI uses the auth subset today; the
// rest are ready to wire up as features land.

// Auth
export const authMe = () => apiGet('/auth/me')
export const authLogout = () => apiPost('/auth/logout')
export const authLogin = (email, password) => apiPost('/auth/login', { password, email })

// Users
export const usersDelete = () => apiDelete('/users')
export const usersGet = (id) => apiGet(`/users/${id}`)
export const usersUpdate = (payload) => apiPatch('/users', payload)
export const usersCreate = (payload) => apiPost('/users', payload)
export const usersList = (page = 1, limit = 10) => apiGet(`/users?page=${page}&limit=${limit}`)

// Courses (public content)
export const coursesFull = (lang) => apiGet(`/courses/full?lang=${lang}`)
export const coursesVersion = () => apiGet('/courses/version')

// Notifications (per-user, auth required). "seen" clears the badge (opening the
// list); "read" is acting on an item (click / mark-all-read). Reading implies seen.
export const notificationsList = (page = 1, limit = 10) => apiGet(`/notifications?page=${page}&limit=${limit}`)
export const notificationsUnseenCount = () => apiGet('/notifications/unseen-count')
export const notificationsMarkAllSeen = () => apiPatch('/notifications/seen')
export const notificationsMarkAllRead = () => apiPatch('/notifications/read')
export const notificationsMarkRead = (id) => apiPatch(`/notifications/${id}/read`)

// Achievement badges (per-user, auth required). Returns the full code-defined
// catalog with this user's earn status (earned + earnedAt, or locked).
export const badgesList = () => apiGet('/badges')

// AI Interview Coach (per-user, auth required). A chat interview: start a
// session, submit each answer (evaluated on submit), then complete to aggregate
// the final report. See docs/interview in the backend repo.
export const interviewGet = (id) => apiGet(`/interviews/${id}`)
export const interviewReport = (id) => apiGet(`/interviews/${id}/report`)
export const interviewComplete = (id) => apiPost(`/interviews/${id}/complete`)
export const interviewsCreate = (payload) => apiPost('/interviews', payload)
export const interviewsList = (page = 1, limit = 10) => apiGet(`/interviews?page=${page}&limit=${limit}`)
export const interviewsSummary = () => apiGet('/interviews/summary')
export const interviewTranscribe = (audioBlob, language) => {
  const form = new FormData()
  form.append('audio', audioBlob, 'answer.webm')
  // Pin Whisper to the interview language so Russian speech isn't transcribed as English.
  if (language) form.append('language', language)
  return apiUpload('/interviews/transcribe', form)
}
export const interviewSubmitAnswer = (id, questionId, payload) =>
  apiPost(`/interviews/${id}/answers/${questionId}`, payload)

// Progress (per-user, auth required)
export const progressSummary = () => apiGet('/progress/summary')
export const progressBulk = (payload) => apiPost('/progress/bulk', payload)
export const courseProgress = (courseId) => apiGet(`/courses/${courseId}/progress`)
export const progressUpsert = (questionId, payload) => apiPatch(`/questions/${questionId}/progress`, payload)
