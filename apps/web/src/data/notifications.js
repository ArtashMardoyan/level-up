import { Sparkles, Hexagon, Trophy, Target, Award, Flame, Bell } from 'lucide-react'

// Maps a backend notification `type` to its icon, accent, and i18n keys. The
// server sends type + params (never localized text), so the wording lives here.
// Shared by NotificationBell (header dropdown) and ProfilePage (recent activity).
const TYPE_META = {
  new_questions: {
    titleKey: 'notifNewQuestionsTitle',
    bodyKey: 'notifNewQuestionsBody',
    accent: '#4ade80',
    Icon: Hexagon
  },
  review_milestone: { titleKey: 'notifMilestoneTitle', bodyKey: 'notifMilestoneBody', accent: '#4ade80', Icon: Trophy },
  welcome: { titleKey: 'notifWelcomeTitle', bodyKey: 'notifWelcomeBody', accent: '#818cf8', Icon: Sparkles },
  badge_earned: { titleKey: 'notifBadgeTitle', bodyKey: 'notifBadgeBody', accent: '#fbbf24', Icon: Award },
  streak: { titleKey: 'notifStreakTitle', bodyKey: 'notifStreakBody', accent: '#fbbf24', Icon: Flame },
  daily: { titleKey: 'notifDailyTitle', bodyKey: 'notifDailyBody', accent: '#818cf8', Icon: Target }
}
const FALLBACK = { titleKey: 'notifGenericTitle', bodyKey: 'notifGenericBody', accent: '#818cf8', Icon: Bell }

export function notificationMeta(type) {
  return TYPE_META[type] || FALLBACK
}

// Localized relative time from an ISO timestamp ("2 hours ago" / "вчера").
export function relativeTime(iso, language) {
  const diffSec = Math.round((new Date(iso).getTime() - Date.now()) / 1000)
  const abs = Math.abs(diffSec)
  const rtf = new Intl.RelativeTimeFormat(language, { numeric: 'auto' })
  if (abs < 60) return rtf.format(Math.round(diffSec), 'second')
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour')
  if (abs < 604800) return rtf.format(Math.round(diffSec / 86400), 'day')
  return rtf.format(Math.round(diffSec / 604800), 'week')
}
