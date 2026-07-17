import { apiDelete, apiPatch, apiPost, apiGet } from './api'

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

// Progress (per-user, auth required)
export const progressSummary = () => apiGet('/progress/summary')
export const progressBulk = (payload) => apiPost('/progress/bulk', payload)
export const courseProgress = (courseId) => apiGet(`/courses/${courseId}/progress`)
export const progressUpsert = (questionId, payload) => apiPatch(`/questions/${questionId}/progress`, payload)
