import { MessageSquare, TrendingUp, SquarePen, BookOpen, Volume2, Target, User, Star } from 'lucide-react'

// Maps each dictionary category to its lucide line icon (see the design handoff).
const ICONS = {
  interviewPhrases: MessageSquare,
  wordsToUseMore: TrendingUp,
  todaysChallenge: Target,
  grammarFixes: SquarePen,
  sentenceOfTheDay: Star,
  pronunciation: Volume2,
  vocabulary: BookOpen,
  leadership: User
}

export default function DictionaryIcon({ categoryId, size = 22 }) {
  const Icon = ICONS[categoryId] || BookOpen
  return <Icon aria-hidden="true" strokeWidth={1.8} size={size} />
}
