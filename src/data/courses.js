import { coursesFull } from '../services/endpoints'

// The backend is the single source of course content. Normalization keeps the
// human key as the UI `id` (course slug, question ref) so URLs stay `#go/q1`
// and localStorage/icons keep working, while the real uuid is stashed on
// `uuid` for progress API calls.
function normalizeQuestion(q) {
  return {
    question: q.question,
    module: q.module,
    answer: q.answer,
    bonus: q.bonus,
    audio: q.audio,
    uuid: q.id,
    id: q.ref
  }
}

function normalizeCourse(course) {
  return {
    questions: (course.questions || []).map(normalizeQuestion),
    subtitle: course.subtitle,
    accent: course.accent,
    title: course.title,
    emoji: course.emoji,
    id: course.slug,
    uuid: course.id
  }
}

// Fetch every course with its questions (localized to `language`) in one call.
export async function fetchCourses(language) {
  const data = await coursesFull(language)
  return (data || []).map(normalizeCourse)
}
