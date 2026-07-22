// Resolves a course question's audio S3 key into a playable URL.
//
// The course data stores only the object *key* (e.g.
// "audio/courses/nodejs/en/q1-answer.mp3"); the bucket base lives in
// VITE_S3_BUCKET_URL so moving buckets / to a CDN is an env change, not a data
// change. When the JSONs move to a backend, the key stays the same and only the
// base differs. The fallback keeps production working if the env var is unset.
const S3_BUCKET_URL = import.meta.env.VITE_S3_BUCKET_URL || 'https://levelup-6824c358.s3.us-east-2.amazonaws.com'

/**
 * @param {string | undefined | null} key S3 object key from the course data.
 * @returns {string | null} Full MP3 URL, or null when there is no audio.
 */
export function audioUrl(key) {
  if (!key) return null
  return `${S3_BUCKET_URL}/${key}`
}
