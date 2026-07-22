// Marketing route map: hash slug -> page key. The empty hash ('#') is the public
// Home. These slugs are reserved and must not collide with course slugs or the
// app's reserved views (courses, dictionary, profile, activity, interview).
const MARKETING_ROUTES = {
  features: 'features',
  vision: 'vision',
  '': 'home',
  faq: 'faq'
}

// Returns the marketing page key for a hash courseId, or null if the hash belongs
// to the application (e.g. 'interview', a course slug, 'dictionary', …).
export function marketingPageFor(courseId) {
  return MARKETING_ROUTES[courseId ?? ''] ?? null
}
