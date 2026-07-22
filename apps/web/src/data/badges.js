import { MessagesSquare, BookCheck, Target, Flame } from 'lucide-react'

// Client-side visual metadata for the achievement badges. The catalog itself
// (which badges exist, their thresholds, who earned them) comes from the backend
// GET /badges; here we only map category -> icon and tier -> accent, and derive
// the i18n keys for each badge's localized name/description (keyed by id).

const CATEGORY_ICON = {
  interview: MessagesSquare,
  review: BookCheck,
  score: Target,
  streak: Flame
}

const TIER_COLOR = {
  bronze: '#d9a066',
  silver: '#b8c0cc',
  gold: '#fbbf24'
}

// Display order of the category groups in the trophy case.
export const BADGE_CATEGORY_ORDER = ['interview', 'score', 'streak', 'review']

export const badgeCategoryTitleKey = (category) => 'badgeCat' + category.charAt(0).toUpperCase() + category.slice(1)

export function badgeIcon(category) {
  return CATEGORY_ICON[category] || Target
}

export function badgeColor(tier) {
  return TIER_COLOR[tier] || '#818cf8'
}

// i18n keys — resolved with t() by the component (ids like "streak_7").
export const badgeNameKey = (id) => 'badgeName_' + id
export const badgeDescKey = (id) => 'badgeDesc_' + id
